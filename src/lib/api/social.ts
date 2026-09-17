import { authedRequest } from "@/lib/api/authed"
import { apiRequest } from "@/lib/api/client"
import type {
  SocialAccountType,
  SocialAccountTypesResponse,
  SocialConnection,
  SocialConnectionResult,
  SocialOAuthStartResponse,
} from "@/lib/api/types"

/** Lists social channel connections for the active workspace. */
export async function listSocialConnections() {
  return authedRequest<SocialConnection[]>("/api/v1/social/connections", {
    method: "GET",
  })
}

/** Public list of supported social account types. */
export async function listSocialAccountTypes() {
  return apiRequest<SocialAccountTypesResponse>("/api/v1/social/account-types", {
    method: "GET",
    skipAuth: true,
  })
}

/** Starts stub (or live) OAuth for a channel. Returns a frontend redirect URL. */
export async function startSocialOAuth(
  accountType: SocialAccountType | string,
  redirectUri: string,
  state?: string
) {
  return authedRequest<SocialOAuthStartResponse>(
    `/api/v1/social/oauth/${encodeURIComponent(accountType)}/start`,
    {
      method: "POST",
      body: { redirectUri, state },
    }
  )
}

/** Completes OAuth after the provider (or stub page) returns a code. */
export async function completeSocialOAuth(
  accountType: SocialAccountType | string,
  input: { code: string; state: string; redirectUri: string }
) {
  return authedRequest<SocialConnectionResult>(
    `/api/v1/social/oauth/${encodeURIComponent(accountType)}/callback`,
    {
      method: "POST",
      body: input,
    }
  )
}

export async function disconnectSocialConnection(connectionId: string) {
  return authedRequest<SocialConnectionResult>(
    `/api/v1/social/connections/${encodeURIComponent(connectionId)}/disconnect`,
    { method: "POST" }
  )
}

/** Returns a new authorization URL for an existing connection. */
export async function reconnectSocialConnection(connectionId: string) {
  return authedRequest<SocialOAuthStartResponse>(
    `/api/v1/social/connections/${encodeURIComponent(connectionId)}/reconnect`,
    { method: "POST" }
  )
}
