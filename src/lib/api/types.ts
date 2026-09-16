/** Types aligned with backend docs/API_CONTRACT.md */

export type ApiErrorBody = {
  statusCode: number
  message: string | string[]
  error: string
  requestId?: string
  path?: string
  timestamp?: string
}

export type LoginResponse = {
  accessToken: string
  tokenType: "Bearer"
  expiresIn: number | null
  user: {
    email: string
    supabaseAuthId: string
  }
}

export type MeResponse = {
  user: {
    id: string
    email: string
    name: string | null
  }
  workspace: {
    id: string
    name: string
    slug: string
    role: "admin" | "operator" | "reviewer"
  }
}

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  token?: string | null
  workspaceId?: string | null
  requestId?: string
  headers?: Record<string, string>
  /** Skip Authorization even if a token is available in session helpers */
  skipAuth?: boolean
}
