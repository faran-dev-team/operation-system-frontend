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

export type WorkspaceSummary = {
  id: string
  name: string
  slug: string
  role: "admin" | "operator" | "reviewer"
  isCurrent?: boolean
}

export type BrandBriefResponse = {
  id: string
  workspaceId: string
  name: string
  tone: string | null
  approvedFacts: string | null
  prohibitedClaims: string | null
  createdAt: string
  updatedAt: string
}

export type UpsertBrandBriefPayload = {
  name: string
  tone?: string
  approvedFacts?: string
  prohibitedClaims?: string
}

export type ContentJobStatus = "requested" | "running" | "succeeded" | "failed"

export type ContentRequestSummary = {
  id: string
  workspaceId: string
  createdByUserId: string | null
  status: ContentJobStatus
  input: unknown
  idempotencyKey: string | null
  createdAt: string
}

export type ContentJob = {
  id: string
  workspaceId: string
  contentRequestId: string
  status: ContentJobStatus
  provider: string
  promptVersion: string
  errorCode: string | null
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  usageMetadata: unknown
  draftId: string | null
  createdAt: string
  updatedAt: string
}

export type ContentDraft = {
  id: string
  workspaceId: string
  contentRequestId: string
  generationJobId: string | null
  title: string | null
  body: string
  version: number
  provider: string | null
  promptVersion: string | null
  metadata: unknown
  createdAt: string
  updatedAt: string
}

export type SubmitContentResponse = {
  request: ContentRequestSummary
  job: ContentJob | null
  draft: ContentDraft | null
}

export type CreateContentRequestPayload = {
  topic: string
  audience?: string
  format?: string
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
