import { authedRequest } from "@/lib/api/authed"
import type { SocialConnection } from "@/lib/api/types"

/** Lists social channel connections for the active workspace. */
export async function listSocialConnections() {
  return authedRequest<SocialConnection[]>("/api/v1/social/connections", {
    method: "GET",
  })
}
