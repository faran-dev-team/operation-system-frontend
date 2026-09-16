import { authedRequest } from "@/lib/api/authed"
import type {
  BrandBriefResponse,
  UpsertBrandBriefPayload,
} from "@/lib/api/types"

export async function getBrandBrief() {
  return authedRequest<BrandBriefResponse>("/api/v1/brand-brief")
}

export async function saveBrandBrief(payload: UpsertBrandBriefPayload) {
  return authedRequest<BrandBriefResponse>("/api/v1/brand-brief", {
    method: "PUT",
    body: payload,
  })
}
