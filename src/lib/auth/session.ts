import type { MeResponse } from "@/lib/api/types"

const TOKEN_KEY = "os.accessToken"
const WORKSPACE_KEY = "os.workspaceId"
const USER_KEY = "os.user"
const WORKSPACE_META_KEY = "os.workspace"
const REMEMBER_KEY = "os.remember"

export type AuthSession = {
  accessToken: string
  workspaceId: string
  user: MeResponse["user"]
  workspace: MeResponse["workspace"]
}

function canUseStorage() {
  return typeof window !== "undefined"
}

function storageWithToken(): Storage | null {
  if (!canUseStorage()) {
    return null
  }
  if (window.localStorage.getItem(TOKEN_KEY)) {
    return window.localStorage
  }
  if (window.sessionStorage.getItem(TOKEN_KEY)) {
    return window.sessionStorage
  }
  return null
}

function readJson<T>(storage: Storage, key: string): T | null {
  const raw = storage.getItem(key)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function getAccessToken() {
  const storage = storageWithToken()
  return storage?.getItem(TOKEN_KEY) ?? null
}

export function getWorkspaceId() {
  const storage = storageWithToken()
  return storage?.getItem(WORKSPACE_KEY) ?? null
}

export function getStoredSession(): AuthSession | null {
  const storage = storageWithToken()
  if (!storage) {
    return null
  }

  const accessToken = storage.getItem(TOKEN_KEY)
  const workspaceId = storage.getItem(WORKSPACE_KEY)
  const user = readJson<MeResponse["user"]>(storage, USER_KEY)
  const workspace = readJson<MeResponse["workspace"]>(storage, WORKSPACE_META_KEY)

  if (!accessToken || !workspaceId || !user || !workspace) {
    return null
  }

  return { accessToken, workspaceId, user, workspace }
}

export function setSession(
  session: AuthSession,
  options?: { remember?: boolean }
) {
  if (!canUseStorage()) {
    return
  }

  const remember = options?.remember ?? true
  window.localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0")

  const primary = remember ? window.localStorage : window.sessionStorage
  const secondary = remember ? window.sessionStorage : window.localStorage

  secondary.removeItem(TOKEN_KEY)
  secondary.removeItem(WORKSPACE_KEY)
  secondary.removeItem(USER_KEY)
  secondary.removeItem(WORKSPACE_META_KEY)

  primary.setItem(TOKEN_KEY, session.accessToken)
  primary.setItem(WORKSPACE_KEY, session.workspaceId)
  primary.setItem(USER_KEY, JSON.stringify(session.user))
  primary.setItem(WORKSPACE_META_KEY, JSON.stringify(session.workspace))
}

export function clearSession() {
  if (!canUseStorage()) {
    return
  }
  for (const storage of [window.localStorage, window.sessionStorage]) {
    storage.removeItem(TOKEN_KEY)
    storage.removeItem(WORKSPACE_KEY)
    storage.removeItem(USER_KEY)
    storage.removeItem(WORKSPACE_META_KEY)
  }
  window.localStorage.removeItem(REMEMBER_KEY)
}
