import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, History, LayoutGrid, Link2, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/drive/PageHeader'
import { FileIcon } from '@/components/drive/FileIcon'
import { apiFetch, formatBytes, formatDate } from '@/lib/api'

type RecoveryFile = {
  id: string
  name: string
  mimeType: string
  sizeBytes: string
  createdAt: string
  connectedAccount?: {
    email: string
    provider: string
    recoveryExpiresAt?: string
  }
}

function mimeToKind(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.includes('pdf')) return 'pdf'
  return 'doc'
}

export function RecoveryPage() {
  const [files, setFiles] = useState<RecoveryFile[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  async function loadRecoveryFiles() {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<{ files: RecoveryFile[] }>('/files/recovery')
      setFiles(data.files)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recovery files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecoveryFiles()
  }, [])

  useEffect(() => {
    function handleStatus(status: string) {
      if (status === 'success') {
        loadRecoveryFiles().catch(() => undefined)
        window.dispatchEvent(new Event('casanest:storage-changed'))
      }
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== 'GOOGLE_CONNECTED') return
      handleStatus(event.data.status)
    }

    function onStorage(event: StorageEvent) {
      if (event.key === 'casanest:google-connected' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as { status: string; timestamp: number }
          if (Date.now() - parsed.timestamp < 10000) {
            handleStatus(parsed.status)
            localStorage.removeItem('casanest:google-connected')
          }
        } catch {}
      }
    }

    window.addEventListener('message', onMessage)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  async function reconnectDrive() {
    setConnecting(true)
    try {
      const data = await apiFetch<{ url: string }>('/connected-accounts/google/connect-url')
      const popup = window.open(data.url, 'google-drive-connect', 'width=540,height=720')
      if (!popup) window.location.href = data.url
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setConnecting(false)
    }
  }

  function getDaysLeft(expiresAtStr?: string) {
    if (!expiresAtStr) return 3
    const expiresAt = new Date(expiresAtStr)
    const diffMs = expiresAt.getTime() - Date.now()
    if (diffMs <= 0) return 0
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
    return Math.min(3, diffDays)
  }

  return (
    <div className="w-full min-w-0">
      <PageHeader 
        title="Recovery & Backup" 
        actions={
          files.length > 0 ? (
            <Button onClick={reconnectDrive} disabled={connecting}>
              <Link2 className="h-4 w-4" />
              {connecting ? 'Connecting...' : 'Reconnect Google Drive'}
            </Button>
          ) : undefined
        } 
      />

      {error ? (
        <p className="mt-5 rounded-xl bg-red-50 p-3.5 text-sm font-semibold text-red-600 border border-red-100">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-10 text-center font-semibold text-slate-500">Loading recovery files...</div>
      ) : files.length === 0 ? (
        <Card className="mt-5 flex flex-col items-center justify-center p-8 text-center sm:p-12">
          <History className="h-12 w-12 text-slate-400" />
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">No files in recovery</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm font-medium leading-relaxed">
            All files are healthy and active. All connected cloud drives are functioning normally.
          </p>
        </Card>
      ) : (
        <div className="mt-5 space-y-6">
          {/* Warning Banner */}
          <Card className="border-amber-200 bg-amber-50/50 p-4 sm:p-5 text-amber-900 shadow-sm">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200 shadow-sm">
                    <Clock className="h-3.5 w-3.5" />
                    3-Day Backup
                  </span>
                  <span className="text-xs font-bold text-amber-700">
                    Expires in 3 days
                  </span>
                </div>
                <p className="text-sm font-extrabold text-amber-900 leading-snug">
                  Reconnect the same Google account to restore these files.
                </p>
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  These files belong to a disconnected Google Drive account. Reconnect within 3 days to restore them in CasaNest. If the account is not reconnected before the countdown ends, the metadata inside CasaNest will be permanently cleared. The actual files in your Google Drive will NOT be deleted.
                </p>
              </div>
            </div>
          </Card>

          {/* View Mode controls & Subtitle */}
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-extrabold text-slate-700">Disconnected Files ({files.length})</h2>
            <div className="flex gap-2">
              <Button variant={viewMode === 'grid' ? 'soft' : 'outline'} size="icon" aria-label="Show as grid" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'soft' : 'outline'} size="icon" aria-label="Show as list" onClick={() => setViewMode('list')}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Files List / Grid */}
          {viewMode === 'list' ? (
            <>
              {/* Mobile Card List view */}
              <div className="grid gap-3 sm:hidden">
                {files.map((file) => {
                  const daysLeft = getDaysLeft(file.connectedAccount?.recoveryExpiresAt)
                  const kind = mimeToKind(file.mimeType)
                  return (
                    <article key={file.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          <FileIcon kind={kind} />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <h3 className="line-clamp-2 break-all text-sm font-extrabold leading-snug text-slate-950" title={file.name}>{file.name}</h3>
                          <p className="mt-1 truncate text-xs text-slate-500">{file.connectedAccount?.email ?? 'Unknown Account'}</p>
                          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">{formatBytes(file.sizeBytes)}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">{formatDate(file.createdAt)}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                              <Clock className="h-3 w-3" />
                              3-Day Backup
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              Expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* Desktop Table view */}
              <Card className="hidden sm:block overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        <th className="px-4.5 py-3">File Name</th>
                        <th className="px-4.5 py-3">Account Email</th>
                        <th className="px-4.5 py-3">Size</th>
                        <th className="px-4.5 py-3">Status / Expiry</th>
                        <th className="px-4.5 py-3">Date Disconnected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/75 bg-white text-slate-900">
                      {files.map((file) => {
                        const daysLeft = getDaysLeft(file.connectedAccount?.recoveryExpiresAt)
                        return (
                          <tr key={file.id} className="hover:bg-slate-50/50 transition duration-150">
                            <td className="px-4.5 py-3.5 font-bold text-slate-900 truncate max-w-xs" title={file.name}>
                              {file.name}
                            </td>
                            <td className="px-4.5 py-3.5 text-slate-500 font-medium truncate max-w-[180px]" title={file.connectedAccount?.email}>
                              {file.connectedAccount?.email ?? 'Unknown Account'}
                            </td>
                            <td className="px-4.5 py-3.5 text-slate-500 font-medium">
                              {formatBytes(file.sizeBytes)}
                            </td>
                            <td className="px-4.5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 shadow-sm border border-amber-200">
                                  <Clock className="h-3 w-3" />
                                  3-Day Backup
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                  Expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4.5 py-3.5 text-slate-500 font-medium">
                              {formatDate(file.createdAt)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {files.map((file) => {
                const daysLeft = getDaysLeft(file.connectedAccount?.recoveryExpiresAt)
                const kind = mimeToKind(file.mimeType)
                return (
                  <Card key={file.id} className="relative overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex justify-center mt-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <FileIcon kind={kind} className="h-9 w-9 rounded-xl p-2" />
                      </div>
                    </div>
                    <div className="mt-5 text-center">
                      <h3 className="line-clamp-2 min-h-10 text-sm font-extrabold text-slate-950" title={file.name}>{file.name}</h3>
                      <p className="mt-1 text-xs text-slate-500 truncate" title={file.connectedAccount?.email}>
                        {file.connectedAccount?.email}
                      </p>
                      <p className="mt-1 text-xs text-slate-400 font-medium">{formatBytes(file.sizeBytes)}</p>
                      
                      <div className="mt-4 flex flex-col items-center gap-1.5 border-t border-slate-100 pt-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200 shadow-sm">
                          <Clock className="h-3 w-3" />
                          3-Day Backup
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
