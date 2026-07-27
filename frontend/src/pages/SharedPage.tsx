import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Copy,
  FileArchive,
  Folder,
  Link2,
  Lock,
  Share2,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/drive/PageHeader'
import { MetricCard } from '@/components/drive/MetricCard'
import { apiFetch, formatBytes, formatDate } from '@/lib/api'
import { cn } from '@/lib/utils'

type InviteTarget = { id: string; name: string; type: 'file' | 'folder'; mimeType?: string; sizeBytes?: string }
type Invite = {
  id: string
  email: string
  role: string
  status: string
  targetType: 'file' | 'folder'
  targetId: string
  target: InviteTarget | null
  createdAt: string
  acceptedAt: string | null
  user: { id: string; name: string; email: string } | null
}

type SharedLink = {
  id: string
  url: string | null
  createdAt: string
  expiresAt: string | null
  allowDownload: boolean
  hasPassword: boolean
  viewCount: number
  downloadCount: number
  status: 'active' | 'expired'
  file: {
    id: string
    name: string
    mimeType: string
    sizeBytes: string
    createdAt: string
    folder?: { id: string; name: string } | null
  }
}

function ResourceIcon({ type }: { type: 'file' | 'folder' }) {
  return type === 'folder' ? (
    <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
  ) : (
    <FileArchive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
  )
}

