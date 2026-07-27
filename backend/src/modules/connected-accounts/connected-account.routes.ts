import { Router } from 'express'
import { google } from 'googleapis'
import { z } from 'zod'
import { env } from '../../config/env.js'
import { prisma } from '../../config/prisma.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.middleware.js'
import { decryptText, encryptText, hashToken, randomToken } from '../../utils/crypto.js'
import { hashPassword } from '../../utils/password.js'
import { createOAuthClient, syncGoogleQuota, validateGoogleConfig } from '../google/google.service.js'
import { syncS3Quota, testS3Connection } from '../s3/s3.service.js'
import { createRateLimiter } from '../../middleware/rate-limit.middleware.js'
import { logAudit } from '../../utils/audit.js'
import { encryptAccountIdentity, decryptAccountPublic } from '../../utils/pii.js'

export const connectedAccountRouter = Router()

const callbackRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many OAuth connection callback attempts.',
})

const s3ConnectSchema = z.object({
  name: z.string().trim().min(1).max(191),
  bucket: z.string().trim().min(1).max(191),
  region: z.string().trim().min(1).max(191),
  endpoint: z.string().url().optional().or(z.literal('')),
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
  forcePathStyle: z.boolean().optional(),
  quotaBytes: z.string().regex(/^\d+$/).optional().nullable(),
})

async function syncQuotaForAccount(account: { id: string; provider: string }) {
  if (account.provider === 's3') return syncS3Quota(account.id)
  return syncGoogleQuota(account.id)
}

const MAX_GOOGLE_DRIVE_ACCOUNTS_PER_USER = 4

async function checkGoogleAccountLimit(userId: string): Promise<boolean> {
  const count = await prisma.connectedAccount.count({
    where: {
      userId,
      provider: 'google_drive',
      status: 'connected',
    },
  })
  return count >= MAX_GOOGLE_DRIVE_ACCOUNTS_PER_USER
}

connectedAccountRouter.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const isDemo = req.user!.role === 'demo'
    let targetUserId = req.user!.id
    if (isDemo) {
      const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
      if (admin) targetUserId = admin.id
    }

    const accounts = await prisma.connectedAccount.findMany({
      where: { userId: targetUserId, status: 'connected' },
      include: { storageAccount: true },
      orderBy: { createdAt: 'desc' },
    })

    // Don't auto-sync quota on page load for demo users to avoid API rate limits on admin account
    const missingQuota = isDemo ? [] : accounts.filter((account) => !account.storageAccount?.lastSyncedAt)
    for (const account of missingQuota) await syncQuotaForAccount(account).catch(() => undefined)

    const syncedAccounts = !isDemo && missingQuota.length > 0
      ? await prisma.connectedAccount.findMany({
        where: { userId: targetUserId, status: 'connected' },
        include: { storageAccount: true },
        orderBy: { createdAt: 'desc' },
      })
      : accounts

    return res.json({
      accounts: syncedAccounts.map((accountRow) => {
        const { accessTokenEncrypted: _a, refreshTokenEncrypted: _r, storageAccount, ...account } = decryptAccountPublic(accountRow)
        const scopesArray = Array.isArray(account.scopes) ? account.scopes : []
        const reconnectRequired = account.provider === 'google_drive' && !scopesArray.includes('https://www.googleapis.com/auth/drive.file')
        return {
          ...account,
          reconnectRequired,
          storageAccount: storageAccount ? {
            ...storageAccount,
            totalBytes: storageAccount.totalBytes?.toString() ?? null,
            usedBytes: storageAccount.usedBytes.toString(),
            availableBytes: storageAccount.availableBytes?.toString() ?? null,
            trashBytes: storageAccount.trashBytes?.toString() ?? null,
          } : null,
        }
      }),
    })
  } catch (error) {
    return next(error)
  }
})

