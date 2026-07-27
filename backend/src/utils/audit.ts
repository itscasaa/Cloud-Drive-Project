import { prisma } from '../config/prisma.js'

export async function logAudit(options: {
  userId: string | null
  action: string
  entityType: string
  entityId?: string | null
  metadata?: any
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId ?? null,
        metadata: options.metadata ?? null,
      }
    })
  } catch (error) {
    console.error('[audit] failed to write audit log:', error)
  }
}
