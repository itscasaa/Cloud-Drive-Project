/**
 * One-shot data migration: encrypt existing plaintext PII fields in-place.
 *
 * Encrypts:
 *  - users.name, users.email  (+ fills users.email_hash)
 *  - connected_accounts.email, display_name, avatar_url  (+ fills email_hash)
 *  - user_sessions.user_agent, ip_address
 *
 * Safe to re-run: skips rows that already look encrypted (contain two ':' separators
 * in AES-GCM payload format `iv:tag:ciphertext`).
 *
 * Usage (from backend container or host with DATABASE_URL set):
 *   npx tsx src/scripts/migrate-to-encrypted-pii.ts
 */
import crypto from 'node:crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function getKey() {
  const raw = process.env.TOKEN_ENCRYPTION_KEY
  if (!raw) throw new Error('TOKEN_ENCRYPTION_KEY is required')
  return crypto.createHash('sha256').update(raw).digest()
}

const key = getKey()

function encryptText(value: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function emailHash(email: string) {
  return hashToken(email.trim().toLowerCase())
}

/** AES-GCM payload looks like base64:base64:base64 (exactly 2 colons, 3 non-empty parts) */
function isAlreadyEncrypted(value: string | null | undefined): boolean {
  if (!value) return false
  const parts = value.split(':')
  if (parts.length !== 3) return false
  // base64-ish check: length > 8 and only base64 chars
  return parts.every((p) => p.length >= 8 && /^[A-Za-z0-9+/=_-]+$/.test(p))
}

async function migrateUsers() {
  // Use raw query because Prisma client may already map fields as encrypted names
  const rows = await prisma.$queryRaw<Array<{ id: string; name: string; email: string; email_hash: string | null }>>`
    SELECT id, name, email, email_hash FROM users
  `
  console.log(`[users] found ${rows.length} rows`)
  let updated = 0
  for (const row of rows) {
    const nameIsEnc = isAlreadyEncrypted(row.name)
    const emailIsEnc = isAlreadyEncrypted(row.email)
    const hasHash = !!row.email_hash

    if (nameIsEnc && emailIsEnc && hasHash) {
      console.log(`  skip user ${row.id} (already encrypted)`)
      continue
    }

    // If email is still plaintext, derive hash from it; otherwise keep existing hash
    const plainEmail = emailIsEnc ? null : row.email
    const newEmailHash = plainEmail ? emailHash(plainEmail) : row.email_hash
    if (!newEmailHash) {
      console.warn(`  WARN: user ${row.id} has encrypted email but no email_hash — cannot recover. Skipping.`)
      continue
    }

    const newName = nameIsEnc ? row.name : encryptText(row.name)
    const newEmail = emailIsEnc ? row.email : encryptText(row.email.trim().toLowerCase())

    await prisma.$executeRaw`
      UPDATE users
      SET name = ${newName},
          email = ${newEmail},
          email_hash = ${newEmailHash}
      WHERE id = ${row.id}
    `
    updated++
    console.log(`  encrypted user ${row.id}`)
  }
  console.log(`[users] updated ${updated}`)
}

async function migrateConnectedAccounts() {
  const rows = await prisma.$queryRaw<Array<{
    id: string
    email: string
    display_name: string | null
    avatar_url: string | null
    email_hash: string | null
  }>>`
    SELECT id, email, display_name, avatar_url, email_hash FROM connected_accounts
  `
  console.log(`[connected_accounts] found ${rows.length} rows`)
  let updated = 0
  for (const row of rows) {
    const emailIsEnc = isAlreadyEncrypted(row.email)
    const displayIsEnc = !row.display_name || isAlreadyEncrypted(row.display_name)
    const avatarIsEnc = !row.avatar_url || isAlreadyEncrypted(row.avatar_url)
    const hasHash = !!row.email_hash

    if (emailIsEnc && displayIsEnc && avatarIsEnc && hasHash) {
      console.log(`  skip account ${row.id} (already encrypted)`)
      continue
    }

    const plainEmail = emailIsEnc ? null : row.email
    const newEmailHash = plainEmail ? emailHash(plainEmail) : row.email_hash
    if (!newEmailHash) {
      console.warn(`  WARN: account ${row.id} has encrypted email but no email_hash — skipping.`)
      continue
    }

    const newEmail = emailIsEnc ? row.email : encryptText(row.email.trim().toLowerCase())
    const newDisplay = displayIsEnc
      ? row.display_name
      : (row.display_name ? encryptText(row.display_name) : null)
    const newAvatar = avatarIsEnc
      ? row.avatar_url
      : (row.avatar_url ? encryptText(row.avatar_url) : null)

    await prisma.$executeRaw`
      UPDATE connected_accounts
      SET email = ${newEmail},
          email_hash = ${newEmailHash},
          display_name = ${newDisplay},
          avatar_url = ${newAvatar}
      WHERE id = ${row.id}
    `
    updated++
    console.log(`  encrypted account ${row.id}`)
  }
  console.log(`[connected_accounts] updated ${updated}`)
}

async function migrateSessions() {
  const rows = await prisma.$queryRaw<Array<{
    id: string
    user_agent: string | null
    ip_address: string | null
  }>>`
    SELECT id, user_agent, ip_address FROM user_sessions
  `
  console.log(`[user_sessions] found ${rows.length} rows`)
  let updated = 0
  for (const row of rows) {
    const uaIsEnc = !row.user_agent || isAlreadyEncrypted(row.user_agent)
    const ipIsEnc = !row.ip_address || isAlreadyEncrypted(row.ip_address)
    if (uaIsEnc && ipIsEnc) {
      console.log(`  skip session ${row.id} (already encrypted)`)
      continue
    }
    const newUa = uaIsEnc ? row.user_agent : encryptText(row.user_agent!)
    const newIp = ipIsEnc ? row.ip_address : encryptText(row.ip_address!)
    await prisma.$executeRaw`
      UPDATE user_sessions
      SET user_agent = ${newUa},
          ip_address = ${newIp}
      WHERE id = ${row.id}
    `
    updated++
    console.log(`  encrypted session ${row.id}`)
  }
  console.log(`[user_sessions] updated ${updated}`)
}

async function addUniqueConstraints() {
  // Create unique index on users.email_hash now that all rows have values
  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "users_email_hash_key" ON "users"("email_hash")
  `
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "connected_accounts_email_hash_idx" ON "connected_accounts"("email_hash")
  `
  // Make email_hash NOT NULL after data is filled
  await prisma.$executeRaw`
    ALTER TABLE "users" ALTER COLUMN "email_hash" SET NOT NULL
  `
  await prisma.$executeRaw`
    ALTER TABLE "connected_accounts" ALTER COLUMN "email_hash" SET NOT NULL
  `
  console.log('[constraints] unique/index + NOT NULL applied')
}

async function main() {
  console.log('=== Zero-Knowledge PII Migration ===')
  console.log('TOKEN_ENCRYPTION_KEY present:', !!process.env.TOKEN_ENCRYPTION_KEY)
  await migrateUsers()
  await migrateConnectedAccounts()
  await migrateSessions()
  await addUniqueConstraints()
  console.log('=== DONE ===')
}

main()
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
