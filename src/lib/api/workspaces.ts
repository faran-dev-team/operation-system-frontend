import { authedRequest } from "@/lib/api/authed"
import type { WorkspaceSummary } from "@/lib/api/types"

/** Fetches all workspaces where the authenticated user is a member */
export async function fetchUserWorkspaces(): Promise<WorkspaceSummary[]> {
  const { data } = await authedRequest<WorkspaceSummary[]>("/api/v1/workspaces", {
    method: "GET",
  })
  return data
}

/** Switches the active workspace in the database for the user */
export async function switchActiveWorkspace(
  workspaceId: string
): Promise<WorkspaceSummary> {
  const { data } = await authedRequest<WorkspaceSummary>("/api/v1/workspaces/switch", {
    method: "POST",
    body: { workspaceId },
  })
  return data
}