async function createGoogleConnectUrl(req: AuthRequest) {
  const query = z.object({ providerConfigId: z.string().min(1).optional() }).parse(req.query)
  const config = query.providerConfigId
    ? await prisma.providerConfig.findFirst({ where: { id: query.providerConfigId, OR: [{ userId: req.user!.id }, { userId: null }], provider: 'google_drive', status: 'active' } })
    : await prisma.providerConfig.findFirst({ where: { userId: null, provider: 'google_drive', status: 'active' }, orderBy: { createdAt: 'desc' } })
  
  validateGoogleConfig(config)

  const state = randomToken()
  await prisma.oauthState.create({ data: { userId: req.user!.id, providerConfigId: config!.id, flow: 'connect', stateHash: hashToken(state), expiresAt: new Date(Date.now() + 10 * 60_000) } })
  const client = createOAuthClient(config!)

  const decryptedClientId = decryptText(config!.clientIdEncrypted).trim()
  console.log('Generating Google OAuth connection URL:', {
    clientIdExists: !!decryptedClientId,
    clientIdEndsWithSuffix: decryptedClientId.endsWith('.apps.googleusercontent.com'),
    redirectUri: config!.redirectUri.trim(),
    scopes: config!.scopes,
  })

  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: config!.scopes as string[],
    state,
  })
}

connectedAccountRouter.post('/s3', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (req.user!.role === 'demo') {
      return res.status(403).json({ code: 'DEMO_FORBIDDEN', message: 'Adding custom S3 storage is not allowed in Demo Mode.' })
    }
    const body = s3ConnectSchema.parse(req.body)
    const providerConfig = await prisma.providerConfig.findFirstOrThrow({ where: { provider: 'google_drive', status: 'active' }, orderBy: { createdAt: 'desc' } })
    const providerAccountId = `${body.bucket}:${body.endpoint || body.region}`
    const existingAccount = await prisma.connectedAccount.findUnique({ where: { provider_providerAccountId: { provider: 's3', providerAccountId } } })
    if (existingAccount && existingAccount.userId !== req.user!.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'This S3 bucket is already connected by another user.' })
    }
    const identity = encryptAccountIdentity({ email: `${body.bucket} (S3)`, displayName: body.name })
    const account = existingAccount
      ? await prisma.connectedAccount.update({
        where: { id: existingAccount.id },
        data: {
          providerConfigId: providerConfig.id,
          email: identity.email,
          emailHash: identity.emailHash,
          displayName: identity.displayName,
          accessTokenEncrypted: encryptText('s3'),
          refreshTokenEncrypted: encryptText(randomToken()),
          tokenExpiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
          scopes: [],
          status: 'connected',
          disconnectedAt: null,
          recoveryExpiresAt: null,
        },
      })
      : await prisma.connectedAccount.create({ data: {
        userId: req.user!.id,
        providerConfigId: providerConfig.id,
        provider: 's3',
        providerAccountId,
        email: identity.email,
        emailHash: identity.emailHash,
        displayName: identity.displayName,
        accessTokenEncrypted: encryptText('s3'),
        refreshTokenEncrypted: encryptText(randomToken()),
        tokenExpiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        scopes: [],
        status: 'connected',
      } })

    if (existingAccount && existingAccount.status === 'disconnected') {
      await prisma.file.updateMany({
        where: { connectedAccountId: account.id, status: 'recovery' },
        data: { status: 'active' }
      })
    }
    const config = await prisma.s3StorageConfig.upsert({
      where: { connectedAccountId: account.id },
      create: {
        userId: req.user!.id,
        connectedAccountId: account.id,
        name: body.name,
        bucket: body.bucket,
        region: body.region,
        endpoint: body.endpoint || null,
        accessKeyIdEncrypted: encryptText(body.accessKeyId),
        secretAccessKeyEncrypted: encryptText(body.secretAccessKey),
        forcePathStyle: body.forcePathStyle ?? Boolean(body.endpoint),
        quotaBytes: body.quotaBytes ? BigInt(body.quotaBytes) : null,
      },
      update: {
        name: body.name,
        bucket: body.bucket,
        region: body.region,
        endpoint: body.endpoint || null,
        accessKeyIdEncrypted: encryptText(body.accessKeyId),
        secretAccessKeyEncrypted: encryptText(body.secretAccessKey),
        forcePathStyle: body.forcePathStyle ?? Boolean(body.endpoint),
        quotaBytes: body.quotaBytes ? BigInt(body.quotaBytes) : null,
        status: 'active',
      },
    })
    try {
      await testS3Connection(config)
      const quota = await syncS3Quota(account.id)
      return res.status(201).json({
        account: {
          ...decryptAccountPublic(account),
          storageAccount: { ...quota, totalBytes: quota.totalBytes?.toString() ?? null, usedBytes: quota.usedBytes.toString(), availableBytes: quota.availableBytes?.toString() ?? null, trashBytes: quota.trashBytes?.toString() ?? null },
        },
      })
    } catch (error) {
      if (!existingAccount) await prisma.connectedAccount.delete({ where: { id: account.id } }).catch(() => undefined)
      throw error
    }
  } catch (error) {
    return next(error)
  }
})

