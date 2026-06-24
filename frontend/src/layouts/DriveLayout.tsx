import { type FormEvent, useEffect, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { apiFetch, formatBytes, formatDate } from '@/lib/api'
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

type RepoUpdate = {
  sha: string
  title: string
  author: string
  date: string
  url: string
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

function RepoUpdatesDropdown({ updates, loading, error }: { updates: RepoUpdate[]; loading: boolean; error: string }) {
  return (
    <div className="absolute right-0 top-12 z-50 w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-extrabold text-slate-950">Repository Updates</p>
        <p className="text-xs text-slate-500">Latest commits from zenhosta/CasaNest</p>
      </div>
      <div className="max-h-96 overflow-y-auto p-2">
        {loading ? <p className="p-4 text-sm text-slate-500">Loading updates...</p> : null}
        {error ? <p className="p-4 text-sm text-red-600">{error}</p> : null}
        {!loading && !error && updates.length === 0 ? <p className="p-4 text-sm text-slate-500">No updates found.</p> : null}
        {!loading && !error ? updates.map((update) => (
          <a key={update.sha} href={update.url} target="_blank" rel="noreferrer" className="block rounded-xl p-3 transition hover:bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-2 min-w-0 text-sm font-bold leading-snug text-slate-950">{update.title}</p>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{update.sha}</span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-500">{update.author} • {update.date}</p>
          </a>
        )) : null}
      </div>
      <a href="https://github.com/zenhosta/9drive" target="_blank" rel="noreferrer" className="block border-t border-slate-200 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50">View repository</a>
    </div>
  )
}

function Sidebar({ onNavigate, storage, onLogout }: { onNavigate?: () => void; storage: StorageSummary | null; onLogout: () => void }) {
  const used = Number(storage?.usedBytes ?? 0)
  const total = Number(storage?.totalBytes ?? 0)
  const progress = total > 0 ? Math.min(100, (used / total) * 100) : 0

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-100 bg-white p-5">
      {/* Brand logo & tagline */}
      <div className="flex flex-col gap-1.5 pb-5 border-b border-slate-100/85">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="h-10 w-10 shrink-0" logoClassName="h-14 w-14" />
          <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">CasaNest</span>
        </div>
        <p className="text-[10px] font-bold text-slate-400 leading-normal">
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
                  ? 'bg-blue-50/70 text-blue-600 shadow-sm border-l-2 border-blue-600 rounded-l-none pl-3'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Storage summary progress */}
      <div className="mt-5 pt-4 border-t border-slate-100/80">
        <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Used</span>
            <span>{formatBytes(storage?.totalBytes)}</span>
          </div>
          <p className="mt-1 text-sm font-extrabold text-slate-900">{formatBytes(storage?.usedBytes)}</p>
          <div className="mt-2.5 h-1.5 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Logout button at bottom */}
      <div className="mt-4">
        <Button
          variant="outline"
          className="w-full justify-start text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50/50 border-slate-200"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
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
  const [updates, setUpdates] = useState<RepoUpdate[]>([])
  const [updatesLoading, setUpdatesLoading] = useState(false)
  const [updatesError, setUpdatesError] = useState('')
  const [updatesLoaded, setUpdatesLoaded] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState('')

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
      const response = await fetch('https://api.github.com/repos/zenhosta/9drive/commits?per_page=5', {
        headers: { Accept: 'application/vnd.github+json' },
      })
      if (!response.ok) throw new Error(response.status === 403 ? 'GitHub rate limit reached. Try again later.' : 'Failed to load repository updates.')
      const commits = await response.json() as GitHubCommit[]
      setUpdates(commits.map((item) => ({
        sha: item.sha.slice(0, 7),
        title: item.commit.message.split('\n')[0] || 'Repository update',
        author: item.commit.author?.name ?? 'GitHub',
        date: item.commit.author?.date ? formatDate(item.commit.author.date) : '--',
        url: item.html_url,
      })))
      setUpdatesLoaded(true)
    } catch (error) {
      setUpdatesError(error instanceof Error ? error.message : 'Failed to load repository updates.')
    } finally {
      setUpdatesLoading(false)
    }
  }

  function toggleRepoUpdates() {
    setUpdatesOpen((open) => !open)
    if (!updatesLoaded && !updatesLoading) loadRepoUpdates().catch(() => undefined)
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

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-brand-bg">
      <div className="flex min-h-screen w-full flex-col bg-brand-bg lg:h-screen lg:overflow-hidden lg:flex-row">
        <div className="hidden lg:block lg:h-screen lg:shrink-0">
          <Sidebar storage={storage} onLogout={logout} />
        </div>
        <div className={cn('fixed inset-0 z-40 bg-slate-950/40 transition-opacity lg:hidden', sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={() => setSidebarOpen(false)} />
        <div className={cn('fixed inset-y-0 left-0 z-50 transform bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
          <div className="absolute right-4 top-4 z-10">
            <Button variant="outline" size="icon" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Sidebar storage={storage} onLogout={logout} onNavigate={() => setSidebarOpen(false)} />
        </div>
        
        <section className="min-w-0 flex-1 p-4 sm:p-8 lg:h-screen lg:overflow-y-auto lg:p-10 flex flex-col gap-6">
          <header className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-5 shrink-0">
            {/* Mobile Header elements */}
            <div className="flex items-center justify-between gap-3 lg:hidden w-full">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="outline" size="icon" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex min-w-0 items-center gap-2">
                  <BrandLogo className="h-9 w-9 shrink-0" logoClassName="h-12 w-12" />
                  <span className="truncate text-xl font-extrabold tracking-tight">CasaNest</span>
                </div>
              </div>
              <div className="relative shrink-0 flex items-center gap-2">
                <Button variant="outline" size="icon" className="relative h-9 w-9" aria-label="Repository updates" aria-expanded={updatesOpen} onClick={toggleRepoUpdates}>
                  <Bell className="h-4.5 w-4.5" />
                  {!updatesOpen ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" /> : null}
                </Button>
                {updatesOpen ? <RepoUpdatesDropdown updates={updates} loading={updatesLoading} error={updatesError} /> : null}
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="User Avatar"
                    className="h-9 w-9 rounded-full object-cover border border-slate-200"
                    title={user?.name ?? 'User'}
                  />
                ) : null}
              </div>
            </div>

            {/* Page Title (desktop only) */}
            <div className="hidden lg:block">
              <h1 className="text-2xl font-extrabold text-slate-900 leading-none">{getPageTitle()}</h1>
            </div>

            {/* Desktop and Tablet Search Bar & Controls */}
            <div className="flex-1 flex items-center justify-end gap-4 w-full lg:w-auto">
              <form onSubmit={searchFiles} className="relative w-full min-w-0 sm:max-w-md lg:max-w-lg">
                <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                <Input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search Documents" className="pl-11 pr-12 h-10 border-slate-200 shadow-sm bg-white" />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Search files"><SlidersHorizontal className="h-4.5 w-4.5" /></button>
              </form>

              {/* Desktop action group */}
              <div className="hidden items-center gap-4 lg:flex shrink-0">
                <div className="relative">
                  <Button variant="outline" size="icon" className="relative border-slate-200 shadow-sm h-10 w-10 bg-white" aria-label="Repository updates" aria-expanded={updatesOpen} onClick={toggleRepoUpdates}>
                    <Bell className="h-4.5 w-4.5" />
                    {!updatesOpen ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600" /> : null}
                  </Button>
                  {updatesOpen ? <RepoUpdatesDropdown updates={updates} loading={updatesLoading} error={updatesError} /> : null}
                </div>

                {/* Profile Mini Card */}
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm">
                  <img src={profileImageUrl} alt="User Avatar" className="h-7 w-7 rounded-full object-cover" />
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-slate-950 leading-none">{user?.name ?? 'User'}</p>
                    <p className="text-[9px] font-bold text-slate-400 leading-none mt-1">{user?.email ?? ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>
          {user?.role === 'demo' && (
            <div className="rounded-xl bg-orange-50 border border-orange-200 p-3.5 text-xs font-bold text-orange-800 flex items-center justify-between shadow-sm animate-pulse shrink-0">
              <span>⚠️ Demo Mode — files and settings may be reset. Pre-connected app storage is used.</span>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  )
}
