import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { getStoredUser, setAuthSession, type AuthUser } from '@/lib/auth'

/**
 * Gate protected pages.
 * 1) Fast path: user already in session/local storage.
 * 2) Restore path: HttpOnly refresh cookie still valid after tab/browser close
 *    (especially when "Remember me" was checked) — hydrate user via /auth/me.
 */
export function ProtectedRoute() {
  const [ready, setReady] = useState(() => Boolean(getStoredUser()))
  const [allowed, setAllowed] = useState(() => Boolean(getStoredUser()))

  useEffect(() => {
    if (getStoredUser()) {
      setAllowed(true)
      setReady(true)
      return
    }

    let cancelled = false
    apiFetch<{ user: AuthUser }>('/auth/me')
      .then((data) => {
        if (cancelled) return
        // Cookie-backed restore — keep durable if remember flag already set.
        setAuthSession('', '', data.user)
        setAllowed(true)
      })
      .catch(() => {
        if (!cancelled) setAllowed(false)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
        Restoring session…
      </div>
    )
  }

  return allowed ? <Outlet /> : <Navigate to="/login" replace />
}
