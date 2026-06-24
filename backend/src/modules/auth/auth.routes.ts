import { Router } from 'express'
import { google } from 'googleapis'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.middleware.js'
import { hashPassword, verifyPassword } from '../../utils/password.js'
import { decryptText, encryptText, hashToken, randomToken } from '../../utils/crypto.js'
import { signAccessToken } from '../../utils/jwt.js'
import { createOAuthClient, syncGoogleQuota, validateGoogleConfig } from '../google/google.service.js'
import { createRateLimiter } from '../../middleware/rate-limit.middleware.js'

export const authRouter = Router()

const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again in a minute.',
})

const registerSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), captchaToken: z.string().optional() })
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
const refreshSchema = z.object({ refreshToken: z.string().min(1) })
const googleExchangeSchema = z.object({ token: z.string().min(1) })

const bootstrapSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

const DEFAULT_GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

import { logAudit } from '../../utils/audit.js'
import type { Response } from 'express'

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const list: Record<string, string> = {}
  if (!cookieHeader) return list
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=')
    const key = parts.shift()?.trim()
    if (key) {
      list[key] = decodeURIComponent(parts.join('='))
    }
  })
  return list
}

async function createSession(userId: string, req: AuthRequest, res: Response) {
  const refreshToken = randomToken()
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
  const session = await prisma.userSession.create({
    data: {
      userId,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt,
      userAgent: req.header('user-agent'),
      ipAddress: req.ip,
    }
  })
  const accessToken = signAccessToken({ sub: userId, sid: session.id })

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: env.ACCESS_TOKEN_TTL_SECONDS * 1000,
    path: '/'
  })

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/'
  })

  return { accessToken, refreshToken }
}

async function getRecaptchaConfig() {
  const recaptchaConfig = await prisma.providerConfig.findFirst({
    where: { userId: null, provider: 'recaptcha', status: 'active' },
    orderBy: { createdAt: 'desc' },
  })
  if (recaptchaConfig) {
    try {
      const siteKey = decryptText(recaptchaConfig.clientIdEncrypted)
      const secretKey = decryptText(recaptchaConfig.clientSecretEncrypted)
      if (siteKey && secretKey) {
        return { siteKey, secretKey }
      }
    } catch {}
  }
  if (env.RECAPTCHA_SECRET_KEY && env.RECAPTCHA_SECRET_KEY.trim() !== '') {
    return { siteKey: process.env.VITE_RECAPTCHA_SITE_KEY?.trim() || null, secretKey: env.RECAPTCHA_SECRET_KEY.trim() }
  }
  return null
}

async function verifyCaptcha(token: string | undefined) {
  const config = await getRecaptchaConfig()
  if (!config || !config.siteKey || !config.secretKey) return true
  if (!token) return false
  const form = new URLSearchParams({ secret: config.secretKey, response: token })
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body: form })
  const data = await response.json() as { success?: boolean }
  return Boolean(data.success)
}

authRouter.get('/bootstrap-state', async (_req, res, next) => {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } })
    const hasAdmin = adminCount > 0
    const setupRequired = !hasAdmin

    const googleConfig = await prisma.providerConfig.findFirst({
      where: { userId: null, provider: 'google_drive' }
    })
    const recaptcha = await getRecaptchaConfig()

    return res.json({
      hasAdmin,
      setupRequired,
      googleConfigured: !!googleConfig,
      recaptchaConfigured: !!recaptcha,
    })
  } catch (error) {
    return next(error)
  }
})

authRouter.post('/bootstrap', async (req, res, next) => {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } })
    if (adminCount > 0) {
      return res.status(403).json({
        code: 'BOOTSTRAP_FORBIDDEN',
        message: 'Application is already bootstrapped. Initial setup is not allowed.'
      })
    }

    const body = bootstrapSchema.parse(req.body)
    const passwordHash = await hashPassword(body.password)

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: 'admin',
      }
    })

    const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
    const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || 'http://localhost:4000/connected-accounts/google/callback'

    if (clientId && clientSecret && clientId !== 'your-google-client-id' && clientId !== 'your-client-id') {
      await prisma.providerConfig.updateMany({
        where: { userId: null, provider: 'google_drive', status: 'active' },
        data: { status: 'disabled' },
      })

      await prisma.providerConfig.create({
        data: {
          userId: null,
          provider: 'google_drive',
          clientIdEncrypted: encryptText(clientId),
          clientSecretEncrypted: encryptText(clientSecret),
          redirectUri,
          scopes: DEFAULT_GOOGLE_SCOPES,
          status: 'active',
        }
      })
    }

    const tokens = await createSession(user.id, req, res)
    await logAudit({ userId: user.id, action: 'login', entityType: 'user', entityId: user.id, metadata: { mode: 'bootstrap' } })
    return res.status(201).json({
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    return next(error)
  }
})

authRouter.get('/config', async (_req, res, next) => {
  try {
    const googleConfig = await prisma.providerConfig.findFirst({
      where: { userId: null, provider: 'google_drive', status: 'active' }
    })
    const recaptcha = await getRecaptchaConfig()

    return res.json({
      googleEnabled: !!googleConfig,
      recaptchaSiteKey: recaptcha ? recaptcha.siteKey : null,
    })
  } catch (error) {
    return next(error)
  }
})

