import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.middleware.js'
import { decryptPiiRequired, emailLookupHash, decryptUserPublic } from '../../utils/pii.js'

export const inviteRouter = Router()
inviteRouter.use(requireAuth)

const inviteSchema = z.object({ email: z.string().email(), role: z.enum(['viewer', 'editor']).default('viewer'), targetType: z.enum(['file', 'folder']), targetId: z.string().min(1) })

type InviteRecord = { id: string; inviterId: string; inviteeEmail: string; targetType: string; targetId: string; role: string; status: string; revokedAt: Date | null; acceptedAt: Date | null; createdAt: Date; updatedAt: Date }
type TargetRecord = { id: string; name: string; type: 'file' | 'folder'; mimeType?: string; sizeBytes?: string; folderId?: string | null }

async function assertTargetOwner(userId: string, targetType: string, targetId: string) {
  if (targetType === 'file') return prisma.file.findFirstOrThrow({ where: { id: targetId, userId, status: 'active' } })
  return prisma.folder.findFirstOrThrow({ where: { id: targetId, userId, deletedAt: null } })
}

async function resolveTargets(invites: InviteRecord[]) {
  const fileIds = invites.filter((invite) => invite.targetType === 'file').map((invite) => invite.targetId)
  const folderIds = invites.filter((invite) => invite.targetType === 'folder').map((invite) => invite.targetId)
  const [files, folders] = await Promise.all([
    prisma.file.findMany({ where: { id: { in: fileIds }, status: 'active' }, select: { id: true, name: true, mimeType: true, sizeBytes: true, folderId: true } }),
    prisma.folder.findMany({ where: { id: { in: folderIds }, deletedAt: null }, select: { id: true, name: true } }),
  ])
  const targets = new Map<string, TargetRecord>()
  for (const file of files) targets.set(`file:${file.id}`, { id: file.id, name: file.name, type: 'file', mimeType: file.mimeType, sizeBytes: file.sizeBytes.toString(), folderId: file.folderId })
  for (const folder of folders) targets.set(`folder:${folder.id}`, { id: folder.id, name: folder.name, type: 'folder' })
  return targets
}

function serializeInvite(invite: InviteRecord, target: TargetRecord | null, user?: { id: string; name: string; email: string } | null) {
  return {
    id: invite.id,
    email: invite.inviteeEmail,
    role: invite.role,
    status: invite.status,
    targetType: invite.targetType,
    targetId: invite.targetId,
    target,
    revokedAt: invite.revokedAt?.toISOString() ?? null,
    acceptedAt: invite.acceptedAt?.toISOString() ?? null,
    createdAt: invite.createdAt.toISOString(),
    updatedAt: invite.updatedAt.toISOString(),
    user: user ?? null,
  }
}

inviteRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const me = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, select: { email: true } })
    const decryptedMyEmail = decryptPiiRequired(me.email)
    const [sent, received] = await Promise.all([
      prisma.workspaceInvite.findMany({ where: { inviterId: req.user!.id, revokedAt: null, targetId: { not: '' } }, orderBy: { createdAt: 'desc' } }),
      prisma.workspaceInvite.findMany({ where: { inviteeEmail: decryptedMyEmail, revokedAt: null, targetId: { not: '' } }, orderBy: { createdAt: 'desc' } }),
    ])
    const allInvites = [...sent, ...received]
    const emails = [...new Set(sent.map((invite) => invite.inviteeEmail))]
    const emailHashes = emails.map((e) => emailLookupHash(e))
    const users = await prisma.user.findMany({ where: { emailHash: { in: emailHashes } }, select: { id: true, name: true, email: true } })
    const decryptedUsers = users.map((u) => decryptUserPublic(u))
    const userByEmail = new Map(decryptedUsers.map((user) => [user.email.toLowerCase(), user]))
    const acceptedInvites = sent.filter((invite) => invite.status === 'pending' && userByEmail.has(invite.inviteeEmail.toLowerCase()))
    if (acceptedInvites.length > 0) await prisma.workspaceInvite.updateMany({ where: { id: { in: acceptedInvites.map((invite) => invite.id) } }, data: { status: 'accepted', acceptedAt: new Date() } })
    const targetByKey = await resolveTargets(allInvites)
    const sentInvites = sent.map((invite) => serializeInvite({ ...invite, status: userByEmail.has(invite.inviteeEmail.toLowerCase()) ? 'accepted' : invite.status, acceptedAt: userByEmail.has(invite.inviteeEmail.toLowerCase()) ? invite.acceptedAt ?? new Date() : invite.acceptedAt }, targetByKey.get(`${invite.targetType}:${invite.targetId}`) ?? null, userByEmail.get(invite.inviteeEmail.toLowerCase())))
    const receivedInvites = received.map((invite) => serializeInvite(invite, targetByKey.get(`${invite.targetType}:${invite.targetId}`) ?? null))
    return res.json({ sent: sentInvites, received: receivedInvites, invites: sentInvites })
  } catch (error) {
    return next(error)
  }
})

inviteRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = inviteSchema.parse(req.body)
    const email = body.email.trim().toLowerCase()
    const inviter = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, select: { email: true } })
    const decryptedInviterEmail = decryptPiiRequired(inviter.email)
    if (email === decryptedInviterEmail) return res.status(400).json({ code: 'INVITE_SELF_NOT_ALLOWED', message: 'You cannot invite yourself.' })
    await assertTargetOwner(req.user!.id, body.targetType, body.targetId)
    const existingUser = await prisma.user.findUnique({ where: { emailHash: emailLookupHash(email) }, select: { id: true, name: true, email: true } })
    const decryptedExistingUser = existingUser ? decryptUserPublic(existingUser) : null
    const invite = await prisma.workspaceInvite.upsert({
      where: { inviterId_inviteeEmail_targetType_targetId: { inviterId: req.user!.id, inviteeEmail: email, targetType: body.targetType, targetId: body.targetId } },
      create: { inviterId: req.user!.id, inviteeEmail: email, role: body.role, targetType: body.targetType, targetId: body.targetId, status: decryptedExistingUser ? 'accepted' : 'pending', acceptedAt: decryptedExistingUser ? new Date() : null },
      update: { role: body.role, status: decryptedExistingUser ? 'accepted' : 'pending', acceptedAt: decryptedExistingUser ? new Date() : null, revokedAt: null },
    })
    const targetByKey = await resolveTargets([invite])
    return res.status(201).json({ invite: serializeInvite(invite, targetByKey.get(`${invite.targetType}:${invite.targetId}`) ?? null, decryptedExistingUser) })
  } catch (error) {
    return next(error)
  }
})

inviteRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const result = await prisma.workspaceInvite.updateMany({ where: { id: String(req.params.id), inviterId: req.user!.id, revokedAt: null }, data: { status: 'revoked', revokedAt: new Date() } })
    if (result.count === 0) return res.status(404).json({ code: 'INVITE_NOT_FOUND', message: 'Invite not found.' })
    return res.json({ status: 'ok' })
  } catch (error) {
    return next(error)
  }
})