connectedAccountRouter.get('/google/connect-url', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (req.user!.role === 'demo') {
      return res.status(403).json({ code: 'DEMO_FORBIDDEN', message: 'Connecting new Google Drive accounts is not allowed in Demo Mode.' })
    }
    if (await checkGoogleAccountLimit(req.user!.id)) {
      return res.status(400).json({ code: 'GOOGLE_ACCOUNTS_LIMIT_REACHED', message: 'You can connect up to 4 Google Drive accounts only.' })
    }
    const url = await createGoogleConnectUrl(req)
    return res.json({ url })
  } catch (error) {
    return next(error)
  }
})

connectedAccountRouter.get('/google/connect', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (req.user!.role === 'demo') {
      return res.status(403).json({ code: 'DEMO_FORBIDDEN', message: 'Connecting new Google Drive accounts is not allowed in Demo Mode.' })
    }
    if (await checkGoogleAccountLimit(req.user!.id)) {
      return res.status(400).json({ code: 'GOOGLE_ACCOUNTS_LIMIT_REACHED', message: 'You can connect up to 4 Google Drive accounts only.' })
    }
    const url = await createGoogleConnectUrl(req)
    return res.redirect(url)
  } catch (error) {
    return next(error)
  }
})

connectedAccountRouter.get('/google/callback', callbackRateLimiter, async (req, res, next) => {
  try {
    const query = z.object({ code: z.string(), state: z.string() }).parse(req.query)
    const oauthState = await prisma.oauthState.findUniqueOrThrow({ where: { stateHash: hashToken(query.state) }, include: { providerConfig: true } })
    if (oauthState.usedAt || oauthState.expiresAt < new Date()) return res.status(400).json({ code: 'GOOGLE_OAUTH_STATE_INVALID', message: 'OAuth state expired.' })
    const client = createOAuthClient(oauthState.providerConfig)
    const tokenResult = await client.getToken(query.code)
    const tokens = tokenResult.tokens
    if (!tokens.access_token) return res.status(400).json({ code: 'GOOGLE_OAUTH_FAILED', message: 'Google did not return required tokens.' })
    client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const profile = await oauth2.userinfo.get()
    const providerAccountId = profile.data.id
    const email = profile.data.email
    if (!providerAccountId || !email) return res.status(400).json({ code: 'GOOGLE_PROFILE_FAILED', message: 'Google profile missing id or email.' })

    if (oauthState.flow === 'login') {
      if (!email.toLowerCase().endsWith('@gmail.com')) {
        return res.redirect(`${env.FRONTEND_URL}/google-auth?status=restricted_domain`)
      }
      const name = profile.data.name || email.split('@')[0] || 'Google User'
      const { email: encEmail, emailHash: encEmailHash, name: encName } = (() => {
        const u = require('../../utils/pii.js').encryptUserFields({ name, email })
        return { email: u.email, emailHash: u.emailHash, name: u.name }
      })()
      const user = await prisma.user.upsert({
        where: { emailHash: encEmailHash },
        create: { email: encEmail, emailHash: encEmailHash, name: encName, passwordHash: await hashPassword(randomToken(32)) },
        update: { name: encName },
      })
      const existingGlobal = await prisma.connectedAccount.findFirst({
        where: { provider: 'google_drive', providerAccountId }
      })
      if (existingGlobal && existingGlobal.userId !== user.id) {
        console.warn(`Google account already linked to another user: providerAccountId=${providerAccountId}, existingUserId=${existingGlobal.userId}, tryingUserId=${user.id}`)
        return res.redirect(`${env.FRONTEND_URL}/google-auth?status=already_linked`)
      }

      const existingAccount = await prisma.connectedAccount.findUnique({ where: { provider_providerAccountId: { provider: 'google_drive', providerAccountId } } })
      const refreshTokenEncrypted = tokens.refresh_token ? encryptText(tokens.refresh_token) : existingAccount?.refreshTokenEncrypted
      if (!refreshTokenEncrypted) return res.redirect(`${env.FRONTEND_URL}/google-auth?status=error`)
      const identity = encryptAccountIdentity({ email, displayName: profile.data.name, avatarUrl: profile.data.picture })
      const account = await prisma.connectedAccount.upsert({
        where: { provider_providerAccountId: { provider: 'google_drive', providerAccountId } },
        create: {
          userId: user.id,
          providerConfigId: oauthState.providerConfigId,
          provider: 'google_drive',
          providerAccountId,
          email: identity.email,
          emailHash: identity.emailHash,
          displayName: identity.displayName,
          avatarUrl: identity.avatarUrl,
          accessTokenEncrypted: encryptText(tokens.access_token),
          refreshTokenEncrypted,
          tokenExpiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
          scopes: oauthState.providerConfig.scopes as string[],
          status: 'connected',
        },
        update: {
          providerConfigId: oauthState.providerConfigId,
          email: identity.email,
          emailHash: identity.emailHash,
          displayName: identity.displayName,
          avatarUrl: identity.avatarUrl,
          accessTokenEncrypted: encryptText(tokens.access_token),
          refreshTokenEncrypted,
          tokenExpiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
          scopes: oauthState.providerConfig.scopes as string[],
          status: 'connected',
          disconnectedAt: null,
          recoveryExpiresAt: null,
        },
      })
      if (existingAccount && existingAccount.status === 'disconnected') {
        await prisma.file.updateMany({
          where: { connectedAccountId: account.id, status: 'recovery' },
          data: { status: 'active' }
        })
      }
      await prisma.oauthState.update({ where: { id: oauthState.id }, data: { usedAt: new Date(), userId: user.id } })
      await syncGoogleQuota(account.id).catch(() => undefined)
      
      const scopesArray = existingAccount && Array.isArray(existingAccount.scopes) ? existingAccount.scopes : []
      const isReconnect = existingAccount && (
        !scopesArray.includes('https://www.googleapis.com/auth/drive.file') || 
        existingAccount.status === 'disconnected'
      )
      await logAudit({
        userId: user.id,
        action: isReconnect ? 'reconnect_drive' : 'connect_drive',
        entityType: 'connected_account',
        entityId: account.id,
        metadata: { email }
      })

      const handoffToken = randomToken()
      await prisma.authHandoff.create({ data: { userId: user.id, tokenHash: hashToken(handoffToken), expiresAt: new Date(Date.now() + 5 * 60_000) } })
      return res.redirect(`${env.FRONTEND_URL}/google-auth?token=${handoffToken}`)
    }

    if (oauthState.flow !== 'connect' || !oauthState.userId) return res.status(400).json({ code: 'GOOGLE_OAUTH_STATE_INVALID', message: 'OAuth state expired.' })
    
    // Check global uniqueness!
    const existingGlobal = await prisma.connectedAccount.findFirst({
      where: { provider: 'google_drive', providerAccountId }
    })
    if (existingGlobal && existingGlobal.userId !== oauthState.userId) {
      console.warn(`Google account already linked to another user: providerAccountId=${providerAccountId}, existingUserId=${existingGlobal.userId}, tryingUserId=${oauthState.userId}`)
      return res.redirect(`${env.FRONTEND_URL}/google-connected?status=already_linked`)
    }

    const existingAccount = await prisma.connectedAccount.findUnique({ where: { provider_providerAccountId: { provider: 'google_drive', providerAccountId } } })
    
    // Prevent duplicate Google account connection
    if (existingAccount && existingAccount.status === 'connected') {
      const scopesArray = Array.isArray(existingAccount.scopes) ? existingAccount.scopes : []
      const isReconnect = !scopesArray.includes('https://www.googleapis.com/auth/drive.file')
      if (!isReconnect) {
        return res.redirect(`${env.FRONTEND_URL}/google-connected?status=duplicate`)
      }
    }

    // Check if new account triggers account limit
    if (!existingAccount || existingAccount.status !== 'connected') {
      if (await checkGoogleAccountLimit(oauthState.userId)) {
        return res.redirect(`${env.FRONTEND_URL}/google-connected?status=limit_reached`)
      }
    }

    const refreshTokenEncrypted = tokens.refresh_token ? encryptText(tokens.refresh_token) : existingAccount?.refreshTokenEncrypted
    if (!refreshTokenEncrypted) return res.status(400).json({ code: 'GOOGLE_OAUTH_FAILED', message: 'Google did not return required tokens.' })

    const identity = encryptAccountIdentity({ email, displayName: profile.data.name, avatarUrl: profile.data.picture })
    const account = await prisma.connectedAccount.upsert({
      where: { provider_providerAccountId: { provider: 'google_drive', providerAccountId } },
      create: {
        userId: oauthState.userId,
        providerConfigId: oauthState.providerConfigId,
        provider: 'google_drive',
        providerAccountId,
        email: identity.email,
        emailHash: identity.emailHash,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        accessTokenEncrypted: encryptText(tokens.access_token),
        refreshTokenEncrypted,
        tokenExpiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
        scopes: oauthState.providerConfig.scopes as string[],
        status: 'connected',
      },
      update: {
        providerConfigId: oauthState.providerConfigId,
        email: identity.email,
        emailHash: identity.emailHash,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        accessTokenEncrypted: encryptText(tokens.access_token),
        refreshTokenEncrypted,
        tokenExpiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
        scopes: oauthState.providerConfig.scopes as string[],
        status: 'connected',
        disconnectedAt: null,
        recoveryExpiresAt: null,
      },
    })
    if (existingAccount && existingAccount.status === 'disconnected') {
      await prisma.file.updateMany({
        where: { connectedAccountId: account.id, status: 'recovery' },
        data: { status: 'active' }
      })
    }
    await prisma.oauthState.update({ where: { id: oauthState.id }, data: { usedAt: new Date() } })
    await syncGoogleQuota(account.id)

    const scopesArray = existingAccount && Array.isArray(existingAccount.scopes) ? existingAccount.scopes : []
    const isReconnect = existingAccount && (
      !scopesArray.includes('https://www.googleapis.com/auth/drive.file') || 
      existingAccount.status === 'disconnected'
    )
    await logAudit({
      userId: oauthState.userId,
      action: isReconnect ? 'reconnect_drive' : 'connect_drive',
      entityType: 'connected_account',
      entityId: account.id,
      metadata: { email }
    })

    return res.redirect(`${env.FRONTEND_URL}/google-connected?status=success`)
  } catch (error) {
    return res.redirect(`${env.FRONTEND_URL}/google-connected?status=error`)
  }
})

