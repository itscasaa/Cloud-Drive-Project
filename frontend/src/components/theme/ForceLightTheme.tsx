import { useEffect, type ReactNode } from 'react'
import { forceLightTheme, releaseForcedLightTheme } from '@/lib/theme'

/**
 * Keeps marketing / auth marketing surfaces on light design while
 * preserving the user's dashboard dark-mode preference in localStorage.
 */
export function ForceLightTheme({ children }: { children: ReactNode }) {
  useEffect(() => {
    forceLightTheme()
    return () => {
      releaseForcedLightTheme()
    }
  }, [])

  return <>{children}</>
}