authRouter.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body)
    if (!(await verifyCaptcha(body.captchaToken))) return res.status(400).json({ code: 'CAPTCHA_FAILED', message: 'Captcha verification failed.' })
    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) return res.status(409).json({ code: 'AUTH_EMAIL_TAKEN', message: 'This email is already registered. Please login instead.' })
    
    const userCount = await prisma.user.count()
    const role = userCount === 0 ? 'admin' : 'user'

    const user = await prisma.user.create({ data: { name: body.name, email: body.email, passwordHash: await hashPassword(body.password), role } })
    const tokens = await createSession(user.id, req, res)
    await logAudit({ userId: user.id, action: 'login', entityType: 'user', entityId: user.id, metadata: { mode: 'register' } })
    return res.status(201).json({ ...tokens, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    return next(error)
  }
})

authRouter.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user || !(await verifyPassword(user.passwordHash, body.password))) {
      await logAudit({ userId: null, action: 'failed_login', entityType: 'user', metadata: { email: body.email } })
      return res.status(401).json({ code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid email or password.' })
    }
    const tokens = await createSession(user.id, req, res)
    await logAudit({ userId: user.id, action: 'login', entityType: 'user', entityId: user.id })
    return res.json({ ...tokens, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    return next(error)
  }
})

authRouter.post('/demo-login', authRateLimiter, async (req, res, next) => {
  try {
    const demoId = randomToken(8).toLowerCase()
    const email = `demo-${demoId}@casanest.app`
    const name = `Demo User ${demoId}`
    const passwordHash = await hashPassword(randomToken(32))

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'demo',
      }
    })

    await prisma.uploadRoutingPolicy.create({
      data: {
        userId: user.id,
        mode: 'most_available',
        priorityAccountIds: [],
      }
    })

    const tokens = await createSession(user.id, req, res)
    await logAudit({ userId: user.id, action: 'login', entityType: 'user', entityId: user.id, metadata: { mode: 'demo' } })
    return res.status(201).json({
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    return next(error)
  }
})

authRouter.delete('/delete-account', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userEmail = req.user ? (await prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true } }))?.email : null
    await logAudit({ userId: req.user!.id, action: 'account_deletion', entityType: 'user', entityId: req.user!.id, metadata: { email: userEmail } })

    // Revoke sessions first
    await prisma.userSession.updateMany({
      where: { userId: req.user!.id },
      data: { revokedAt: new Date() }
    })

    // Cascade delete user record
    await prisma.user.delete({
      where: { id: req.user!.id }
    })

    res.clearCookie('accessToken', { path: '/' })
    res.clearCookie('refreshToken', { path: '/' })
    return res.json({ status: 'ok' })
  } catch (error) {
    return next(error)
  }
})

authRouter.get('/google/url', async (_req, res, next) => {
  try {
    const config = await prisma.providerConfig.findFirst({ where: { userId: null, provider: 'google_drive', status: 'active' }, orderBy: { createdAt: 'desc' } })
    validateGoogleConfig(config)

    const state = randomToken()
    await prisma.oauthState.create({ data: { providerConfigId: config!.id, flow: 'login', stateHash: hashToken(state), expiresAt: new Date(Date.now() + 10 * 60_000) } })
    const client = createOAuthClient(config!)

    const decryptedClientId = decryptText(config!.clientIdEncrypted).trim()
    console.log('Generating Google OAuth sign-in URL:', {
      clientIdExists: !!decryptedClientId,
      clientIdEndsWithSuffix: decryptedClientId.endsWith('.apps.googleusercontent.com'),
      redirectUri: config!.redirectUri.trim(),
      scopes: config!.scopes,
    })

    const url = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'select_account',
      include_granted_scopes: true,
      scope: config!.scopes as string[],
      state,
    })
    return res.json({ url })
  } catch (error) {
    return next(error)
  }
})

