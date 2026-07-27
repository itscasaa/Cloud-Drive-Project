export type AuthUser = {
  id: string
  name: string
  email: string
  role?: string
  status?: string
}

const USER_KEY = 'casanest.user'
const REMEMBER_KEY = 'casanest.remember'

function readUserFrom(storage: Storage): AuthUser | null {
  try {
    const raw = storage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) as AuthUser : null
  } catch {
    return null
  }
}

export function isRememberMeEnabled() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(REMEMBER_KEY) === '1'
}

export function getAccessToken() {
  return null
}

export function getRefreshToken() {
  return null
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  // Prefer durable storage when "Remember me" was used.
  return readUserFrom(localStorage) ?? readUserFrom(sessionStorage)
}

export function setAuthSession(
  _accessToken: string,
  _refreshToken: string,
  user: AuthUser,
  options: { rememberMe?: boolean } = {},
) {
  const rememberMe = options.rememberMe ?? isRememberMeEnabled()
  const payload = JSON.stringify(user)

  if (rememberMe) {
    localStorage.setItem(REMEMBER_KEY, '1')
    localStorage.setItem(USER_KEY, payload)
    sessionStorage.removeItem(USER_KEY)
  } else {
    localStorage.removeItem(REMEMBER_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.setItem(USER_KEY, payload)
  }
}

export function updateStoredUser(user: AuthUser) {
  const payload = JSON.stringify(user)
  if (isRememberMeEnabled() || localStorage.getItem(USER_KEY)) {
    localStorage.setItem(USER_KEY, payload)
    sessionStorage.removeItem(USER_KEY)
    return
  }
  sessionStorage.setItem(USER_KEY, payload)
}

export function setAccessToken(_accessToken: string) {
  // Access tokens are handled by HttpOnly cookies
}

export function clearAuthSession() {
  sessionStorage.removeItem(USER_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(REMEMBER_KEY)
}
