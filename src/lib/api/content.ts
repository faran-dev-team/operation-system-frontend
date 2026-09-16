import { authedRequest } from "@/lib/api/authed"
import type {
  ContentDraft,
  ContentJob,
  CreateContentRequestPayload,
  SubmitContentResponse,
} from "@/lib/api/types"

export async function submitContentRequest(
  payload: CreateContentRequestPayload,
  idempotencyKey: string
) {
  return authedRequest<SubmitContentResponse>("/api/v1/content/requests", {
    method: "POST",
    body: payload,
    headers: { "Idempotency-Key": idempotencyKey },
  })
}

export async function getContentJob(jobId: string) {
  return authedRequest<ContentJob>(
    `/api/v1/content/jobs/${encodeURIComponent(jobId)}`
  )
}

export async function listContentDrafts() {
  return authedRequest<ContentDraft[]>("/api/v1/content/drafts")
}

export async function getContentDraft(draftId: string) {
  return authedRequest<ContentDraft>(
    `/api/v1/content/drafts/${encodeURIComponent(draftId)}`
  )
}