authRouter.get('/google/callback', authRateLimiter, async (req, res) => {
  try {
    const query = z.object({ code: z.string(), state: z.string() }).parse(req.query)
    const oauthState = await prisma.oauthState.findUniqueOrThrow({ where: { stateHash: hashToken(query.state) }, include: { providerConfig: true } })
    if (oauthState.flow !== 'login' || oauthState.usedAt || oauthState.expiresAt < new Date()) return res.redirect(`${env.FRONTEND_URL}/google-auth?status=error`)

    const client = createOAuthClient(oauthState.providerConfig)
    const tokenResult = await client.getToken(query.code)
    const tokens = tokenResult.tokens
    if (!tokens.access_token) return res.redirect(`${env.FRONTEND_URL}/google-auth?status=error`)
    client.setCredentials(tokens)

    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const profile = await oauth2.userinfo.get()
    const providerAccountId = profile.data.id
    const email = profile.data.email
    if (!providerAccountId || !email) return res.redirect(`${env.FRONTEND_URL}/google-auth?status=error`)

    const name = profile.data.name || email.split('@')[0] || 'Google User'
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, name, passwordHash: await hashPassword(randomToken(32)) },
      update: { name },
    })
    const existingGlobal = await prisma.connectedAccount.findFirst({
      where: { provider: 'google_drive', providerAccountId }
    })
    if (existingGlobal && existingGlobal.userId !== user.id) {
      console.warn(`Google account already linked to another user: providerAccountId=${providerAccountId}, existingUserId=${existingGlobal.userId}, tryingUserId=${user.id}`)
      return res.redirect(`${env.FRONTEND_URL}/google-auth?status=already_linked`)
    }

    const existingAccount = await prisma.connectedAccount.findUnique({
      where: { provider_providerAccountId: { provider: 'google_drive', providerAccountId } }
    })
    const refreshTokenEncrypted = tokens.refresh_token ? encryptText(tokens.refresh_token) : existingAccount?.refreshTokenEncrypted
    if (!refreshTokenEncrypted) return res.redirect(`${env.FRONTEND_URL}/google-auth?status=error`)

    const account = await prisma.connectedAccount.upsert({
      where: { provider_providerAccountId: { provider: 'google_drive', providerAccountId } },
      create: {
        userId: user.id,
        providerConfigId: oauthState.providerConfigId,
        provider: 'google_drive',
        providerAccountId,
        email,
        displayName: profile.data.name,
        avatarUrl: profile.data.picture,
        accessTokenEncrypted: encryptText(tokens.access_token),
        refreshTokenEncrypted,
        tokenExpiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
        scopes: oauthState.providerConfig.scopes as string[],
        status: 'connected',
      },
      update: {
        providerConfigId: oauthState.providerConfigId,
        email,
        displayName: profile.data.name,
        avatarUrl: profile.data.picture,
        accessTokenEncrypted: encryptText(tokens.access_token),
        refreshTokenEncrypted,
        tokenExpiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
        scopes: oauthState.providerConfig.scopes as string[],
        status: 'connected',
      },
    })

    await prisma.oauthState.update({ where: { id: oauthState.id }, data: { usedAt: new Date(), userId: user.id } })
    await syncGoogleQuota(account.id).catch(() => undefined)
    await logAudit({ userId: user.id, action: 'login', entityType: 'user', entityId: user.id, metadata: { provider: 'google' } })

    const handoffToken = randomToken()
    await prisma.authHandoff.create({ data: { userId: user.id, tokenHash: hashToken(handoffToken), expiresAt: new Date(Date.now() + 5 * 60_000) } })
    return res.redirect(`${env.FRONTEND_URL}/google-auth?token=${handoffToken}`)
  } catch {
    return res.redirect(`${env.FRONTEND_URL}/google-auth?status=error`)
  }
})

const refreshRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many token refresh attempts. Please try again in a minute.',
})

authRouter.post('/google/exchange', async (req, res, next) => {
  try {
    const body = googleExchangeSchema.parse(req.body)
    const handoff = await prisma.authHandoff.findFirst({ where: { tokenHash: hashToken(body.token), usedAt: null, expiresAt: { gt: new Date() } }, include: { user: true } })
    if (!handoff) return res.status(401).json({ code: 'AUTH_GOOGLE_HANDOFF_INVALID', message: 'Google login session expired.' })
    await prisma.authHandoff.update({ where: { id: handoff.id }, data: { usedAt: new Date() } })
    const tokens = await createSession(handoff.userId, req, res)
    await logAudit({ userId: handoff.userId, action: 'login', entityType: 'user', entityId: handoff.userId, metadata: { provider: 'google_handoff' } })
    return res.json({ ...tokens, user: { id: handoff.user.id, name: handoff.user.name, email: handoff.user.email, role: handoff.user.role } })
  } catch (error) {
    return next(error)
  }
})

authRouter.post('/refresh', refreshRateLimiter, async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie)
    const refreshToken = cookies['refreshToken'] || req.body.refreshToken
    if (!refreshToken) return res.status(401).json({ code: 'AUTH_SESSION_EXPIRED', message: 'Refresh token expired.' })
    const session = await prisma.userSession.findFirst({ where: { refreshTokenHash: hashToken(refreshToken), revokedAt: null, expiresAt: { gt: new Date() } } })
    if (!session) return res.status(401).json({ code: 'AUTH_SESSION_EXPIRED', message: 'Refresh token expired.' })
    
    const accessToken = signAccessToken({ sub: session.userId, sid: session.id })
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: env.ACCESS_TOKEN_TTL_SECONDS * 1000,
      path: '/'
    })
    
    return res.json({ accessToken })
  } catch (error) {
    return next(error)
  }
})

authRouter.post('/logout', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (req.user?.sessionId) {
      await prisma.userSession.update({ where: { id: req.user.sessionId }, data: { revokedAt: new Date() } })
    }
    res.clearCookie('accessToken', { path: '/' })
    res.clearCookie('refreshToken', { path: '/' })
    return res.json({ status: 'ok' })
  } catch (error) {
    return next(error)
  }
})

authRouter.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, select: { id: true, name: true, email: true, role: true, status: true } })
    return res.json({ user })
  } catch (error) {
    return next(error)
  }
})
