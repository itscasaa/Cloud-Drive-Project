import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { decryptText, encryptText } from '../../utils/crypto.js'

export const adminProviderConfigRouter = Router()

const googleSchema = z.object({
  clientId: z.string().trim().min(1, 'Client ID is required'),
  clientSecret: z.string().trim().optional().or(z.literal('')),
  redirectUri: z.string().trim().url('Invalid Redirect URI'),
  enabled: z.boolean(),
})

const recaptchaSchema = z.object({
  siteKey: z.string().trim().min(1, 'Site Key is required'),
  secretKey: z.string().trim().optional().or(z.literal('')),
  enabled: z.boolean(),
})

const DEFAULT_GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

// GET /admin/provider-configs -> List overview of all configs
adminProviderConfigRouter.get('/', async (req, res, next) => {
  try {
    const googleConfig = await prisma.providerConfig.findFirst({
      where: { userId: null, provider: 'google_drive' }
    })
    const recaptchaConfig = await prisma.providerConfig.findFirst({
      where: { userId: null, provider: 'recaptcha' }
    })

    return res.json({
      google: {
        configured: !!googleConfig,
        enabled: googleConfig?.status === 'active',
      },
      recaptcha: {
        configured: !!recaptchaConfig,
        enabled: recaptchaConfig?.status === 'active',
      }
    })
  } catch (error) {
    return next(error)
  }
})

// GET /admin/provider-configs/google -> Get Google config
adminProviderConfigRouter.get('/google', async (req, res, next) => {
  try {
    const config = await prisma.providerConfig.findFirst({
      where: { userId: null, provider: 'google_drive' }
    })

    if (!config) {
      return res.json({
        clientId: '',
        redirectUri: '',
        enabled: false,
        clientSecretConfigured: false,
      })
    }

    return res.json({
      clientId: decryptText(config.clientIdEncrypted),
      redirectUri: config.redirectUri,
      enabled: config.status === 'active',
      clientSecretConfigured: !!config.clientSecretEncrypted,
    })
  } catch (error) {
    return next(error)
  }
})

// PUT /admin/provider-configs/google -> Update Google config
adminProviderConfigRouter.put('/google', async (req, res, next) => {
  try {
    const body = googleSchema.parse(req.body)
    const existing = await prisma.providerConfig.findFirst({
      where: { userId: null, provider: 'google_drive' }
    })

    let secretEncrypted = existing?.clientSecretEncrypted || ''
    if (body.clientSecret) {
      secretEncrypted = encryptText(body.clientSecret)
    } else if (!existing) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'Client secret is required for initial configuration.' })
    }

    const status = body.enabled ? 'active' : 'disabled'

    const config = existing
      ? await prisma.providerConfig.update({
          where: { id: existing.id },
          data: {
            clientIdEncrypted: encryptText(body.clientId),
            clientSecretEncrypted: secretEncrypted,
            redirectUri: body.redirectUri,
            status,
          }
        })
      : await prisma.providerConfig.create({
          data: {
            userId: null,
            provider: 'google_drive',
            clientIdEncrypted: encryptText(body.clientId),
            clientSecretEncrypted: secretEncrypted,
            redirectUri: body.redirectUri,
            scopes: DEFAULT_GOOGLE_SCOPES,
            status,
          }
        })

    return res.json({
      id: config.id,
      clientId: body.clientId,
      redirectUri: config.redirectUri,
      enabled: config.status === 'active',
      clientSecretConfigured: true,
    })
  } catch (error) {
    return next(error)
  }
})

// POST /admin/provider-configs/google/test -> Test Google OAuth config
adminProviderConfigRouter.post('/google/test', async (req, res, next) => {
  try {
    const body = z.object({
      clientId: z.string().trim().min(1, 'Client ID is required'),
      clientSecret: z.string().trim().optional(),
      redirectUri: z.string().trim().url('Invalid Redirect URI'),
    }).parse(req.body)

    // Test connectivity to Google servers
    const response = await fetch('https://accounts.google.com/.well-known/openid-configuration')
    if (!response.ok) {
      throw new Error('Google OAuth endpoints are currently unreachable.')
    }

    return res.json({
      success: true,
      message: 'Connection successful. Google endpoints are reachable and config is structurally valid.'
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Validation failed.'
    })
  }
})

// GET /admin/provider-configs/recaptcha -> Get Recaptcha config
adminProviderConfigRouter.get('/recaptcha', async (req, res, next) => {
  try {
    const config = await prisma.providerConfig.findFirst({
      where: { userId: null, provider: 'recaptcha' }
    })

    if (!config) {
      return res.json({
        siteKey: '',
        enabled: false,
        secretKeyConfigured: false,
      })
    }

    return res.json({
      siteKey: decryptText(config.clientIdEncrypted),
      enabled: config.status === 'active',
      secretKeyConfigured: !!config.clientSecretEncrypted,
    })
  } catch (error) {
    return next(error)
  }
})

// PUT /admin/provider-configs/recaptcha -> Update Recaptcha config
adminProviderConfigRouter.put('/recaptcha', async (req, res, next) => {
  try {
    const body = recaptchaSchema.parse(req.body)
    const existing = await prisma.providerConfig.findFirst({
      where: { userId: null, provider: 'recaptcha' }
    })

    let secretEncrypted = existing?.clientSecretEncrypted || ''
    if (body.secretKey) {
      secretEncrypted = encryptText(body.secretKey)
    } else if (!existing) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'Secret key is required for initial configuration.' })
    }

    const status = body.enabled ? 'active' : 'disabled'

    const config = existing
      ? await prisma.providerConfig.update({
          where: { id: existing.id },
          data: {
            clientIdEncrypted: encryptText(body.siteKey),
            clientSecretEncrypted: secretEncrypted,
            status,
          }
        })
      : await prisma.providerConfig.create({
          data: {
            userId: null,
            provider: 'recaptcha',
            clientIdEncrypted: encryptText(body.siteKey),
            clientSecretEncrypted: secretEncrypted,
            redirectUri: '',
            scopes: [],
            status,
          }
        })

    return res.json({
      id: config.id,
      siteKey: body.siteKey,
      enabled: config.status === 'active',
      secretKeyConfigured: true,
    })
  } catch (error) {
    return next(error)
  }
})

// POST /admin/provider-configs/recaptcha/test -> Test Recaptcha config
adminProviderConfigRouter.post('/recaptcha/test', async (req, res, next) => {
  try {
    const body = z.object({
      siteKey: z.string().trim().min(1, 'Site Key is required'),
      secretKey: z.string().trim().optional(),
    }).parse(req.body)

    // Test connectivity to Google Recaptcha endpoint
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST'
    })
    
    // We expect it to respond (even if it returns success: false because of empty payload)
    if (response.status >= 500) {
      throw new Error('Google Recaptcha service is currently unreachable.')
    }

    return res.json({
      success: true,
      message: 'Connection successful. Recaptcha endpoint is reachable.'
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Validation failed.'
    })
  }
})
