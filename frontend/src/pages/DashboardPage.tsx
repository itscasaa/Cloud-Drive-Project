import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle,
  Database,
  FileArchive,
  FolderPlus,
  HardDrive,
  Link2,
  Plus,
  RefreshCw,
  Shield,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GoogleDriveIcon } from '@/components/drive/GoogleDriveIcon'
import { PageHeader } from '@/components/drive/PageHeader'
import { apiFetch, formatBytes, formatDate } from '@/lib/api'
import { cn } from '@/lib/utils'

type StorageSummary = {
  totalBytes: string
  usedBytes: string
  availableBytes: string
  accounts: Array<{
    id: string
    provider: string
    email: string
    status: string
    totalBytes: string | null
    usedBytes: string
    availableBytes: string | null
    lastSyncedAt: string | null
  }>
}

type StorageBreakdown = {
  photo: string
  video: string
  document: string
}

type BackendFile = {
  id: string
  name: string
  mimeType: string
  sizeBytes: string
  createdAt: string
  connectedAccount?: { email: string; provider: string }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<StorageSummary | null>(null)
  const [breakdown, setBreakdown] = useState<StorageBreakdown>({ photo: '0', video: '0', document: '0' })
  const [files, setFiles] = useState<BackendFile[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [connecting, setConnecting] = useState(false)

  async function loadData() {
    try {
      const [summaryData, breakdownData, filesData] = await Promise.all([
        apiFetch<StorageSummary>('/storage/summary'),
        apiFetch<StorageBreakdown>('/storage/breakdown'),
        apiFetch<{ files: BackendFile[] }>('/files'),
      ])
      setSummary(summaryData)
      setBreakdown(breakdownData)
      setFiles(filesData.files)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData().catch(() => undefined)
  }, [])

  async function syncAccount(accountId: string) {
    setSyncingId(accountId)
    setMessage('')
    try {
      await apiFetch(`/connected-accounts/${accountId}/sync-quota`, { method: 'POST' })
      const summaryData = await apiFetch<StorageSummary>('/storage/summary')
      setSummary(summaryData)
      setMessage('Drive quota synced successfully.')
      window.dispatchEvent(new Event('casanest:storage-changed'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sync failed')
    } finally {
      setSyncingId(null)
    }
  }

  async function connectDrive() {
    setConnecting(true)
    setMessage('')
    try {
      const data = await apiFetch<{ url: string }>('/connected-accounts/google/connect-url')
      const popup = window.open(data.url, 'google-drive-connect', 'width=540,height=720')
      if (!popup) window.location.href = data.url
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to start Google Drive connection')
    } finally {
      setConnecting(false)
    }
  }

  // Auto-listen to Google callback messages
  useEffect(() => {
    function handleStatus(status: string) {
      if (status === 'success') {
        setMessage('Google Drive connected.')
      } else if (status === 'limit_reached') {
        setMessage('Maximum of 4 Google Drive accounts reached.')
      } else if (status === 'duplicate') {
        setMessage('This Google Drive account is already connected.')
      } else {
        setMessage('Google Drive connection failed.')
      }
      loadData().catch(() => undefined)
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

  const totalBytes = Number(summary?.totalBytes ?? 0)
  const usedBytes = Number(summary?.usedBytes ?? 0)
  const progressPercent = totalBytes > 0 ? Math.min(100, Math.round((usedBytes / totalBytes) * 100)) : 0

  const googleAccounts = summary?.accounts.filter((a) => a.provider === 'google_drive') ?? []
  const googleCount = googleAccounts.length

  const recentFiles = files.slice(0, 5)

  // Calculate breakdown percentages
  const photoVal = Number(breakdown.photo)
  const videoVal = Number(breakdown.video)
  const docVal = Number(breakdown.document)
  const totalBreakdown = Math.max(photoVal + videoVal + docVal, 1)

  const photoPct = Math.round((photoVal / totalBreakdown) * 100)
  const videoPct = Math.round((videoVal / totalBreakdown) * 100)
  const docPct = Math.round((docVal / totalBreakdown) * 100)

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Welcome back to CasaNest. Manage your secure connected drives."
      />

      {message && (
        <div className="mt-5 rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm font-semibold text-blue-800 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200 animate-fadeIn">
          {message}
        </div>
      )}

      {/* Metrics Row */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col justify-between p-5 border border-slate-100 dark:border-slate-800/80 dark:border-slate-800 shadow-sm transition hover:shadow-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Storage</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-50">{formatBytes(summary?.totalBytes)}</p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-400">
            <HardDrive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Across all connected providers</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5 border border-slate-100 dark:border-slate-800/80 dark:border-slate-800 shadow-sm transition hover:shadow-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Used Storage</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-50">{formatBytes(summary?.usedBytes)}</p>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1.5 text-right text-xs font-bold text-blue-600 dark:text-blue-400">{progressPercent}% Utilized</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5 border border-slate-100 dark:border-slate-800/80 dark:border-slate-800 shadow-sm transition hover:shadow-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Connected Drives</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-50">{summary?.accounts.length ?? 0}</p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-400">
            <GoogleDriveIcon className="h-4 w-4" />
            <span>Google Drive & S3 Accounts</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5 border border-slate-100 dark:border-slate-800/80 dark:border-slate-800 shadow-sm transition hover:shadow-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Files Managed</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-50">{files.length}</p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-400">
            <FileArchive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Virtual folder record mapping</span>
          </div>
        </Card>
      </div>

      {/* Main Grid Section */}
      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        {/* Left and Middle Columns (2/3 width on desktop) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Storage Usage Breakdown */}
          <Card className="p-6 border border-slate-100 dark:border-slate-800/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Storage Distribution</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Visualize your storage usage grouped by media file category.</p>

            <div className="mt-6 flex h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="bg-lime-500 transition-all" style={{ width: `${photoPct}%` }} title={`Photos: ${photoPct}%`} />
              <div className="bg-yellow-400 transition-all" style={{ width: `${videoPct}%` }} title={`Videos: ${videoPct}%`} />
              <div className="bg-cyan-400 transition-all" style={{ width: `${docPct}%` }} title={`Documents: ${docPct}%`} />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-3">
                <span className="inline-block h-3.5 w-3.5 rounded bg-lime-500" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Photos</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50 mt-0.5">{formatBytes(breakdown.photo)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-3">
                <span className="inline-block h-3.5 w-3.5 rounded bg-yellow-400" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Videos</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50 mt-0.5">{formatBytes(breakdown.video)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-3">
                <span className="inline-block h-3.5 w-3.5 rounded bg-cyan-400" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Documents</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50 mt-0.5">{formatBytes(breakdown.document)}</p>
              </div>
            </div>
          </Card>

          {/* Recent Files table/card */}
          <Card className="p-6 border border-slate-100 dark:border-slate-800/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Recent Files</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Quick access to files uploaded recently to your nest.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/all-files')}>
                View All Files
              </Button>
            </div>

             <div className="mt-4">
              {recentFiles.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-400 italic">No files uploaded yet.</div>
              ) : (
                <>
                  {/* Mobile Cards List */}
                  <div className="grid gap-3 sm:hidden">
                    {recentFiles.map((file) => (
                      <div key={file.id} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-3.5 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
                            <FileArchive className="h-4.5 w-4.5 shrink-0 text-blue-600 dark:text-blue-400" />
                            <span className="truncate text-sm">{file.name}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <span>{formatBytes(file.sizeBytes)}</span>
                            <span>•</span>
                            <span className="capitalize">{file.connectedAccount?.provider === 's3' ? 'S3 Compatible' : 'Google Drive'}</span>
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold text-slate-400 dark:text-slate-400">{formatDate(file.createdAt)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                          <th className="py-3 font-semibold">Name</th>
                          <th className="py-3 font-semibold">Size</th>
                          <th className="py-3 font-semibold">Provider</th>
                          <th className="py-3 font-semibold">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentFiles.map((file) => (
                          <tr key={file.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:bg-slate-800/50 transition">
                            <td className="py-3.5 flex items-center gap-2.5 max-w-[240px] md:max-w-xs truncate font-semibold text-slate-900 dark:text-slate-50">
                              <FileArchive className="h-4.5 w-4.5 shrink-0 text-blue-600 dark:text-blue-400" />
                              <span className="truncate">{file.name}</span>
                            </td>
                            <td className="py-3.5 text-sm text-slate-500 dark:text-slate-400 font-medium">{formatBytes(file.sizeBytes)}</td>
                            <td className="py-3.5 text-sm text-slate-500 dark:text-slate-400 capitalize">{file.connectedAccount?.provider === 's3' ? 'S3 Compatible' : 'Google Drive'}</td>
                            <td className="py-3.5 text-xs text-slate-400 dark:text-slate-400 font-bold">{formatDate(file.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Connected Drive Status Card */}
          <Card className="p-6 border border-slate-100 dark:border-slate-800/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 font-bold">Connected Storage Drives</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Physical account quota sync status and usage details.</p>

            <div className="mt-4 space-y-4">
              {summary?.accounts && summary.accounts.length > 0 ? (
                summary.accounts.map((account) => {
                  const limit = account.totalBytes ? Number(account.totalBytes) : 0
                  const used = Number(account.usedBytes)
                  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
                  return (
                    <div
                      key={account.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/40 p-4 transition-all hover:bg-slate-50/60 dark:hover:bg-slate-800/70"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 dark:text-blue-400 shadow-sm dark:bg-slate-950 dark:text-blue-300">
                            {account.provider === 's3' ? <Database className="h-5 w-5" /> : <GoogleDriveIcon className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-slate-50 text-sm">{account.email}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-400 font-bold capitalize">
                              {account.provider === 's3' ? 'S3 Storage' : 'Google Drive'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg px-2.5 text-xs"
                            onClick={() => syncAccount(account.id)}
                            disabled={syncingId === account.id}
                          >
                            <RefreshCw className={cn('h-3.5 w-3.5 mr-1', syncingId === account.id && 'animate-spin')} />
                            {syncingId === account.id ? 'Syncing...' : 'Sync'}
                          </Button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                          <span>{formatBytes(account.usedBytes)} Used</span>
                          <span>{account.totalBytes ? formatBytes(account.totalBytes) : 'Unlimited'}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-slate-400 dark:text-slate-400 italic">No storage drives connected yet.</p>
                  <Button size="sm" className="mt-4" onClick={connectDrive} disabled={connecting}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Connect Your First Drive
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (1/3 width on desktop) */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card className="p-6 border border-slate-100 dark:border-slate-800/80 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Quick Actions</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Control center for file and drive storage management.</p>

            <div className="mt-5 grid gap-3">
              <Button
                className="w-full justify-start text-left"
                onClick={() => navigate('/all-files?upload=true')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New File
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left border-slate-200"
                onClick={() => navigate('/all-files?newFolder=true')}
              >
                <FolderPlus className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                Create Virtual Folder
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left border-slate-200"
                onClick={connectDrive}
                disabled={connecting}
              >
                <Link2 className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                {connecting ? 'Connecting...' : 'Add Google Drive'}
              </Button>

              <Button
                variant="soft"
                className="w-full justify-start text-left bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 text-slate-900 dark:text-slate-50 border-0"
                onClick={() => navigate('/security')}
              >
                <Shield className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                View Security Nest
              </Button>
            </div>
          </Card>

          {/* Account Limit Card (X/4 Drives Connected) */}
          <Card className="p-6 border border-slate-100 dark:border-slate-800/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Drive Slots</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Connect up to 4 Google Drive accounts.</p>

            {/* Visual slots */}
            <div className="mt-5 grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((slotIdx) => {
                const isConnected = slotIdx < googleCount
                const account = googleAccounts[slotIdx]
                return (
                  <div
                    key={slotIdx}
                    className={cn(
                      'min-w-0 aspect-square rounded-2xl flex flex-col items-center justify-center p-2.5 transition-all',
                      isConnected
                        ? 'bg-blue-50/50 border-2 border-blue-500/80 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'bg-slate-50/50 dark:bg-slate-800/50 border border-dashed border-slate-200 text-slate-400 dark:text-slate-400'
                    )}
                    title={account ? account.email : 'Empty Drive Slot'}
                  >
                    <GoogleDriveIcon className={cn('h-6 w-6', !isConnected && 'opacity-35 grayscale')} />
                    <span className="text-[10px] font-extrabold mt-1.5 uppercase tracking-wide text-center">
                      {isConnected ? `Slot ${slotIdx + 1}` : 'Empty'}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400 text-center">
              {googleCount} of 4 slots connected
            </p>
          </Card>

          {/* Security Checklist Card */}
          <Card className="p-6 border border-slate-100 dark:border-slate-800/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Security Status</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Security nest validations check status.</p>

            <div className="mt-5 space-y-3.5 text-sm">
              <div className="flex gap-2.5">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-slate-50 text-xs">AES-256 Google Token Encryption</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">All refresh keys are strongly hashed and encrypted.</p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-slate-50 text-xs">Audit Logs Logging Status</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gateway uploads and deletes recorded to db.</p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-slate-50 text-xs">Credential-free Session Token</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">JWT access key uses standard bearer auth.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
