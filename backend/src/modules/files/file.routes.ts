import { Router } from 'express'
import { google } from 'googleapis'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.middleware.js'
import { hashToken, randomToken } from '../../utils/crypto.js'
import { getAuthedGoogleClient, syncGoogleAppFolderFiles, syncGoogleQuota } from '../google/google.service.js'
import { deleteS3Object, syncS3Quota } from '../s3/s3.service.js'
import { streamProviderFile } from './stream-file.js'
import { logAudit } from '../../utils/audit.js'

export const fileRouter = Router()

fileRouter.get('/preview/:token', async (req, res, next) => {
  try {
    const token = String(req.params.token)
    const preview = await prisma.filePreviewToken.findFirst({
      where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
      include: { file: { include: { connectedAccount: true } } },
    })
    if (!preview || preview.file.status !== 'active') return res.status(404).json({ code: 'PREVIEW_NOT_FOUND', message: 'Preview token not found.' })
    return streamProviderFile(preview.file, req.headers.range, res, { disposition: 'inline' })
  } catch (error) {
    return next(error)
  }
})

fileRouter.use(requireAuth)

fileRouter.get('/recovery', async (req: AuthRequest, res, next) => {
  try {
    const files = await prisma.file.findMany({
      where: {
        userId: req.user!.id,
        status: 'recovery',
      },
      include: {
        connectedAccount: {
          select: {
            id: true,
            email: true,
            provider: true,
            disconnectedAt: true,
            recoveryExpiresAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return res.json({
      files: files.map((file) => ({
        ...file,
        sizeBytes: file.sizeBytes.toString(),
      }))
    })
  } catch (error) {
    return next(error)
  }
})

fileRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const query = z.object({ folderId: z.string().optional(), q: z.string().trim().max(255).optional() }).parse(req.query)
    const files = await prisma.file.findMany({
      where: {
        userId: req.user!.id,
        status: 'active',
        connectedAccount: {
          status: 'connected'
        },
        ...(query.folderId ? { folderId: query.folderId } : {}),
        ...(query.q ? { name: { contains: query.q } } : {})
      },
      include: {
        connectedAccount: { select: { id: true, email: true, provider: true } },
        folder: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return res.json({ files: files.map((file) => ({ ...file, sizeBytes: file.sizeBytes.toString() })) })
  } catch (error) {
    return next(error)
  }
})

const batchFileSchema = z.object({ fileIds: z.array(z.string().min(1)).min(1).max(100) })

fileRouter.patch('/batch', async (req: AuthRequest, res, next) => {
  try {
    const body = batchFileSchema.extend({ folderId: z.string().nullable().optional() }).parse(req.body)
    if (body.folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: body.folderId } })
      if (!folder) return res.status(404).json({ code: 'FOLDER_NOT_FOUND', message: 'Folder not found.' })
      if (folder.userId !== req.user!.id) return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied.' })
    }
    const result = await prisma.file.updateMany({ where: { id: { in: body.fileIds }, userId: req.user!.id, status: 'active' }, data: { folderId: body.folderId ?? null } })
    
    const movedFiles = await prisma.file.findMany({ where: { id: { in: body.fileIds }, userId: req.user!.id } })
    for (const file of movedFiles) {
      await logAudit({
        userId: req.user!.id,
        action: 'move',
        entityType: 'file',
        entityId: file.id,
        metadata: { folderId: body.folderId ?? null }
      })
    }
    return res.json({ status: 'ok', moved: result.count })
  } catch (error) {
    return next(error)
  }
})

fileRouter.delete('/batch', async (req: AuthRequest, res, next) => {
  try {
    const body = batchFileSchema.parse(req.body)
    const files = await prisma.file.findMany({ where: { id: { in: body.fileIds }, userId: req.user!.id, status: 'active' }, include: { connectedAccount: true } })
    const deletedIds: string[] = []
    const syncedAccountIds = new Set<string>()
    const failed: Array<{ fileId: string; message: string }> = []

    for (const file of files) {
      try {
        if (file.provider === 's3') await deleteS3Object(file)
        else {
          const auth = await getAuthedGoogleClient(file.connectedAccount)
          const drive = google.drive({ version: 'v3', auth })
          await drive.files.delete({ fileId: file.providerFileId })
        }
        deletedIds.push(file.id)
        syncedAccountIds.add(file.connectedAccountId)
        await logAudit({
          userId: req.user!.id,
          action: 'delete',
          entityType: 'file',
          entityId: file.id,
          metadata: { fileName: file.name }
        })
      } catch (error) {
        failed.push({ fileId: file.id, message: error instanceof Error ? error.message : 'Delete failed' })
      }
    }

    if (deletedIds.length > 0) await prisma.file.updateMany({ where: { id: { in: deletedIds }, userId: req.user!.id }, data: { status: 'deleted', deletedAt: new Date() } })
    for (const accountId of syncedAccountIds) {
      const account = files.find((file) => file.connectedAccountId === accountId)?.connectedAccount
      if (account?.provider === 's3') await syncS3Quota(accountId).catch(() => undefined)
      else await syncGoogleQuota(accountId).catch(() => undefined)
    }
    if (deletedIds.length === 0 && failed.length > 0) return res.status(400).json({ code: 'FILES_DELETE_FAILED', message: 'No files were deleted.', deleted: 0, failed })
    return res.json({ status: 'ok', deleted: deletedIds.length, failed })
  } catch (error) {
    return next(error)
  }
})

fileRouter.get('/shared-links', async (req: AuthRequest, res, next) => {
  try {
    const shares = await prisma.fileShare.findMany({
      where: { userId: req.user!.id, enabled: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      include: { file: { include: { connectedAccount: { select: { email: true, provider: true } }, folder: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    return res.json({
      shares: shares.filter((share) => share.file.status === 'active').map((share) => ({
        id: share.id,
        url: share.token ? `${env.FRONTEND_URL}/public/files/${share.token}` : null,
        createdAt: share.createdAt.toISOString(),
        expiresAt: share.expiresAt?.toISOString() ?? null,
        file: { ...share.file, sizeBytes: share.file.sizeBytes.toString() },
      })),
    })
  } catch (error) {
    return next(error)
  }
})

fileRouter.post('/sync-google', async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ connectedAccountId: z.string().min(1).optional() }).parse(req.body ?? {})
    const accounts = await prisma.connectedAccount.findMany({
      where: { userId: req.user!.id, provider: 'google_drive', status: 'connected', ...(body.connectedAccountId ? { id: body.connectedAccountId } : {}) },
      select: { id: true },
    })

    const results = []
    for (const account of accounts) results.push(await syncGoogleAppFolderFiles(account.id, req.user!.id))

    return res.json({
      status: 'ok',
      accounts: results.length,
      created: results.reduce((total, result) => total + result.created, 0),
      updated: results.reduce((total, result) => total + result.updated, 0),
      deleted: results.reduce((total, result) => total + result.deleted, 0),
      results,
    })
  } catch (error) {
    return next(error)
  }
})

fileRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const fileId = String(req.params.id)
    const file = await prisma.file.findFirst({ where: { id: fileId, status: 'active', connectedAccount: { status: 'connected' } }, include: { connectedAccount: { select: { id: true, email: true, provider: true } }, folder: { select: { id: true, name: true } } } })
    if (!file) {
      return res.status(404).json({ code: 'FILE_NOT_FOUND', message: 'File not found.' })
    }
    if (file.userId !== req.user!.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied.' })
    }
    return res.json({ file: { ...file, sizeBytes: file.sizeBytes.toString() } })
  } catch (error) {
    return next(error)
  }
})

fileRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ name: z.string().min(1).max(255).optional(), folderId: z.string().nullable().optional() }).parse(req.body)
    const fileId = String(req.params.id)
    const file = await prisma.file.findFirst({ where: { id: fileId, status: 'active', connectedAccount: { status: 'connected' } }, include: { connectedAccount: true } })
    if (!file) {
      return res.status(404).json({ code: 'FILE_NOT_FOUND', message: 'File not found.' })
    }
    if (file.userId !== req.user!.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied.' })
    }
    const drive = file.provider === 's3' ? null : google.drive({ version: 'v3', auth: await getAuthedGoogleClient(file.connectedAccount) })
    if (body.folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: body.folderId } })
      if (!folder) return res.status(404).json({ code: 'FOLDER_NOT_FOUND', message: 'Folder not found.' })
      if (folder.userId !== req.user!.id) return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied.' })
    }
    if (body.name && drive) await drive.files.update({ fileId: file.providerFileId, requestBody: { name: body.name } })
    const updated = await prisma.file.update({ where: { id: file.id }, data: { ...(body.name ? { name: body.name } : {}), ...(body.folderId !== undefined ? { folderId: body.folderId } : {}) }, include: { connectedAccount: { select: { id: true, email: true, provider: true } }, folder: { select: { id: true, name: true } } } })
    
    if (body.name && body.name !== file.name) {
      await logAudit({
        userId: req.user!.id,
        action: 'rename',
        entityType: 'file',
        entityId: file.id,
        metadata: { oldName: file.name, newName: body.name }
      })
    }
    if (body.folderId !== undefined && body.folderId !== file.folderId) {
      await logAudit({
        userId: req.user!.id,
        action: 'move',
        entityType: 'file',
        entityId: file.id,
        metadata: { oldFolderId: file.folderId, newFolderId: body.folderId }
      })
    }
    return res.json({ file: { ...updated, sizeBytes: updated.sizeBytes.toString() } })
  } catch (error) {
    return next(error)
  }
})

