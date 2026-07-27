import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Database, Globe, HardDrive, Link2, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DummyModal } from '@/components/drive/DummyModal'
import { GoogleDriveIcon } from '@/components/drive/GoogleDriveIcon'
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
    function handleStatus(status: string) {
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
    <div className="mx-auto w-full max-w-7xl pb-8">
      <PageHeader
        title="Settings"
        description="Manage account and connected storage nests."
        actions={
          <>
            {false && (
              <Button variant="outline" className="w-full border-slate-200 bg-white sm:w-auto" onClick={() => setS3Open(true)}>
                <Database className="mr-1 h-4 w-4 text-slate-500" />
                Connect S3
              </Button>
            )}
            <Button
              className="w-full sm:w-auto"
              onClick={connectDrive}
              disabled={connecting || maxReached}
              title={maxReached ? 'Maximum 4 Google Drive accounts per user.' : undefined}
            >
              <Link2 className="mr-1 h-4 w-4" />
              <span className="truncate">{connecting ? 'Connecting...' : 'Connect Drive'}</span>
            </Button>
          </>
        }
      />
      {message ? (
        <p className="mt-4 animate-fadeIn break-words rounded-2xl border border-blue-100 bg-blue-50 p-3.5 text-sm font-semibold text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300 sm:mt-5 sm:p-4">
          {message}
        </p>
      ) : null}

      {/*
        Layout:
        - mobile: 1 col
        - tablet (md/lg): main + summary row
        - desktop (xl): main | sticky side rail
      */}
      <div className="mt-5 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 gap-4 sm:gap-6">
          {/* User profile card */}
          <Card className="border border-slate-100/80 p-4 shadow-sm dark:border-slate-800 sm:p-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
              <img
                src={profileImageUrl}
                alt="User avatar"
                className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-sm sm:h-20 sm:w-20"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-extrabold text-slate-900 dark:text-slate-50 sm:text-xl">
                  {user?.name ?? 'User'}
                </h2>
                <p className="mt-0.5 break-all text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                  {user?.email ?? '-'}
                </p>
              </div>
            </div>
          </Card>

          {/* Google Drive Integration card */}
          <Card className="overflow-hidden border border-slate-100/80 bg-gradient-to-br from-white to-slate-50/30 p-4 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950/80 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2.5 sm:items-center sm:gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 sm:h-11 sm:w-11">
                    <GoogleDriveIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold leading-snug text-slate-900 dark:text-slate-50 sm:text-lg">
                      Google Drive Integration
                    </h2>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:hidden">
                      Up to 4 accounts
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  CasaNest only manages files and folders you upload through this app. Your existing Google Drive files are not scanned or modified.
                </p>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-400 dark:text-slate-500">
                  Your files remain in your personal Google Drive storage. CasaNest stores encrypted access credentials and metadata records only.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-xl border border-slate-200/50 bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:px-3 sm:text-xs">
                    Connected Drive Slots: {googleCount} / 4
                  </span>
                  {maxReached ? (
                    <span className="rounded-xl border border-red-100 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 sm:px-3 sm:text-xs">
                      Limit reached
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="w-full shrink-0 md:w-40 lg:w-44">
                <Button className="w-full" onClick={connectDrive} disabled={connecting || maxReached}>
                  <Link2 className="mr-1.5 h-4 w-4 shrink-0" />
                  <span className="truncate">{connecting ? 'Opening...' : 'Connect Drive'}</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* S3 Storage Card */}
          {false && (
            <Card className="overflow-hidden border border-slate-100/80 p-4 shadow-sm dark:border-slate-800 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 shrink-0 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">S3 Compatible Nest</h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    Connect AWS S3, Cloudflare R2, MinIO, Wasabi, Backblaze B2, or any other S3 compatible custom storage endpoint.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full shrink-0 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 md:w-40"
                  onClick={() => setS3Open(true)}
                >
                  <Database className="mr-1.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                  Connect S3
                </Button>
              </div>
            </Card>
          )}

          {/* Connected list */}
          <Card className="border border-slate-100/80 p-4 shadow-sm dark:border-slate-800 sm:p-6">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 sm:text-lg">Connected Storage Accounts</h2>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{accounts.length} account{accounts.length === 1 ? '' : 's'}</p>
            </div>
            {accounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
                <GoogleDriveIcon className="mx-auto h-8 w-8 opacity-45 grayscale" />
                <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">No connected storage accounts found.</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Connect a Google Drive account to start pooling storage.</p>
                <Button className="mt-4 w-full sm:w-auto" onClick={connectDrive} disabled={connecting || maxReached}>
                  <Link2 className="mr-1.5 h-4 w-4" />
                  Connect Drive
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 sm:p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 break-all text-sm font-extrabold text-slate-900 dark:text-slate-50">
                            {account.displayName || account.email}
                          </p>
                          {account.reconnectRequired ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                              ⚠️ Reconnect Required
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:text-xs">
                          {providerLabel(account.provider)} · {account.status}
                        </p>
                      </div>
                      <div className="grid w-full grid-cols-2 gap-2 sm:max-w-xs sm:self-end lg:w-auto lg:max-w-none lg:shrink-0 lg:self-start">
                        {account.reconnectRequired ? (
                          <Button
                            className="w-full border-slate-200 bg-white text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            variant="outline"
                            size="sm"
                            onClick={connectDrive}
                            disabled={connecting}
                          >
                            <Link2 className="mr-1 h-4 w-4 shrink-0" />
                            <span className="truncate">Reconnect</span>
                          </Button>
                        ) : (
                          <Button
                            className="w-full border-slate-200 bg-white text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            variant="outline"
                            size="sm"
                            onClick={() => sync(account.id)}
                            disabled={syncingAccountId === account.id}
                          >
                            <RefreshCw className={cn('mr-1 h-3.5 w-3.5 shrink-0', syncingAccountId === account.id && 'animate-spin')} />
                            <span className="truncate">Sync</span>
                          </Button>
                        )}
                        <Button
                          className="w-full text-xs font-bold"
                          variant="danger"
                          size="sm"
                          onClick={() => setAccountToDisconnect(account)}
                          disabled={disconnectingAccountId === account.id}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Disconnect</span>
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3.5 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
                      <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-2.5 text-center dark:border-slate-700 dark:bg-slate-900 sm:p-3">
                        <p className="truncate text-xs font-extrabold leading-none text-slate-900 dark:text-slate-50 sm:text-sm" title={formatBytes(account.storageAccount?.usedBytes)}>
                          {formatBytes(account.storageAccount?.usedBytes)}
                        </p>
                        <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:text-[10px]">Used</p>
                      </div>
                      <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-2.5 text-center dark:border-slate-700 dark:bg-slate-900 sm:p-3">
                        <p className="truncate text-xs font-extrabold leading-none text-slate-900 dark:text-slate-50 sm:text-sm" title={storageLimitLabel(account)}>
                          {storageLimitLabel(account)}
                        </p>
                        <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:text-[10px]">Total</p>
                      </div>
                      <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-2.5 text-center dark:border-slate-700 dark:bg-slate-900 sm:p-3">
                        <p className="truncate text-xs font-extrabold leading-none text-slate-900 dark:text-slate-50 sm:text-sm" title={availableLabel(account)}>
                          {availableLabel(account)}
                        </p>
                        <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:text-[10px]">Free</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Side / summary rail */}
        <div className="grid h-fit gap-3 sm:grid-cols-3 sm:gap-4 lg:sticky lg:top-4 lg:grid-cols-1 lg:gap-4 xl:top-6 xl:gap-5">
          <Card className="border border-slate-100/80 p-4 shadow-sm dark:border-slate-800 sm:p-5">
            <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400 sm:h-6 sm:w-6" />
            <h2 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-slate-50">Storage Pool</h2>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
              Active Drive Count: {accounts.length}
            </p>
          </Card>
          <Card className="border border-slate-100/80 p-4 shadow-sm dark:border-slate-800 sm:p-5">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 sm:h-6 sm:w-6" />
            <h2 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-slate-50">System Alerts</h2>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
              Email & app notifications enabled
            </p>
          </Card>
          <Card className="border border-slate-100/80 p-4 shadow-sm dark:border-slate-800 sm:p-5">
            <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 sm:h-6 sm:w-6" />
            <h2 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-slate-50">Cloud Gateway</h2>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
              Local Node Gateway Active
            </p>
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
        <div className="mt-2 grid gap-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50">{accountToDisconnect?.email}</p>
            <p className="mt-1 font-semibold text-slate-500 dark:text-slate-400">
              Total Pool Usage: {formatBytes(accountToDisconnect?.storageAccount?.usedBytes)}
            </p>
          </div>
          <div className="grid gap-3 sm:flex sm:justify-end">
            <Button variant="outline" className="border-slate-200 dark:border-slate-700" onClick={() => setAccountToDisconnect(null)} disabled={Boolean(disconnectingAccountId)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={disconnect} disabled={Boolean(disconnectingAccountId)}>
              <Trash2 className="mr-1.5 h-4 w-4" />
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
        <div className="mt-2 grid gap-4">
          {recoveryModalInfo?.allDriveAccountsDisconnected && (
            <p className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
              Reconnect the same Google account to restore them.
            </p>
          )}

          <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs dark:border-slate-700 dark:bg-slate-800/60">
            <p className="font-bold text-slate-700 dark:text-slate-300">
              Account: <span className="font-extrabold text-slate-900 dark:text-slate-50">{recoveryModalInfo?.disconnectedAccountEmail}</span>
            </p>
            <p className="font-bold text-slate-700 dark:text-slate-300">
              Moved Files: <span className="font-extrabold text-slate-900 dark:text-slate-50">{recoveryModalInfo?.movedFilesCount}</span>
            </p>
            <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              To restore your files in CasaNest, reconnect the same Google Drive account you disconnected.
            </p>
            <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Your original files remain safe in Google Drive. CasaNest only keeps metadata for 3 days.
            </p>
          </div>

          <div className="grid gap-3 sm:flex sm:justify-end">
            <Button
              variant="outline"
              className="w-full border-slate-200 dark:border-slate-700 sm:w-auto"
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
              className="w-full border-slate-200 dark:border-slate-700 sm:w-auto"
              onClick={() => setRecoveryModalInfo(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </DummyModal>
    </div>
  )
}
