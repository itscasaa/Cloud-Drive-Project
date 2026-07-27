import { decryptText, encryptText, emailHash } from './crypto.js'

/** Encrypt a plaintext PII string for DB storage. Returns null if input is null/undefined/empty. */
export function encryptPii(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  return encryptText(value)
}

/** Encrypt a required PII string (throws if empty). */
export function encryptPiiRequired(value: string): string {
  if (!value) throw new Error('encryptPiiRequired: empty value')
  return encryptText(value)
}

/** Decrypt a stored PII ciphertext. Returns null if input is null/undefined. Falls back to raw value if not encrypted (legacy). */
export function decryptPii(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  try {
    return decryptText(value)
  } catch {
    // Legacy plaintext fallback (should not happen after migration)
    return value
  }
}

/** Decrypt a required PII field. */
export function decryptPiiRequired(value: string): string {
  try {
    return decryptText(value)
  } catch {
    return value
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function emailLookupHash(email: string): string {
  return emailHash(normalizeEmail(email))
}

/** Build encrypted user write payload for create/update. */
export function encryptUserFields(input: { name: string; email: string }) {
  const email = normalizeEmail(input.email)
  return {
    name: encryptPiiRequired(input.name.trim()),
    email: encryptPiiRequired(email),
    emailHash: emailLookupHash(email),
  }
}

/** Build encrypted connected-account identity fields. */
export function encryptAccountIdentity(input: {
  email: string
  displayName?: string | null
  avatarUrl?: string | null
}) {
  const email = normalizeEmail(input.email)
  return {
    email: encryptPiiRequired(email),
    emailHash: emailLookupHash(email),
    displayName: input.displayName ? encryptPiiRequired(input.displayName) : null,
    avatarUrl: input.avatarUrl ? encryptPiiRequired(input.avatarUrl) : null,
  }
}

/** Decrypt user row for API response. Never spreads raw DB fields (passwordHash, etc.). */
export function decryptUserPublic<T extends { id: string; name: string; email: string; role?: string | null; status?: string | null }>(user: T) {
  return {
    id: user.id,
    name: decryptPiiRequired(user.name),
    email: decryptPiiRequired(user.email),
    role: user.role ?? undefined,
    status: user.status ?? undefined,
  }
}

/** Decrypt connected account identity fields for API response. */
export function decryptAccountPublic<T extends {
  email: string
  displayName?: string | null
  avatarUrl?: string | null
}>(account: T) {
  return {
    ...account,
    email: decryptPiiRequired(account.email),
    displayName: decryptPii(account.displayName ?? null),
    avatarUrl: decryptPii(account.avatarUrl ?? null),
  }
}

/** Encrypt session metadata. */
export function encryptSessionMeta(input: { userAgent?: string | null; ipAddress?: string | null }) {
  return {
    userAgent: input.userAgent ? encryptPiiRequired(input.userAgent) : null,
    ipAddress: input.ipAddress ? encryptPiiRequired(input.ipAddress) : null,
  }
}