export function SharedPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'links' | 'invites'>('links')
  const [shares, setShares] = useState<SharedLink[]>([])
  const [sentInvites, setSentInvites] = useState<Invite[]>([])
  const [receivedInvites, setReceivedInvites] = useState<Invite[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const pendingCount = sentInvites.filter((invite) => invite.status === 'pending').length
  const acceptedCount = sentInvites.filter((invite) => invite.status === 'accepted').length
  const activeLinks = useMemo(() => shares.filter((s) => s.status === 'active').length, [shares])

  async function loadShares() {
    const data = await apiFetch<{ shares: SharedLink[] }>('/files/shared-links')
    setShares(data.shares)
  }

  async function loadInvites() {
    const data = await apiFetch<{ sent: Invite[]; received: Invite[] }>('/invites')
    setSentInvites(data.sent)
    setReceivedInvites(data.received)
  }

  async function refreshAll() {
    setLoading(true)
    setMessage('')
    try {
      await Promise.all([loadShares(), loadInvites()])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load sharing data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshAll().catch(() => undefined)
    const onInvites = () => loadInvites().catch(() => undefined)
    const onShares = () => loadShares().catch(() => undefined)
    window.addEventListener('casanest:invites-changed', onInvites)
    window.addEventListener('casanest:shares-changed', onShares)
    return () => {
      window.removeEventListener('casanest:invites-changed', onInvites)
      window.removeEventListener('casanest:shares-changed', onShares)
    }
  }, [])

  async function revokeShare(id: string) {
    await apiFetch(`/files/shared-links/${id}`, { method: 'DELETE' })
    await loadShares()
    setMessage('Share link revoked.')
  }

  async function revokeInvite(id: string) {
    await apiFetch(`/invites/${id}`, { method: 'DELETE' })
    await loadInvites()
    setMessage('Invite revoked.')
  }

  async function copyLink(share: SharedLink) {
    if (!share.url) {
      setMessage('Link token not available for this share. Create a new link from All Files.')
      return
    }
    await navigator.clipboard.writeText(share.url)
    setCopiedId(share.id)
    window.setTimeout(() => setCopiedId((cur) => (cur === share.id ? null : cur)), 1600)
  }

  return (
    <>
      <PageHeader
        title="Shared"
        description="Public links and member invites for files on CasaNest."
        actions={
          <Button variant="outline" onClick={() => navigate('/all-files')}>
            <Share2 className="h-4 w-4" />
            Share from All Files
          </Button>
        }
      />

      {message ? <p className="mt-5 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700">{message}</p> : null}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <MetricCard label="Active Public Links" value={String(activeLinks)} icon={Link2} />
        <MetricCard label="Accepted Members" value={String(acceptedCount)} icon={UserCheck} />
        <MetricCard label="Pending Invites" value={String(pendingCount)} icon={Clock} />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button variant={tab === 'links' ? 'soft' : 'outline'} onClick={() => setTab('links')}>
          <Link2 className="h-4 w-4" />
          Public Links
        </Button>
        <Button variant={tab === 'invites' ? 'soft' : 'outline'} onClick={() => setTab('invites')}>
          <Users className="h-4 w-4" />
          Member Invites
        </Button>
        <Button variant="ghost" onClick={() => refreshAll()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading sharing data…</p>
      ) : null}

      {tab === 'links' ? (
        <Card className="mt-6 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-extrabold text-slate-950 dark:text-slate-50">Public share links</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Anyone with the link can open the file on CasaNest (not Google Drive).
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {shares.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
                <Share2 className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" />
                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No public links yet.</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Open All Files → right click a file → Share Link.
                </p>
                <Button className="mt-5" onClick={() => navigate('/all-files')}>
                  Go to All Files
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              shares.map((share) => (
                <div
                  key={share.id}
                  className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400 dark:shadow-black/20">
                      <FileArchive className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950 dark:text-slate-50">{share.file.name}</p>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {formatBytes(share.file.sizeBytes)}
                        {share.file.folder?.name ? ` • ${share.file.folder.name}` : ''}
                        {' • '}
                        created {formatDate(share.createdAt)}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                        {share.url ?? 'Link token hidden — recreate from All Files to copy again.'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                            share.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
                          )}
                        >
                          {share.status}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          {share.allowDownload ? 'Download on' : 'View only'}
                        </span>
                        {share.hasPassword ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                            <Lock className="h-3 w-3" /> Password
                          </span>
                        ) : null}
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          {share.expiresAt ? `Expires ${formatDate(share.expiresAt)}` : 'Never expires'}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          {share.viewCount} views • {share.downloadCount} downloads
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyLink(share)} disabled={!share.url}>
                      {copiedId === share.id ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedId === share.id ? 'Copied' : 'Copy'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        revokeShare(share.id).catch((e) => setMessage(e instanceof Error ? e.message : 'Revoke failed'))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : (
        <>
          <Card className="mt-6 p-5">
            <h2 className="font-extrabold text-slate-950 dark:text-slate-50">Shared With You</h2>
            <div className="mt-4 grid gap-3">
              {receivedInvites.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  No files or folders have been shared with you yet.
                </p>
              ) : (
                receivedInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <ResourceIcon type={invite.targetType} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950 dark:text-slate-50">
                          {invite.target?.name ?? 'Unavailable resource'}
                        </p>
                        <p className="text-sm capitalize text-slate-500 dark:text-slate-400">
                          {invite.targetType} • {invite.role}
                          {invite.target?.sizeBytes ? ` • ${formatBytes(invite.target.sizeBytes)}` : ''}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'w-fit rounded-full px-3 py-1 text-xs font-bold capitalize',
                        invite.status === 'accepted'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
                      )}
                    >
                      {invite.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="mt-6 p-5">
            <h2 className="font-extrabold text-slate-950 dark:text-slate-50">Resources You Shared</h2>
            <div className="mt-4 grid gap-3">
              {sentInvites.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  No member invites yet. Use Invite Members from a file/folder menu.
                </p>
              ) : (
                sentInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <ResourceIcon type={invite.targetType} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950 dark:text-slate-50">
                          {invite.target?.name ?? 'Unavailable resource'}
                        </p>
                        <p className="break-all text-sm text-slate-500 dark:text-slate-400">Shared with {invite.email}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Invited {formatDate(invite.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        {invite.role}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-bold capitalize',
                          invite.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
                        )}
                      >
                        {invite.status}
                      </span>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          revokeInvite(invite.id).catch((e) =>
                            setMessage(e instanceof Error ? e.message : 'Revoke failed'),
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </>
  )
}
