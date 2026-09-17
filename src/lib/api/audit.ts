import { authedRequest } from "@/lib/api/authed"

export type AuditLogEntry = {
  id: string
  workspaceId: string
  actorId: string
  action: string
  resource: string
  resourceId: string | null
  payload: Record<string, unknown> | null
  createdAt: string
  actor?: {
    id: string
    email: string
    name: string | null
  }
}

export async function fetchWorkspaceAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  const { data } = await authedRequest<AuditLogEntry[]>(`/api/v1/audit-logs?limit=${limit}`, {
    method: "GET",
  })
  return data
}
