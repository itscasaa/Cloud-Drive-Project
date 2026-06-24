import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Cloud, Database, Globe, HardDrive, Link2, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DummyModal } from '@/components/drive/DummyModal'
import { PageHeader } from '@/components/drive/PageHeader'
import { apiFetch, formatBytes } from '@/lib/api'
import { getGravatarUrl } from '@/lib/gravatar'
import { getStoredUser } from '@/lib/auth'
import { cn } from '@/lib/utils'

type ConnectedAccount = { id: string; provider: string; email: string; displayName?: string | null; status: string; reconnectRequired?: boolean; storageAccount?: { totalBytes: string | null; usedBytes: string; availableBytes: string | null; lastSyncedAt: string | null } | null }

type DisconnectRecoveryInfo = {
  disconnectedAccountEmail: string
  movedFilesCount: number
  allDriveAccountsDisconnected: boolean
  recoveryExpiresAt: string
}

function providerLabel(provider: string) {
  if (provider === 's3') return 'S3 Storage'
  return 'Google Drive'
}

function storageLimitLabel(account: ConnectedAccount) {
  if (account.provider === 's3' && account.storageAccount?.totalBytes === null) return 'Unlimited'
  return formatBytes(account.storageAccount?.totalBytes)
}

function availableLabel(account: ConnectedAccount) {
  if (account.provider === 's3' && account.storageAccount?.availableBytes === null) return 'Unlimited'
  return formatBytes(account.storageAccount?.availableBytes)
}