fileRouter.post('/:id/share', async (req: AuthRequest, res, next) => {
  try {
    const fileId = String(req.params.id)
    const file = await prisma.file.findFirst({ where: { id: fileId, status: 'active', connectedAccount: { status: 'connected' } } })
    if (!file) {
      return res.status(404).json({ code: 'FILE_NOT_FOUND', message: 'File not found.' })
    }
    if (file.userId !== req.user!.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied.' })
    }
    if (file.status !== 'active') {
      return res.status(400).json({ code: 'FILE_INACTIVE', message: 'File is not active.' })
    }
    const existingShare = await prisma.fileShare.findFirst({ where: { fileId: file.id, userId: req.user!.id, enabled: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, orderBy: { createdAt: 'desc' } })
    if (existingShare?.token) return res.json({ url: `${env.FRONTEND_URL}/public/files/${existingShare.token}`, shareId: existingShare.id })
    if (existingShare) await prisma.fileShare.update({ where: { id: existingShare.id }, data: { enabled: false } })
    const token = randomToken(32)
    const share = await prisma.fileShare.create({ data: { fileId: file.id, userId: req.user!.id, token, tokenHash: hashToken(token) } })
    return res.status(201).json({ url: `${env.FRONTEND_URL}/public/files/${token}`, shareId: share.id })
  } catch (error) {
    return next(error)
  }
})

fileRouter.delete('/:id/share', async (req: AuthRequest, res, next) => {
  try {
    const fileId = String(req.params.id)
    const file = await prisma.file.findFirst({ where: { id: fileId, status: 'active', connectedAccount: { status: 'connected' } } })
    if (!file) {
      return res.status(404).json({ code: 'FILE_NOT_FOUND', message: 'File not found.' })
    }
    if (file.userId !== req.user!.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied.' })
    }
    await prisma.fileShare.updateMany({ where: { fileId: file.id, userId: req.user!.id, enabled: true }, data: { enabled: false } })
    return res.json({ status: 'ok' })
  } catch (error) {
    return next(error)
  }
})

fileRouter.post('/:id/preview-token', async (req: AuthRequest, res, next) => {
  try {
    const fileId = String(req.params.id)
    const file = await prisma.file.findFirst({ where: { id: fileId, status: 'active', connectedAccount: { status: 'connected' } } })
    if (!file) {
      return res.status(404).json({ code: 'FILE_NOT_FOUND', message: 'File not found.' })
    }
    if (file.userId !== req.user!.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied.' })
    }
    if (file.status !== 'active') {
      return res.status(400).json({ code: 'FILE_INACTIVE', message: 'File is not active.' })
    }
    const token = randomToken(32)
    await prisma.filePreviewToken.create({ data: { fileId: file.id, userId: req.user!.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 10 * 60_000) } })
    const path = `/files/preview/${token}`
    return res.status(201).json({ path, url: `${req.protocol}://${req.get('host')}${path}` })
  } catch (error) {
    return next(error)
  }
})

