import { apiRequest } from "@/lib/api/client"
import type { ProvidersHealthResponse } from "@/lib/api/types"

/** Public provider readiness (DeepSeek, Retell, SMTP, Social, Ads). */
export async function getProvidersHealth() {
  return apiRequest<ProvidersHealthResponse>("/api/v1/providers/health", {
    method: "GET",
    skipAuth: true,
  })
}
