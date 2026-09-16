import { apiRequest } from "@/lib/api/client"
import type { LoginResponse, MeResponse } from "@/lib/api/types"
import {
  clearSession,
  getAccessToken,
  getWorkspaceId,
  setSession,
  type AuthSession,
} from "@/lib/auth/session"

export async function loginWithPassword(email: string, password: string) {
  const { data } = await apiRequest<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuth: true,
  })
  return data
}

export async function fetchMe(token: string, workspaceId?: string | null) {
  const { data } = await apiRequest<MeResponse>("/api/v1/me", {
    token,
    workspaceId,
  })
  return data
}

export async function establishSession(
  accessToken: string,
  options?: { remember?: boolean; workspaceId?: string | null }
): Promise<AuthSession> {
  const me = await fetchMe(accessToken, options?.workspaceId)
  const session: AuthSession = {
    accessToken,
    workspaceId: me.workspace.id,
    user: me.user,
    workspace: me.workspace,
  }
  setSession(session, { remember: options?.remember ?? true })
  return session
}

export function logout() {
  clearSession()
}

export async function restoreSession(): Promise<AuthSession | null> {
  const token = getAccessToken()
  if (!token) {
    return null
  }

  try {
    const remember =
      typeof window !== "undefined" &&
      window.localStorage.getItem("os.remember") !== "0"
    return await establishSession(token, {
      remember,
      workspaceId: getWorkspaceId(),
    })
  } catch {
    clearSession()
    return null
  }
}
