export type UpdateLogKind = 'feature' | 'fix' | 'security' | 'improvement' | 'notice'

export type UpdateLogEntry = {
  id: string
  version?: string
  title: string
  summary: string
  kind: UpdateLogKind
  date: string
  highlights?: string[]
  href?: string
  source?: 'product' | 'github'
}

/** Curated CasaNest product update logs — keep newest first. */
export const PRODUCT_UPDATE_LOGS: UpdateLogEntry[] = [
  {
    id: '2026-07-23-secure-shares',
    version: '1.4.0',
    title: 'Secure public share links',
    summary: 'Share files with optional password, expiry, and download control — safer for public handoffs.',
    kind: 'security',
    date: '2026-07-23T12:00:00.000Z',
    highlights: [
      'Password-protected share links',
      'Expiry + allow-download toggles',
      'Hardened public file viewer on mobile',
    ],
    source: 'product',
  },
  {
    id: '2026-07-23-dark-mode',
    version: '1.3.2',
    title: 'Dashboard dark mode polish',
    summary: 'Theme toggle now carries through header, drawers, and storage surfaces with smoother transitions.',
    kind: 'improvement',
    date: '2026-07-23T08:30:00.000Z',
    highlights: ['Theme animation on chrome', 'Better contrast on slate surfaces', 'Mobile header dark tokens'],
    source: 'product',
  },
  {
    id: '2026-07-21-zk-hardening',
    version: '1.3.0',
    title: 'Zero-knowledge hardening pass',
    summary: 'Stronger PII handling and security defaults across auth and account recovery flows.',
    kind: 'security',
    date: '2026-07-21T15:00:00.000Z',
    highlights: ['Encrypted sensitive fields', 'Recovery flow safety checks', 'Audit-friendly error codes'],
    source: 'product',
  },
  {
    id: '2026-07-16-landing-mobile',
    version: '1.2.1',
    title: 'Landing & dashboard mobile layout',
    summary: 'Responsive nest shell for phone, tablet, and desktop — sidebar drawer, stacked cards, tighter headers.',
    kind: 'improvement',
    date: '2026-07-16T10:00:00.000Z',
    highlights: ['Hamburger sidebar drawer', 'File list card fallback on small screens', 'Viewport-safe modals'],
    source: 'product',
  },
  {
    id: '2026-07-16-casanest-rebrand',
    version: '1.2.0',
    title: 'CasaNest rebrand',
    summary: 'Fresh brand system, logo, and product story — storage nest for connected drives.',
    kind: 'feature',
    date: '2026-07-16T09:00:00.000Z',
    highlights: ['New brand logo assets', 'Editorial landing sections', 'Consistent Plus Jakarta type'],
    source: 'product',
  },
  {
    id: '2026-06-11-s3-routing',
    version: '1.1.0',
    title: 'S3-compatible storage routing',
    summary: 'Upload routing policies and S3-compatible backends join Google Drive in the nest.',
    kind: 'feature',
    date: '2026-06-11T12:00:00.000Z',
    highlights: ['S3 / R2 connection path', 'Upload routing policy', 'API key upload access'],
    source: 'product',
  },
  {
    id: '2026-06-05-google-auth',
    version: '1.0.1',
    title: 'Google sign-in & Drive connect',
    summary: 'One-tap Google auth handoff plus multi-account Drive quota tracking.',
    kind: 'feature',
    date: '2026-06-05T09:00:00.000Z',
    highlights: ['Google OAuth handoff tokens', 'Connected drives quota UI', 'Optional reCAPTCHA on register'],
    source: 'product',
  },
  {
    id: '2026-06-04-launch',
    version: '1.0.0',
    title: 'CasaNest launch',
    summary: 'Virtual folders, previews, invites, and unified storage gateway for connected drives.',
    kind: 'notice',
    date: '2026-06-04T08:00:00.000Z',
    highlights: ['Email + Google login', 'File/folder workspace', 'Share & invite flows'],
    source: 'product',
  },
]

export const UPDATE_LOGS_SEEN_KEY = 'casanest:update-logs-seen-v1'

export function getLatestUpdateLogId(entries: UpdateLogEntry[] = PRODUCT_UPDATE_LOGS) {
  return entries[0]?.id ?? ''
}

export function getSeenUpdateLogId() {
  try {
    return localStorage.getItem(UPDATE_LOGS_SEEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export function markUpdateLogsSeen(latestId: string) {
  try {
    localStorage.setItem(UPDATE_LOGS_SEEN_KEY, latestId)
  } catch {
    // ignore private mode / blocked storage
  }
}

export function countUnseenUpdateLogs(entries: UpdateLogEntry[] = PRODUCT_UPDATE_LOGS) {
  const seen = getSeenUpdateLogId()
  if (!seen) return Math.min(entries.length, 5)
  const idx = entries.findIndex((entry) => entry.id === seen)
  if (idx <= 0) return 0
  return idx
}
