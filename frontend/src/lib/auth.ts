export type AuthUser = {
  id: string
  name: string
  email: string
  role?: string
  status?: string
}

const USER_KEY = 'casanest.user'

export function getAccessToken() {
  return null
}

export function getRefreshToken() {
  return null
}

export function getStoredUser(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) as AuthUser : null
}

export function setAuthSession(_accessToken: string, _refreshToken: string, user: AuthUser) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function updateStoredUser(user: AuthUser) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function setAccessToken(_accessToken: string) {
  // Access tokens are handled by HttpOnly cookies
}

export function clearAuthSession() {
  sessionStorage.removeItem(USER_KEY)
}