export function SettingsPage() {
  const user = getStoredUser()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [message, setMessage] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [s3Open, setS3Open] = useState(false)
  const [connectingS3, setConnectingS3] = useState(false)
  const [s3Form, setS3Form] = useState({ name: '', bucket: '', region: 'us-east-1', endpoint: '', accessKeyId: '', secretAccessKey: '', forcePathStyle: false, quotaBytes: '' })
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)
  const [disconnectingAccountId, setDisconnectingAccountId] = useState<string | null>(null)
  const [accountToDisconnect, setAccountToDisconnect] = useState<ConnectedAccount | null>(null)
  const [recoveryModalInfo, setRecoveryModalInfo] = useState<DisconnectRecoveryInfo | null>(null)
  const [profileImageUrl, setProfileImageUrl] = useState('')

  const googleAccounts = accounts.filter(a => a.provider === 'google_drive' && a.status === 'connected')
  const googleCount = googleAccounts.length
  const maxReached = googleCount >= 4



  async function load() {
    const data = await apiFetch<{ accounts: ConnectedAccount[] }>('/connected-accounts')
    setAccounts(data.accounts)
  }

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load settings'))
  }, [])

  useEffect(() => {
    getGravatarUrl(user?.email, 96).then(setProfileImageUrl).catch(() => setProfileImageUrl(''))
  }, [user?.email])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== 'GOOGLE_CONNECTED') return
      
      const status = event.data.status
      if (status === 'success') {
        setMessage('Google Drive connected.')
        window.dispatchEvent(new Event('casanest:storage-changed'))
      } else if (status === 'limit_reached') {
        setMessage('You can connect up to 4 Google Drive accounts only.')
      } else if (status === 'duplicate') {
        setMessage('This Google Drive account is already connected.')
      } else if (status === 'already_linked') {
        setMessage('This Google Drive account is already linked to another CasaNest account.')
      } else {
        setMessage('Google Drive connection failed.')
      }
      
      load().catch(() => undefined)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  async function connectDrive() {
    setConnecting(true)
    setMessage('')
    try {
      const data = await apiFetch<{ url: string }>('/connected-accounts/google/connect-url')
      const popup = window.open(data.url, 'google-drive-connect', 'width=540,height=720')
      if (!popup) window.location.href = data.url
    } catch (error) {
      const isConfigError = error instanceof Error && (error.message.includes('configured') || error.message.includes('configuration'))
      const fallbackMsg = isConfigError 
        ? 'Google Drive connection is currently unavailable. You can still try Demo Mode.'
        : (error instanceof Error ? error.message : 'Failed to start Google Drive connection')
      setMessage(fallbackMsg)
    } finally {
      setConnecting(false)
    }
  }

  async function sync(accountId: string) {
    setSyncingAccountId(accountId)
    try {
      await apiFetch(`/connected-accounts/${accountId}/sync-quota`, { method: 'POST' })
      await load()
      window.dispatchEvent(new Event('casanest:storage-changed'))
    } finally {
      setSyncingAccountId(null)
    }
  }

  async function disconnect() {
    if (!accountToDisconnect) return
    setDisconnectingAccountId(accountToDisconnect.id)
    setMessage('')
    try {
      const response = await apiFetch<DisconnectRecoveryInfo>(`/connected-accounts/${accountToDisconnect.id}`, { method: 'DELETE' })
      setAccountToDisconnect(null)
      setRecoveryModalInfo(response)
      await load()
      window.dispatchEvent(new Event('casanest:storage-changed'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to disconnect Google Drive account')
    } finally {
      setDisconnectingAccountId(null)
    }
  }

  async function connectS3(event: FormEvent) {
    event.preventDefault()
    setConnectingS3(true)
    setMessage('')
    try {
      await apiFetch('/connected-accounts/s3', { method: 'POST', body: JSON.stringify({ ...s3Form, endpoint: s3Form.endpoint || undefined, quotaBytes: s3Form.quotaBytes || null }) })
      setS3Open(false)
      setS3Form({ name: '', bucket: '', region: 'us-east-1', endpoint: '', accessKeyId: '', secretAccessKey: '', forcePathStyle: false, quotaBytes: '' })
      setMessage('S3 storage connected.')
      await load()
      window.dispatchEvent(new Event('casanest:storage-changed'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to connect S3 storage')
    } finally {
      setConnectingS3(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage account and connected storage nests."
        actions={
          <>
            {false && (
              <Button variant="outline" className="border-slate-200 bg-white" onClick={() => setS3Open(true)}>
                <Database className="h-4 w-4 mr-1 text-slate-500" />
                Connect S3
              </Button>
            )}
            <Button onClick={connectDrive} disabled={connecting || maxReached} title={maxReached ? "Maximum 4 Google Drive accounts per user." : undefined}>
              <Link2 className="h-4 w-4 mr-1" />
              {connecting ? 'Connecting...' : 'Connect Drive'}
            </Button>
          </>
        }
      />
      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm font-semibold text-blue-800 animate-fadeIn">
          {message}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6 min-w-0">
          {/* User profile card */}
          <Card className="p-6 border border-slate-100/80 shadow-sm">
            <div className="flex items-center gap-4 sm:gap-5">
              <img src={profileImageUrl} alt="User avatar" className="h-16 w-16 rounded-2xl object-cover sm:h-20 sm:w-20 shadow-sm" />
              <div className="flex-1">
                <h2 className="text-xl font-extrabold text-slate-900">{user?.name ?? 'User'}</h2>
                <p className="text-sm text-slate-500 font-semibold mt-0.5">{user?.email ?? '-'}</p>
              </div>
            </div>
          </Card>

          {/* Google Drive Integration card */}
          <Card className="overflow-hidden p-6 border border-slate-100/80 shadow-sm bg-gradient-to-br from-white to-slate-50/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Cloud className="h-6 w-6 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">Google Drive Integration</h2>
                </div>
                <p className="mt-2.5 text-sm text-slate-500 leading-relaxed">
                  CasaNest only manages files and folders you upload through this app. Your existing Google Drive files are not scanned or modified.
                </p>
                <p className="mt-2 text-xs text-slate-400 font-semibold">
                  Your files remain in your personal Google Drive storage. CasaNest stores encrypted access credentials and metadata records only.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">
                    Connected Drive Slots: {googleCount} / 4
                  </span>
                  {maxReached && (
                    <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl">
                      Limit reached
                    </span>
                  )}
                </div>
              </div>
              <Button className="w-full sm:w-36 shrink-0" onClick={connectDrive} disabled={connecting || maxReached}>
                <Link2 className="h-4 w-4 mr-1.5" />
                {connecting ? 'Opening...' : 'Connect Drive'}
              </Button>
            </div>
          </Card>

          {/* S3 Storage Card */}
          {false && (
            <Card className="overflow-hidden p-6 border border-slate-100/80 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-900">S3 Compatible Nest</h2>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Connect AWS S3, Cloudflare R2, MinIO, Wasabi, Backblaze B2, or any other S3 compatible custom storage endpoint.
                  </p>
                </div>
                <Button variant="outline" className="w-full sm:w-36 shrink-0 border-slate-200 bg-white" onClick={() => setS3Open(true)}>
                  <Database className="h-4 w-4 mr-1.5 text-slate-500" />
                  Connect S3
                </Button>
              </div>
            </Card>
          )}

          {/* Connected list */}
          <Card className="p-6 border border-slate-100/80 shadow-sm">
            <h2 className="font-bold text-slate-900 text-lg mb-4">Connected Storage Accounts</h2>
            {accounts.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No connected storage accounts found.</p>
            ) : (
              <div className="grid gap-4">
                {accounts.map((account) => (
                  <div key={account.id} className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100 transition hover:bg-slate-50">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-all font-extrabold text-slate-900 text-sm">{account.displayName || account.email}</p>
                          {account.reconnectRequired && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700 border border-red-100">
                              ⚠️ Reconnect Required
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wide">
                          {providerLabel(account.provider)} · {account.status}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:flex">
                        {account.reconnectRequired ? (
                          <Button
                            className="w-full text-xs font-bold bg-white border-slate-200 text-slate-800"
                            variant="outline"
                            onClick={connectDrive}
                            disabled={connecting}
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            Reconnect
                          </Button>
                        ) : (
                          <Button
                            className="w-full text-xs font-bold bg-white border-slate-200 text-slate-800"
                            variant="outline"
                            onClick={() => sync(account.id)}
                            disabled={syncingAccountId === account.id}
                          >
                            <RefreshCw className={cn('h-3.5 w-3.5 mr-1', syncingAccountId === account.id && 'animate-spin')} />
                            Sync
                          </Button>
                        )}
                        <Button
                          className="w-full text-xs font-bold"
                          variant="danger"
                          onClick={() => setAccountToDisconnect(account)}
                          disabled={disconnectingAccountId === account.id}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl bg-white p-3 border border-slate-100">
                        <p className="font-extrabold text-slate-900 text-sm leading-none">{formatBytes(account.storageAccount?.usedBytes)}</p>
                        <p className="mt-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">Used</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 border border-slate-100">
                        <p className="font-extrabold text-slate-900 text-sm leading-none">{storageLimitLabel(account)}</p>
                        <p className="mt-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 border border-slate-100">
                        <p className="font-extrabold text-slate-900 text-sm leading-none">{availableLabel(account)}</p>
                        <p className="mt-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">Free</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 xl:gap-6 h-fit">
          <Card className="p-5 border border-slate-100/80 shadow-sm">
            <HardDrive className="h-6 w-6 text-blue-600" />
            <h2 className="mt-3.5 font-extrabold text-slate-900 text-sm">Storage Pool</h2>
            <p className="mt-1 text-xs text-slate-500 font-semibold">Active Drive Count: {accounts.length}</p>
          </Card>
          <Card className="p-5 border border-slate-100/80 shadow-sm">
            <Bell className="h-6 w-6 text-blue-600" />
            <h2 className="mt-3.5 font-extrabold text-slate-900 text-sm">System Alerts</h2>
            <p className="mt-1 text-xs text-slate-500 font-semibold">Email & app notifications enabled</p>
          </Card>
          <Card className="p-5 border border-slate-100/80 shadow-sm">
            <Globe className="h-6 w-6 text-blue-600" />
            <h2 className="mt-3.5 font-extrabold text-slate-900 text-sm">Cloud Gateway</h2>
            <p className="mt-1 text-xs text-slate-500 font-semibold">Local Node Gateway Active</p>
          </Card>
        </div>
      </div>

      {/* S3 modal */}
      <DummyModal open={s3Open} title="Connect S3 Storage" description="Provide credentials for custom S3 compatible buckets." onClose={() => setS3Open(false)}>
        <div className="text-center py-4">
          <Database className="mx-auto h-10 w-10 text-blue-600 animate-pulse" />
          <h3 className="mt-4 text-lg font-bold text-slate-900">S3 storage support is coming soon.</h3>
          <p className="mt-2 text-sm text-slate-500 font-medium">AWS S3, Cloudflare R2, and other S3-compatible connections will join the nest in a future release.</p>
          <div className="mt-6">
            <Button onClick={() => setS3Open(false)} className="w-full">Close</Button>
          </div>
        </div>

        {/* Keeping original form structure to prevent TS compile warnings for unused state/handlers */}
        {false && (
          <form className="grid gap-4 mt-2" onSubmit={connectS3}>
            <Input placeholder="Display Name" value={s3Form.name} onChange={(event) => setS3Form({ ...s3Form, name: event.target.value })} required />
            <Input placeholder="Bucket Name" value={s3Form.bucket} onChange={(event) => setS3Form({ ...s3Form, bucket: event.target.value })} required />
            <Input placeholder="Region" value={s3Form.region} onChange={(event) => setS3Form({ ...s3Form, region: event.target.value })} required />
            <Input placeholder="Endpoint URL (e.g. for MinIO, Cloudflare R2)" value={s3Form.endpoint} onChange={(event) => setS3Form({ ...s3Form, endpoint: event.target.value })} />
            <Input placeholder="Access Key ID" value={s3Form.accessKeyId} onChange={(event) => setS3Form({ ...s3Form, accessKeyId: event.target.value })} required />
            <Input placeholder="Secret Access Key" type="password" value={s3Form.secretAccessKey} onChange={(event) => setS3Form({ ...s3Form, secretAccessKey: event.target.value })} required />
            <Input placeholder="Quota in Bytes (optional)" inputMode="numeric" value={s3Form.quotaBytes} onChange={(event) => setS3Form({ ...s3Form, quotaBytes: event.target.value })} />
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 select-none">
              <input type="checkbox" checked={s3Form.forcePathStyle} onChange={(event) => setS3Form({ ...s3Form, forcePathStyle: event.target.checked })} />
              Force path style (required for local buckets)
            </label>
            <div className="grid gap-3 sm:flex sm:justify-end mt-2">
              <Button variant="outline" className="border-slate-200" type="button" onClick={() => setS3Open(false)} disabled={connectingS3}>
                Cancel
              </Button>
              <Button type="submit" disabled={connectingS3}>
                {connectingS3 ? 'Connecting...' : 'Connect S3'}
              </Button>
            </div>
          </form>
        )}
      </DummyModal>

      {/* Disconnect Google Modal */}
      <DummyModal open={Boolean(accountToDisconnect)} title="Disconnect storage?" description="This will remove this drive storage from CasaNest. Virtual folder index files mapping to this account will remain, but files will not stream." onClose={() => setAccountToDisconnect(null)}>
        <div className="grid gap-4 mt-2">
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs">
            <p className="font-extrabold text-slate-900 text-sm">{accountToDisconnect?.email}</p>
            <p className="mt-1 text-slate-500 font-semibold">Total Pool Usage: {formatBytes(accountToDisconnect?.storageAccount?.usedBytes)}</p>
          </div>
          <div className="grid gap-3 sm:flex sm:justify-end">
            <Button variant="outline" className="border-slate-200" onClick={() => setAccountToDisconnect(null)} disabled={Boolean(disconnectingAccountId)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={disconnect} disabled={Boolean(disconnectingAccountId)}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              {disconnectingAccountId ? 'Disconnecting...' : 'Disconnect Account'}
            </Button>
          </div>
        </div>
      </DummyModal>

      {/* Disconnect Recovery Info Modal */}
      <DummyModal
        open={Boolean(recoveryModalInfo)}
        title={recoveryModalInfo?.allDriveAccountsDisconnected ? "All drives disconnected" : "Drive disconnected"}
        description={
          recoveryModalInfo?.allDriveAccountsDisconnected
            ? "Your files are now in Recovery & Backup for 3 days."
            : "Your CasaNest file records from this drive were moved to 3-Day Backup."
        }
        onClose={() => setRecoveryModalInfo(null)}
      >
        <div className="grid gap-4 mt-2">
          {recoveryModalInfo?.allDriveAccountsDisconnected && (
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Reconnect the same Google account to restore them.
            </p>
          )}

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs space-y-2.5">
            <p className="font-bold text-slate-700">Account: <span className="font-extrabold text-slate-900">{recoveryModalInfo?.disconnectedAccountEmail}</span></p>
            <p className="font-bold text-slate-700">Moved Files: <span className="font-extrabold text-slate-900">{recoveryModalInfo?.movedFilesCount}</span></p>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              To restore your files in CasaNest, reconnect the same Google Drive account you disconnected.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Your original files remain safe in Google Drive. CasaNest only keeps metadata for 3 days.
            </p>
          </div>

          <div className="grid gap-3 sm:flex sm:justify-end">
            <Button
              variant="outline"
              className="border-slate-200 w-full sm:w-auto"
              onClick={() => {
                setRecoveryModalInfo(null)
                navigate('/recovery')
              }}
            >
              Go to Recovery & Backup
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setRecoveryModalInfo(null)
                connectDrive()
              }}
            >
              Reconnect Google Drive
            </Button>
            <Button
              variant="outline"
              className="border-slate-200 w-full sm:w-auto"
              onClick={() => setRecoveryModalInfo(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </DummyModal>
    </>
  )
}
