import { Share2, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/drive/PageHeader'

/*
// ==========================================
// ORIGINAL SHARING WORK-IN-PROGRESS CODE
// (Kept for future release phase)
// ==========================================

import { useEffect, useState } from 'react'
import { Clock, FileArchive, Folder, Trash2, Users, UserCheck } from 'lucide-react'
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

function ResourceIcon({ type }: { type: 'file' | 'folder' }) {
  return type === 'folder' ? <Folder className="h-5 w-5 text-blue-600" /> : <FileArchive className="h-5 w-5 text-blue-600" />
}

export function SharedPageOriginal() {
  const [sentInvites, setSentInvites] = useState<Invite[]>([])
  const [receivedInvites, setReceivedInvites] = useState<Invite[]>([])
  const [message, setMessage] = useState('')
  const pendingCount = sentInvites.filter((invite) => invite.status === 'pending').length
  const acceptedCount = sentInvites.filter((invite) => invite.status === 'accepted').length

  async function loadInvites() {
    const data = await apiFetch<{ sent: Invite[]; received: Invite[] }>('/invites')
    setSentInvites(data.sent)
    setReceivedInvites(data.received)
  }

  useEffect(() => {
    loadInvites().catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load shared resources'))
    window.addEventListener('casanest:invites-changed', loadInvites)
    return () => window.removeEventListener('casanest:invites-changed', loadInvites)
  }, [])

  async function revokeInvite(id: string) {
    await apiFetch(`/invites/${id}`, { method: 'DELETE' })
    await loadInvites()
  }

  return (
    <>
      <PageHeader title="Shared" description="Files and folders shared with members or shared with you." />
      {message ? <p className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</p> : null}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <MetricCard label="Shared Resources" value={String(sentInvites.length + receivedInvites.length)} icon={Users} />
        <MetricCard label="Accepted Members" value={String(acceptedCount)} icon={UserCheck} />
        <MetricCard label="Pending Invites" value={String(pendingCount)} icon={Clock} />
      </div>

      <Card className="mt-8 p-5">
        <h2 className="font-extrabold">Shared With You</h2>
        <div className="mt-4 grid gap-3">
          {receivedInvites.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No files or folders have been shared with you yet.</p> : receivedInvites.map((invite) => (
            <div key={invite.id} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <ResourceIcon type={invite.targetType} />
                <div className="min-w-0"><p className="truncate font-semibold text-slate-950">{invite.target?.name ?? 'Unavailable resource'}</p><p className="text-sm text-slate-500 capitalize">{invite.targetType} • {invite.role}{invite.target?.sizeBytes ? ` • ${formatBytes(invite.target.sizeBytes)}` : ''}</p></div>
              </div>
              <span className={cn('w-fit rounded-full px-3 py-1 text-xs font-bold capitalize', invite.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{invite.status}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="font-extrabold">Resources You Shared</h2>
        <div className="mt-4 grid gap-3">
          {sentInvites.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No files or folders shared yet. Use Invite Members from the top bar.</p> : sentInvites.map((invite) => (
            <div key={invite.id} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <ResourceIcon type={invite.targetType} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{invite.target?.name ?? 'Unavailable resource'}</p>
                  <p className="break-all text-sm text-slate-500">Shared with {invite.email}</p>
                  <p className="mt-1 text-xs text-slate-500">Invited {formatDate(invite.createdAt)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-slate-600">{invite.role}</span>
                <span className={cn('rounded-full px-3 py-1 text-xs font-bold capitalize', invite.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{invite.status}</span>
                <Button variant="danger" size="sm" onClick={() => revokeInvite(invite.id)}><Trash2 className="h-4 w-4" />Revoke</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
*/

export function SharedPage() {
  const navigate = useNavigate()

  return (
    <>
      <PageHeader title="Shared With Me" description="Collaborative files and folders shared across members." />
      
      <div className="mt-12 flex flex-col items-center justify-center px-4">
        <Card className="relative w-full max-w-xl overflow-hidden border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-12">
          {/* Decorative gradients */}
          <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-blue-50/50 blur-2xl pointer-events-none" />
          <div className="absolute -right-16 -bottom-16 h-36 w-36 rounded-full bg-indigo-50/50 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col items-center">
            {/* Pulsing Icon Badge */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner ring-8 ring-blue-50/30">
              <Share2 className="h-7 w-7 animate-pulse" />
            </div>

            <h2 className="mt-8 text-2xl font-extrabold tracking-tight text-slate-950">
              Sharing is coming soon.
            </h2>
            
            <p className="mt-3 max-w-md text-sm font-semibold leading-relaxed text-slate-500">
              Our initial MVP focus is on building a robust, secure personal cloud storage. Shared folders, direct file sharing, and collaborator management will join the nest in an upcoming update.
            </p>

            <div className="mt-8 flex justify-center">
              <Button 
                onClick={() => navigate('/all-files')}
                className="group flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
              >
                Go to All Files
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
