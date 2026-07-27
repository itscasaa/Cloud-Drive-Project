import { useEffect, useState } from 'react'
import { CheckCircle, Database, Link2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GoogleDriveIcon } from '@/components/drive/GoogleDriveIcon'
import { PageHeader } from '@/components/drive/PageHeader'
import { apiFetch, formatBytes } from '@/lib/api'
import { cn } from '@/lib/utils'

type StorageSummary = { totalBytes: string; usedBytes: string; availableBytes: string }
type ConnectedAccount = { id: string; email: string; displayName?: string | null; provider: string; status: string; storageAccount?: { totalBytes: string | null; usedBytes: string; availableBytes: string | null; lastSyncedAt: string | null } | null }
type RoutingMode = 'most_available' | 'round_robin' | 'priority'
type RoutingPolicy = { mode: RoutingMode; priorityAccountIds: string[]; roundRobinCursor: number }

function providerLabel(provider: string) {
  if (provider === 's3') return 'S3 Storage'
  return 'Google Drive'
}

function ProviderIcon({ provider, className }: { provider: string; className?: string }) {
  if (provider === 's3') return <Database className={cn('h-6 w-6', className)} />
  return <GoogleDriveIcon className={cn('h-6 w-6', className)} />
}

function storageLimitLabel(account: ConnectedAccount) {
  if (account.provider === 's3' && account.storageAccount?.totalBytes === null) return 'Unlimited'
  return formatBytes(account.storageAccount?.totalBytes)
}

function availableLabel(account: ConnectedAccount) {
  if (account.provider === 's3' && account.storageAccount?.availableBytes === null) return 'Unlimited'
  return formatBytes(account.storageAccount?.availableBytes)
}

function pct(account: ConnectedAccount) {
  const total = Number(account.storageAccount?.totalBytes ?? 0)
  const used = Number(account.storageAccount?.usedBytes ?? 0)
  return total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
}

function statusColor(percent: number) {
  if (percent >= 80) return 'bg-red-500 text-red-600'
  if (percent >= 50) return 'bg-yellow-400 text-yellow-600'
  return 'bg-emerald-500 text-emerald-600'
}