fileRouter.get('/:id/view-url', async (req: AuthRequest, res, next) => {
  try {
    const fileId = String(req.params.id)
    const file = await prisma.file.findFirst({ where: { id: fileId, status: 'active', connectedAccount: { status: 'connected' } }, include: { connectedAccount: true } })
    if (!file) {
      return res.status(404).json({ code: 'FILE_NOT_FOUND', message: 'File not found.' })
    }
    if (file.userId !== req.user!.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied.' })
    }
    if (file.provider === 's3') return res.json({ url: null })
    const auth = await getAuthedGoogleClient(file.connectedAccount)
    const drive = google.drive({ version: 'v3', auth })
    const metadata = await drive.files.get({ fileId: file.providerFileId, fields: 'webViewLink,webContentLink' })
    return res.json({ url: metadata.data.webViewLink ?? metadata.data.webContentLink })
  } catch (error) {
    return next(error)
  }
})

fileRouter.get('/:id/download', async (req: AuthRequest, res, next) => {
  try {
    const fileId = String(req.params.id)
    const file = await prisma.file.findFirst({ where: { id: fileId, status: 'active', connectedAccount: { status: 'connected' } }, include: { connectedAccount: true } })
    if (!file) {
      return res.status(404).json({ code: 'FILE_NOT_FOUND', message: 'File not found.' })
    }
    if (file.userId !== req.user!.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied.' })
    }
    return streamProviderFile(file, req.headers.range, res, { disposition: 'attachment' })
  } catch (error) {
    return next(error)
  }
})

fileRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const fileId = String(req.params.id)
    const file = await prisma.file.findFirst({ where: { id: fileId, status: 'active', connectedAccount: { status: 'connected' } }, include: { connectedAccount: true } })
    if (!file) {
      return res.status(404).json({ code: 'FILE_NOT_FOUND', message: 'File not found.' })
    }
    if (file.userId !== req.user!.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied.' })
    }
    if (file.provider === 's3') await deleteS3Object(file)
    else {
      const auth = await getAuthedGoogleClient(file.connectedAccount)
      const drive = google.drive({ version: 'v3', auth })
      await drive.files.delete({ fileId: file.providerFileId })
    }
    await prisma.file.update({ where: { id: file.id }, data: { status: 'deleted', deletedAt: new Date() } })
    if (file.provider === 's3') await syncS3Quota(file.connectedAccountId)
    else await syncGoogleQuota(file.connectedAccountId)
    
    await logAudit({
      userId: req.user!.id,
      action: 'delete',
      entityType: 'file',
      entityId: file.id,
      metadata: { fileName: file.name }
    })
    return res.json({ status: 'ok' })
  } catch (error) {
    return next(error)
  }
})
