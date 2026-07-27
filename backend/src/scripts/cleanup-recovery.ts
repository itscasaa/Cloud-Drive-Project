import { prisma } from '../config/prisma.js'
import { decryptPii } from '../utils/pii.js'

export async function cleanupExpiredRecoveryMetadata() {
  const now = new Date()

  // Find all expired disconnected accounts
  const expiredAccounts = await prisma.connectedAccount.findMany({
    where: {
      status: 'disconnected',
      recoveryExpiresAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      email: true,
    },
  })

  if (expiredAccounts.length === 0) {
    return
  }

  console.log(`[Cleanup Job] Found ${expiredAccounts.length} expired disconnected accounts. Deleting metadata...`)

  for (const account of expiredAccounts) {
    // Delete the connected account row. Cascade onDelete constraint will clean up associated Files, Shares, etc.
    await prisma.connectedAccount.delete({
      where: { id: account.id },
    })
    const plainEmail = decryptPii(account.email) ?? account.email
    console.log(`[Cleanup Job] Successfully deleted database metadata for account: ${plainEmail}`)
  }
}

// Allow running as a standalone script
const isMain = process.argv[1] && (
  process.argv[1].endsWith('cleanup-recovery.ts') || 
  process.argv[1].endsWith('cleanup-recovery.js') ||
  process.argv[1].endsWith('cleanup-recovery')
)

if (isMain) {
  cleanupExpiredRecoveryMetadata()
    .then(() => {
      console.log('Cleanup completed.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Cleanup failed:', error)
      process.exit(1)
    })
}
