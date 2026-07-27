import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { applyTheme, getStoredTheme, resolveTheme, type ThemeMode } from '@/lib/theme'
import { cn } from '@/lib/utils'

type ThemeToggleProps = {
  className?: string
  size?: 'default' | 'sm' | 'icon'
}

export function ThemeToggle({ className, size = 'icon' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => resolveTheme(getStoredTheme()))
  const [spinning, setSpinning] = useState(false)

  useEffect(() => {
    // Sync if another tab changes theme.
    function onStorage(event: StorageEvent) {
      if (event.key !== 'casanest.theme') return
      const next = resolveTheme(event.newValue === 'dark' || event.newValue === 'light' ? event.newValue : null)
      setTheme(next)
      applyTheme(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function onToggle() {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    setSpinning(true)
    setTheme(next)
    applyTheme(next)
    window.setTimeout(() => setSpinning(false), 450)
  }

  const isDark = theme === 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'theme-toggle relative overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
        className,
      )}
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <Sun
          className={cn(
            'absolute h-4.5 w-4.5 text-amber-500 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            isDark ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
            spinning && !isDark ? 'animate-[theme-icon-pop_0.45s_ease]' : null,
          )}
        />
        <Moon
          className={cn(
            'absolute h-4.5 w-4.5 text-sky-300 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0',
            spinning && isDark ? 'animate-[theme-icon-pop_0.45s_ease]' : null,
          )}
        />
      </span>
    </Button>
  )
}
