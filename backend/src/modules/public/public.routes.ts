import { Router, type Request, type Response, type NextFunction } from 'express'
import { prisma } from '../../config/prisma.js'
import { hashToken } from '../../utils/crypto.js'
import { verifyPassword } from '../../utils/password.js'
import { createRateLimiter } from '../../middleware/rate-limit.middleware.js'
import { streamProviderFile } from '../files/stream-file.js'
import { logAudit } from '../../utils/audit.js'

export const publicRouter = Router()

const publicShareLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: 'Too many share link requests. Please try again later.',
})

const publicUnlockLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many password attempts. Please try again later.',
})

publicRouter.use(publicShareLimiter)

type ShareWithFile = Awaited<ReturnType<typeof loadShareByToken>>

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const list: Record<string, string> = {}
  if (!cookieHeader) return list
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=')
    const key = parts.shift()?.trim()
    if (!key) return
    list[key] = decodeURIComponent(parts.join('=').trim())
  })
  return list
}

function httpError(statusCode: number, code: string, message: string) {
  const error = new Error(message) as Error & { statusCode: number; code: string }
  error.statusCode = statusCode
  error.code = code
  return error
}

function unlockCookieName(shareId: string) {
  return `casanest_share_unlock_${shareId}`
}

function isShareUnlocked(req: Request, shareId: string) {
  const cookies = parseCookies(req.headers.cookie)
  return cookies[unlockCookieName(shareId)] === '1'
}

function setUnlockCookie(res: Response, shareId: string) {
  // 2 hours unlock window for this share on this browser
  const maxAge = 2 * 60 * 60
  const secure = process.env.COOKIE_SECURE === 'true'
  const parts = [
    `${unlockCookieName(shareId)}=1`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (secure) parts.push('Secure')
  res.append('Set-Cookie', parts.join('; '))
}

async function loadShareByToken(token: string) {
  const tokenHash = hashToken(token)
  return prisma.fileShare.findFirst({
    where: {
      enabled: true,
      OR: [{ token }, { tokenHash }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
    },
    include: {
      file: {
        include: {
          connectedAccount: true,
        },
      },
    },
  })
}

async function resolveShare(req: Request, options: { requireDownload?: boolean; requireUnlocked?: boolean } = {}) {
  const token = String(req.params.token || '')
  if (!token) throw httpError(400, 'SHARE_TOKEN_REQUIRED', 'Share token is required.')

  const share = await loadShareByToken(token)
  if (!share || share.file.status !== 'active') {
    throw httpError(404, 'SHARE_NOT_FOUND', 'Shared file not found, expired, or disabled.')
  }

  if (options.requireDownload && !share.allowDownload) {
    throw httpError(403, 'DOWNLOAD_DISABLED', 'Download is disabled for this share link.')
  }

  if (options.requireUnlocked !== false && share.passwordHash && !isShareUnlocked(req, share.id)) {
    throw httpError(401, 'SHARE_PASSWORD_REQUIRED', 'Password required to open this shared file.')
  }

  return share
}

function publicFilePayload(share: NonNullable<ShareWithFile>) {
  // Public clients only need presentation metadata for THIS one file.
  // Never expose owner ids, folders, connected accounts, or other files.
  return {
    name: share.file.name,
    mimeType: share.file.mimeType,
    sizeBytes: share.file.sizeBytes.toString(),
    createdAt: share.file.createdAt,
    allowDownload: share.allowDownload,
    expiresAt: share.expiresAt,
    hasPassword: Boolean(share.passwordHash),
  }
}

publicRouter.get('/files/:token', async (req, res, next) => {
  try {
    // Browser navigation (Accept: text/html) should open the React viewer, not raw JSON.
    // Host nginx proxies /public/* to the API, so redirect HTML hits to /share/:token.
    const accept = String(req.headers.accept || '')
    const wantsHtml = accept.includes('text/html')
    const isApiSubpath = false
    if (wantsHtml && !isApiSubpath) {
      const token = encodeURIComponent(String(req.params.token || ''))
      return res.redirect(302, `/share/${token}`)
    }

    const share = await resolveShare(req, { requireUnlocked: false })
    const locked = Boolean(share.passwordHash) && !isShareUnlocked(req, share.id)

    if (locked) {
      return res.status(401).json({
        code: 'SHARE_PASSWORD_REQUIRED',
        message: 'Password required to open this shared file.',
        hasPassword: true,
        file: {
          name: share.file.name,
          mimeType: share.file.mimeType,
          sizeBytes: share.file.sizeBytes.toString(),
          allowDownload: share.allowDownload,
          expiresAt: share.expiresAt,
          hasPassword: true,
        },
      })
    }

    // Count a successful metadata open as a view (best-effort)
    prisma.fileShare
      .update({ where: { id: share.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined)

    return res.json({
      file: publicFilePayload(share),
      share: {
        allowDownload: share.allowDownload,
        expiresAt: share.expiresAt,
        hasPassword: Boolean(share.passwordHash),
      },
    })
  } catch (error) {
    return next(error)
  }
})

publicRouter.post('/files/:token/unlock', publicUnlockLimiter, async (req, res, next) => {
  try {
    const share = await resolveShare(req, { requireUnlocked: false })
    if (!share.passwordHash) {
      return res.json({ status: 'ok', unlocked: true, file: publicFilePayload(share) })
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!password) throw httpError(400, 'PASSWORD_REQUIRED', 'Password is required.')

    const ok = await verifyPassword(share.passwordHash, password)
    if (!ok) throw httpError(401, 'INVALID_SHARE_PASSWORD', 'Incorrect password.')

    setUnlockCookie(res, share.id)

    prisma.fileShare
      .update({ where: { id: share.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined)

    await logAudit({
      userId: null,
      action: 'share.unlock',
      entityType: 'file_share',
      entityId: share.id,
      metadata: { fileId: share.fileId },
    })

    return res.json({ status: 'ok', unlocked: true, file: publicFilePayload(share) })
  } catch (error) {
    return next(error)
  }
})

publicRouter.get('/files/:token/download', async (req, res, next) => {
  try {
    const share = await resolveShare(req, { requireDownload: true, requireUnlocked: true })
    prisma.fileShare
      .update({ where: { id: share.id }, data: { downloadCount: { increment: 1 } } })
      .catch(() => undefined)
    return streamProviderFile(share.file, req.headers.range, res, { disposition: 'attachment' })
  } catch (error) {
    return next(error)
  }
})

publicRouter.get('/files/:token/preview', async (req, res, next) => {
  try {
    const share = await resolveShare(req, { requireUnlocked: true })
    return streamProviderFile(share.file, req.headers.range, res, { disposition: 'inline' })
  } catch (error) {
    return next(error)
  }
})