connectedAccountRouter.post('/:id/sync-quota', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const accountId = String(req.params.id)
    const account = await prisma.connectedAccount.findFirst({ where: { id: accountId } })
    if (!account) {
      return res.status(404).json({ code: 'CONNECTED_ACCOUNT_NOT_FOUND', message: 'Connected account not found.' })
    }
    if (account.userId !== req.user!.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied.' })
    }
    const quota = await syncQuotaForAccount(account)
    return res.json({
      quota: {
        ...quota,
        totalBytes: quota.totalBytes?.toString() ?? null,
        usedBytes: quota.usedBytes.toString(),
        availableBytes: quota.availableBytes?.toString() ?? null,
        trashBytes: quota.trashBytes?.toString() ?? null,
      },
    })
  } catch (error) {
    return next(error)
  }
})

connectedAccountRouter.delete('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (req.user!.role === 'demo') {
      return res.status(403).json({ code: 'DEMO_FORBIDDEN', message: 'Modifying demo storage accounts is not allowed.' })
    }
    const accountId = String(req.params.id)
    const account = await prisma.connectedAccount.findFirst({ where: { id: accountId } })
    if (!account) {
      return res.status(404).json({ code: 'CONNECTED_ACCOUNT_NOT_FOUND', message: 'Connected account not found.' })
    }
    if (account.userId !== req.user!.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied.' })
    }
    const disconnectedAt = new Date()
    const recoveryExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

    const [updatedAccount, updateFilesResult] = await prisma.$transaction([
      prisma.connectedAccount.update({
        where: { id: account.id },
        data: {
          status: 'disconnected',
          disconnectedAt,
          recoveryExpiresAt,
        }
      }),
      prisma.file.updateMany({
        where: { connectedAccountId: account.id, status: 'active' },
        data: { status: 'recovery' }
      })
    ])

    const remainingActiveGoogleAccounts = await prisma.connectedAccount.count({
      where: {
        userId: req.user!.id,
        provider: 'google_drive',
        status: 'connected',
      }
    })
    const allDriveAccountsDisconnected = remainingActiveGoogleAccounts === 0

    const decryptedAccount = decryptAccountPublic(account)
    await logAudit({
      userId: req.user!.id,
      action: 'disconnect_drive',
      entityType: 'connected_account',
      entityId: account.id,
      metadata: { email: decryptedAccount.email }
    })

    return res.json({
      disconnectedAccountEmail: decryptedAccount.email,
      movedFilesCount: updateFilesResult.count,
      allDriveAccountsDisconnected,
      recoveryExpiresAt
    })
  } catch (error) {
    return next(error)
  }
})