export function QuotaTrackerPage() {
  const [summary, setSummary] = useState<StorageSummary | null>(null)
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [routingPolicy, setRoutingPolicy] = useState<RoutingPolicy>({ mode: 'most_available', priorityAccountIds: [], roundRobinCursor: 0 })
  const [message, setMessage] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)

  async function load() {
    const [summaryData, accountData, policyData] = await Promise.all([
      apiFetch<StorageSummary>('/storage/summary'),
      apiFetch<{ accounts: ConnectedAccount[] }>('/connected-accounts'),
      apiFetch<{ policy: RoutingPolicy }>('/storage/routing-policy'),
    ])
    setSummary(summaryData)
    setAccounts(accountData.accounts)
    setRoutingPolicy(policyData.policy)
  }

  async function refresh() {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load quota tracker'))
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = window.setInterval(() => load().catch(() => undefined), 35_000)
    return () => window.clearInterval(timer)
  }, [autoRefresh])

  useEffect(() => {
    function handleStatus(status: string) {
      if (status === 'success') {
        setMessage('Google Drive connected.')
      } else if (status === 'already_linked') {
        setMessage('This Google Drive account is already linked to another CasaNest account.')
      } else if (status === 'limit_reached') {
        setMessage('You can connect up to 4 Google Drive accounts only.')
      } else if (status === 'duplicate') {
        setMessage('This Google Drive account is already connected.')
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
    setMessage('')
    try {
      const data = await apiFetch<{ url: string }>('/connected-accounts/google/connect-url')
      const popup = window.open(data.url, 'google-drive-connect', 'width=540,height=720')
      if (!popup) window.location.href = data.url
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to start Google Drive connection')
    }
  }

  async function sync(accountId: string) {
    setSyncingAccountId(accountId)
    try {
      await apiFetch(`/connected-accounts/${accountId}/sync-quota`, { method: 'POST' })
      await load()
    } finally {
      setSyncingAccountId(null)
    }
  }

  async function saveRoutingPolicy(nextPolicy: RoutingPolicy) {
    setRoutingPolicy(nextPolicy)
    const data = await apiFetch<{ policy: RoutingPolicy }>('/storage/routing-policy', { method: 'PATCH', body: JSON.stringify({ mode: nextPolicy.mode, priorityAccountIds: nextPolicy.priorityAccountIds }) })
    setRoutingPolicy(data.policy)
    setMessage('Upload routing policy updated.')
  }

  function orderedAccounts() {
    const byId = new Map(accounts.map((account) => [account.id, account]))
    const ordered = routingPolicy.priorityAccountIds.map((id) => byId.get(id)).filter((account): account is ConnectedAccount => Boolean(account))
    const orderedIds = new Set(ordered.map((account) => account.id))
    return [...ordered, ...accounts.filter((account) => !orderedIds.has(account.id))]
  }

  function moveAccount(accountId: string, direction: -1 | 1) {
    const ids = orderedAccounts().map((account) => account.id)
    const index = ids.indexOf(accountId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ids.length) return
    const nextIds = [...ids]
    const [item] = nextIds.splice(index, 1)
    nextIds.splice(target, 0, item)
    saveRoutingPolicy({ ...routingPolicy, priorityAccountIds: nextIds }).catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to update routing policy'))
  }

  return (
    <>
      <PageHeader
        title="Connected Drives"
        description="Track and manage connected provider storage limits and routing."
        actions={
          <>
            <Button variant="outline" className="border-slate-200 bg-white" onClick={() => setAutoRefresh(!autoRefresh)}>
              <CheckCircle className={cn('h-4 w-4 mr-1', autoRefresh && 'text-blue-600')} />
              Auto-refresh {autoRefresh ? 'On' : 'Off'}
            </Button>
            <Button variant="outline" className="border-slate-200 bg-white" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={cn('h-4 w-4 mr-1', refreshing && 'animate-spin')} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={connectDrive}>
              <Link2 className="h-4 w-4 mr-1" />
              Connect Drive
            </Button>
          </>
        }
      />
      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm font-semibold text-blue-800 animate-fadeIn">
          {message}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 border border-slate-100/80 shadow-sm hover:shadow-md transition">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Storage</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatBytes(summary?.totalBytes)}</p>
        </Card>
        <Card className="p-5 border border-slate-100/80 shadow-sm hover:shadow-md transition">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Used Storage</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatBytes(summary?.usedBytes)}</p>
        </Card>
        <Card className="p-5 border border-slate-100/80 shadow-sm hover:shadow-md transition">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Space</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatBytes(summary?.availableBytes)}</p>
        </Card>
        <Card className="p-5 border border-slate-100/80 shadow-sm hover:shadow-md transition">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Drives</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{accounts.length}</p>
        </Card>
      </div>

      <Card className="mt-6 p-6 border border-slate-100/80 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upload Routing Policy</h2>
            <p className="mt-0.5 text-sm text-slate-500">Choose how new uploads distribute across connected storage drives.</p>
          </div>
          <label className="grid gap-2 text-sm font-semibold lg:w-64">
            Routing mode
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              value={routingPolicy.mode}
              onChange={(event) =>
                saveRoutingPolicy({ ...routingPolicy, mode: event.target.value as RoutingMode }).catch((error) =>
                  setMessage(error instanceof Error ? error.message : 'Failed to update routing policy')
                )
              }
            >
              <option value="most_available">Most available</option>
              <option value="round_robin">Round robin</option>
              <option value="priority">Priority order</option>
            </select>
          </label>
        </div>
        <div className="mt-5 grid gap-3">
          {orderedAccounts().map((account, index) => (
            <div
              key={account.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/30 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/60 transition"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm border border-slate-100">
                  <ProviderIcon provider={account.provider} />
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">{account.displayName || account.email}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {providerLabel(account.provider)} · {formatBytes(account.storageAccount?.usedBytes)} used ·{' '}
                    {availableLabel(account)} free
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-slate-200 h-8 text-xs font-bold"
                  onClick={() => moveAccount(account.id, -1)}
                  disabled={index === 0}
                >
                  Up
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-slate-200 h-8 text-xs font-bold"
                  onClick={() => moveAccount(account.id, 1)}
                  disabled={index === accounts.length - 1}
                >
                  Down
                </Button>
              </div>
            </div>
          ))}
          {accounts.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-2">Connect storage accounts to configure upload routing.</p>
          ) : null}
        </div>
      </Card>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
              {accounts.length === 0 ? (
                <Card className="col-span-full p-8 text-center border border-slate-100/80 shadow-sm">
                  <GoogleDriveIcon className="mx-auto h-10 w-10" />
                  <h2 className="mt-4 text-xl font-extrabold text-slate-900">No connected drives</h2>
                  <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                    Connect Google Drive or S3-compatible storage to start pooling your storage nest.
                  </p>
                  <Button className="mt-5" onClick={connectDrive}>
                    <Link2 className="h-4 w-4 mr-1.5" />
                    Connect Drive
                  </Button>
                </Card>
              ) : (
                accounts.map((account) => {
                  const percent = pct(account)
                  const color = statusColor(percent)
                  return (
                    <Card key={account.id} className="overflow-hidden p-5 border border-slate-100/80 shadow-sm hover:shadow-md transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-md border border-slate-100">
                            <ProviderIcon provider={account.provider} />
                          </div>
                          <div>
                            <h2 className="font-extrabold text-slate-900">{providerLabel(account.provider)}</h2>
                            <p className="text-xs text-slate-500 font-semibold">{account.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 bg-white border-slate-200"
                            onClick={() => sync(account.id)}
                            disabled={syncingAccountId === account.id}
                          >
                      <RefreshCw className={cn('h-4.5 w-4.5', syncingAccountId === account.id && 'animate-spin')} />
                    </Button>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className={cn('h-2.5 w-2.5 rounded-full', color.split(' ')[0])} />
                      Drive Capacity
                    </span>
                    <span>{percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className={cn('h-full rounded-full', color.split(' ')[0])} style={{ width: `${percent}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>
                      {formatBytes(account.storageAccount?.usedBytes)} / {storageLimitLabel(account)} Used
                    </span>
                    <span>Available: {availableLabel(account)}</span>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </>
  )
}
