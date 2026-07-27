export type ThemeMode = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'casanest.theme'

/** Marketing / public pages that must stay light regardless of dashboard preference. */
export const FORCE_LIGHT_PATHS = [
  '/',
  '/features',
  '/about-security',
  '/about-recovery',
  '/pricing',
  '/privacy',
  '/terms',
  '/data-deletion',
  '/login',
  '/register',
] as const

export function isForceLightPath(pathname: string) {
  if (FORCE_LIGHT_PATHS.includes(pathname as (typeof FORCE_LIGHT_PATHS)[number])) return true
  // trailing slash normalize
  const bare = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  return FORCE_LIGHT_PATHS.includes(bare as (typeof FORCE_LIGHT_PATHS)[number])
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    return null
  }
}

export function resolveTheme(preferred?: ThemeMode | null): ThemeMode {
  if (preferred === 'dark' || preferred === 'light') return preferred
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function setThemeColorMeta(theme: ThemeMode) {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b1220' : '#2563eb')
}

function paintTheme(theme: ThemeMode, { animate = true }: { animate?: boolean } = {}) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
  root.style.colorScheme = theme
  setThemeColorMeta(theme)

  if (animate) {
    root.classList.add('theme-animating')
    window.setTimeout(() => root.classList.remove('theme-animating'), 420)
  }
}

export function applyTheme(theme: ThemeMode) {
  paintTheme(theme, { animate: true })

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Temporarily force light chrome for marketing pages.
 * Does NOT overwrite the user's saved dashboard theme preference.
 */
export function forceLightTheme() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.add('theme-force-light')
  paintTheme('light', { animate: false })
}

/** Restore theme from storage / system after leaving a force-light page. */
export function releaseForcedLightTheme() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.remove('theme-force-light')
  paintTheme(resolveTheme(getStoredTheme()), { animate: false })
}

export function initTheme() {
  // If first paint already forced light via index.html for this path, keep it
  // until React route mounts; still seed storage-aware state for dashboard.
  if (typeof window !== 'undefined' && isForceLightPath(window.location.pathname)) {
    forceLightTheme()
    return
  }
  applyTheme(resolveTheme(getStoredTheme()))
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
  applyTheme(next)
  return next
}
