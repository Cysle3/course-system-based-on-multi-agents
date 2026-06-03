const TOKEN_KEY = "scss_access_token"
const USER_KEY = "scss_user"

export type UserRole = "STUDENT" | "ADMIN"

export type AuthUser = {
  id: string
  name: string
  role: UserRole
}

export type LoginPayload = {
  id: string
  password: string
}

export type LoginResponse = {
  token: string
  tokenType?: string
  user: AuthUser
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  const value = localStorage.getItem(USER_KEY)

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as AuthUser
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function persistSession(response: LoginResponse) {
  localStorage.setItem(TOKEN_KEY, response.token)
  localStorage.setItem(USER_KEY, JSON.stringify(response.user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated() {
  return Boolean(getStoredToken())
}
