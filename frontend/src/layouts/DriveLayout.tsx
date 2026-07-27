import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bell,
  Cloud,
  Folder,
  History,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/drive/BrandLogo'
import { ThemeToggle } from '@/components/drive/ThemeToggle'
import { UpdateLogsPanel } from '@/components/drive/UpdateLogsPanel'
import { Input } from '@/components/ui/input'
import {
  PRODUCT_UPDATE_LOGS,
  getLatestUpdateLogId,
  getSeenUpdateLogId,
  markUpdateLogsSeen,
  type UpdateLogEntry,
} from '@/data/update-logs'
import { apiFetch, formatBytes } from '@/lib/api'
import { clearAuthSession, getStoredUser, updateStoredUser, type AuthUser } from '@/lib/auth'
import { getGravatarUrl } from '@/lib/gravatar'
import { cn } from '@/lib/utils'

const menu = [
  { label: 'Dashboard', icon: LayoutGrid, href: '/dashboard' },
  { label: 'All Files', icon: Folder, href: '/all-files' },
  { label: 'Connected Drives', icon: Cloud, href: '/quota' },
  { label: 'Recovery & Backup', icon: History, href: '/recovery' },
  { label: 'Security', icon: Shield, href: '/security' },
  { label: 'Settings', icon: Settings, href: '/settings' },
]

type StorageSummary = {
  totalBytes: string
  usedBytes: string
  availableBytes: string
}

type GitHubCommit = {
  sha: string
  html_url: string
  commit: {
    message: string
    author?: {
      name?: string
      date?: string
    }
  }
}

function mapGithubCommits(commits: GitHubCommit[]): UpdateLogEntry[] {
  return commits.map((item) => {
    const title = item.commit.message.split('\n')[0] || 'Repository update'
    const lower = title.toLowerCase()
    let kind: UpdateLogEntry['kind'] = 'improvement'
    if (lower.startsWith('fix') || lower.includes('bug')) kind = 'fix'
    else if (lower.startsWith('feat') || lower.includes('feature')) kind = 'feature'
    else if (lower.includes('security') || lower.includes('cve') || lower.includes('auth')) kind = 'security'
    else if (lower.startsWith('docs') || lower.startsWith('chore')) kind = 'notice'

    return {
      id: `gh-${item.sha}`,
      title,
      summary: item.commit.author?.name ? `Commit by ${item.commit.author.name}` : 'Latest repository activity',
      kind,
      date: item.commit.author?.date ?? new Date().toISOString(),
      version: item.sha.slice(0, 7),
      href: item.html_url,
      source: 'github' as const,
      highlights: undefined,
    }
  })
}

function Sidebar({ onNavigate, storage, onLogout }: { onNavigate?: () => void; storage: StorageSummary | null; onLogout: () => void }) {
  const used = Number(storage?.usedBytes ?? 0)
  const total = Number(storage?.totalBytes ?? 0)
  const progress = total > 0 ? Math.min(100, (used / total) * 100) : 0

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      {/* Brand logo & tagline */}
      <div className="flex flex-col gap-1.5 border-b border-slate-100/85 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="h-10 w-10 shrink-0" logoClassName="h-14 w-14" />
          <span className="text-xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-slate-50">CasaNest</span>
        </div>
        <p className="text-[10px] font-bold leading-normal text-slate-400 dark:text-slate-500">
          Secure storage nest for your connected drives.
        </p>
      </div>

      {/* Main menu */}
      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto">
        {menu.map((item) => (
          <NavLink
            key={item.label}
            to={item.href}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-extrabold tracking-wide transition-all duration-200',
                isActive
                  ? 'rounded-l-none border-l-2 border-blue-600 bg-blue-50/70 pl-3 text-blue-600 shadow-sm dark:bg-blue-950/40 dark:text-blue-400'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100',
              )
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Storage summary progress */}
      <div className="mt-5 border-t border-slate-100/80 pt-4 dark:border-slate-800">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Used</span>
            <span>{formatBytes(storage?.totalBytes)}</span>
          </div>
          <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-slate-50">{formatBytes(storage?.usedBytes)}</p>
          <div className="mt-2.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Logout button at bottom */}
      <div className="mt-4">
        <Button
          variant="outline"
          className="w-full justify-start border-slate-200 text-xs font-bold text-slate-500 hover:bg-red-50/50 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
    </aside>
  )
}

