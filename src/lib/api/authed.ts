import { apiRequest } from "@/lib/api/client"
import type { ApiRequestOptions } from "@/lib/api/types"
import { getAccessToken, getWorkspaceId } from "@/lib/auth/session"

/** Authenticated helper for app screens. Uses the stored session token/workspace. */
export async function authedRequest<T>(
  path: string,
  options: Omit<ApiRequestOptions, "token" | "workspaceId"> = {}
) {
  const token = getAccessToken()
  if (!token) {
    throw new Error("You are signed out. Sign in again.")
  }

  return apiRequest<T>(path, {
    ...options,
    token,
    workspaceId: getWorkspaceId(),
  })
}