export function DriveLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '')
  const [user, setUser] = useState<AuthUser | null>(getStoredUser())
  const [storage, setStorage] = useState<StorageSummary | null>(null)
  const [updatesOpen, setUpdatesOpen] = useState(false)
  const [githubUpdates, setGithubUpdates] = useState<UpdateLogEntry[]>([])
  const [updatesLoading, setUpdatesLoading] = useState(false)
  const [updatesError, setUpdatesError] = useState('')
  const [updatesLoaded, setUpdatesLoaded] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [seenUpdateId, setSeenUpdateId] = useState(() => getSeenUpdateLogId())

  const productEntries = PRODUCT_UPDATE_LOGS

  const mergedEntries = useMemo(() => {
    // Product notes first (stable product story), then optional live GitHub commits.
    const seen = new Set(productEntries.map((e) => e.id))
    const extras = githubUpdates.filter((entry) => !seen.has(entry.id))
    return [...productEntries, ...extras]
  }, [productEntries, githubUpdates])

  const unseenCount = useMemo(() => {
    // Unseen is based on curated product stream only — GitHub noise shouldn't inflate the badge forever.
    const seen = seenUpdateId
    if (!seen) return Math.min(productEntries.length, 5)
    const idx = productEntries.findIndex((entry) => entry.id === seen)
    if (idx <= 0) return 0
    return idx
  }, [productEntries, seenUpdateId])

  useEffect(() => {
    getGravatarUrl(user?.email, 96).then(setProfileImageUrl).catch(() => setProfileImageUrl(''))
  }, [user?.email])

  async function loadSidebarStats() {
    await apiFetch<StorageSummary>('/storage/summary').then(setStorage)
  }

  useEffect(() => {
    setSearchValue(searchParams.get('q') ?? '')
  }, [searchParams])

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined)
    clearAuthSession()
    navigate('/login')
  }

  function searchFiles(event: FormEvent) {
    event.preventDefault()
    const nextParams = new URLSearchParams(location.pathname === '/all-files' ? searchParams : undefined)
    const query = searchValue.trim()
    if (query) nextParams.set('q', query)
    else nextParams.delete('q')
    navigate({ pathname: '/all-files', search: nextParams.toString() })
  }

  async function loadRepoUpdates() {
    setUpdatesLoading(true)
    setUpdatesError('')
    try {
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), 6000)
      const response = await fetch('https://api.github.com/repos/zenhosta/9drive/commits?per_page=5', {
        headers: { Accept: 'application/vnd.github+json' },
        signal: controller.signal,
      })
      window.clearTimeout(timer)
      if (!response.ok) {
        // Soft-fail: product logs still render; surface a gentle notice only.
        throw new Error(response.status === 403 ? 'GitHub rate limit reached — showing product logs only.' : 'Could not refresh repository commits.')
      }
      const commits = (await response.json()) as GitHubCommit[]
      setGithubUpdates(mapGithubCommits(commits))
      setUpdatesLoaded(true)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setUpdatesError('Repository feed timed out — product logs still available.')
      } else {
        setUpdatesError(error instanceof Error ? error.message : 'Could not refresh repository commits.')
      }
    } finally {
      setUpdatesLoading(false)
      setUpdatesLoaded(true)
    }
  }

  function markAllRead() {
    const latest = getLatestUpdateLogId(productEntries)
    markUpdateLogsSeen(latest)
    setSeenUpdateId(latest)
  }

  function toggleUpdateLogs() {
    setUpdatesOpen((open) => {
      const next = !open
      if (next) {
        // Prefetch GitHub once; product logs render instantly either way.
        if (!updatesLoaded && !updatesLoading) loadRepoUpdates().catch(() => undefined)
        // Opening the panel counts as seen after a short beat so "New" badges are visible first.
        window.setTimeout(() => {
          const latest = getLatestUpdateLogId(productEntries)
          markUpdateLogsSeen(latest)
          setSeenUpdateId(latest)
        }, 1200)
      }
      return next
    })
  }

  useEffect(() => {
    apiFetch<{ user: AuthUser }>('/auth/me')
      .then((data) => {
        setUser(data.user)
        updateStoredUser(data.user)
      })
      .catch(() => undefined)
    loadSidebarStats().catch(() => undefined)
    window.addEventListener('casanest:storage-changed', loadSidebarStats)
    return () => window.removeEventListener('casanest:storage-changed', loadSidebarStats)
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setUpdatesOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard'
      case '/all-files':
        return 'All Files'
      case '/quota':
        return 'Connected Drives'
      case '/shared':
        return 'Shared With Me'
      case '/security':
        return 'Security & Privacy'
      case '/api':
      case '/api-keys':
        return 'API Keys'
      case '/settings':
        return 'Settings'
      default:
        return 'CasaNest'
    }
  }

  const bellBadge = unseenCount > 0

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-brand-bg text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen w-full flex-col bg-brand-bg dark:bg-slate-950 lg:h-screen lg:flex-row lg:overflow-hidden">
        <div className="hidden lg:block lg:h-screen lg:shrink-0">
          <Sidebar storage={storage} onLogout={logout} />
        </div>
        <div className={cn('fixed inset-0 z-40 bg-slate-950/40 transition-opacity lg:hidden dark:bg-black/60', sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={() => setSidebarOpen(false)} />
        <div className={cn('fixed inset-y-0 left-0 z-50 transform bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-950 dark:shadow-black/50 lg:hidden', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
          <div className="absolute right-4 top-4 z-10">
            <Button variant="outline" size="icon" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Sidebar storage={storage} onLogout={logout} onNavigate={() => setSidebarOpen(false)} />
        </div>

        <section className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-8 lg:h-screen lg:overflow-y-auto lg:p-10">
          <header className="flex w-full min-w-0 shrink-0 flex-col gap-4 border-b border-slate-200/60 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            {/* Mobile Header elements */}
            <div className="flex w-full items-center justify-between gap-3 lg:hidden">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="outline" size="icon" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex min-w-0 items-center gap-2">
                  <BrandLogo className="h-9 w-9 shrink-0" logoClassName="h-12 w-12" />
                  <span className="truncate text-xl font-extrabold tracking-tight dark:text-slate-50">CasaNest</span>
                </div>
              </div>
              <div className="relative flex shrink-0 items-center gap-2">
                <ThemeToggle className="h-9 w-9" />
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-9 w-9"
                  aria-label="Update logs"
                  aria-expanded={updatesOpen}
                  onClick={toggleUpdateLogs}
                >
                  <Bell className="h-4.5 w-4.5" />
                  {bellBadge ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-extrabold leading-none text-white shadow-sm shadow-blue-600/40">
                      {unseenCount > 9 ? '9+' : unseenCount}
                    </span>
                  ) : null}
                </Button>
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="User Avatar"
                    className="h-9 w-9 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                    title={user?.name ?? 'User'}
                  />
                ) : null}
              </div>
            </div>

            {/* Page Title (desktop only) */}
            <div className="hidden lg:block">
              <h1 className="text-2xl font-extrabold leading-none text-slate-900 dark:text-slate-50">{getPageTitle()}</h1>
            </div>

            {/* Desktop and Tablet Search Bar & Controls */}
            <div className="flex w-full flex-1 items-center justify-end gap-4 lg:w-auto">
              <form onSubmit={searchFiles} className="relative w-full min-w-0 sm:max-w-md lg:max-w-lg">
                <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                <Input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search Documents" className="h-10 border-slate-200 bg-white pl-11 pr-12 shadow-sm dark:border-slate-700 dark:bg-slate-900" />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Search files"><SlidersHorizontal className="h-4.5 w-4.5" /></button>
              </form>

              {/* Desktop action group */}
              <div className="hidden shrink-0 items-center gap-3 lg:flex">
                <ThemeToggle className="h-10 w-10" />
                <div className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative h-10 w-10 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                    aria-label="Update logs"
                    aria-expanded={updatesOpen}
                    onClick={toggleUpdateLogs}
                  >
                    <Bell className="h-4.5 w-4.5" />
                    {bellBadge ? (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-extrabold leading-none text-white shadow-sm shadow-blue-600/40">
                        {unseenCount > 9 ? '9+' : unseenCount}
                      </span>
                    ) : null}
                  </Button>
                </div>

                {/* Profile Mini Card */}
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <img src={profileImageUrl} alt="User Avatar" className="h-7 w-7 rounded-full object-cover" />
                  <div className="text-left">
                    <p className="text-xs font-extrabold leading-none text-slate-950 dark:text-slate-50">{user?.name ?? 'User'}</p>
                    <p className="mt-1 text-[9px] font-bold leading-none text-slate-400">{user?.email ?? ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>
          {user?.role === 'demo' && (
            <div className="flex shrink-0 items-center justify-between rounded-xl border border-orange-200 bg-orange-50 p-3.5 text-xs font-bold text-orange-800 shadow-sm animate-pulse dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-200">
              <span>⚠️ Demo Mode — files and settings may be reset. Pre-connected app storage is used.</span>
            </div>
          )}
          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
        </section>

        {/* Single update-logs host: mobile bottom sheet + tablet/desktop dropdown near header */}
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[75] flex justify-end p-0 sm:p-4 lg:p-6">
          <div className="pointer-events-auto relative w-full sm:w-auto sm:pt-12 lg:pt-14">
            <UpdateLogsPanel
              open={updatesOpen}
              onClose={() => setUpdatesOpen(false)}
              entries={mergedEntries}
              loading={updatesLoading && productEntries.length === 0}
              error={updatesError}
              unseenCount={unseenCount}
              onMarkAllRead={markAllRead}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
