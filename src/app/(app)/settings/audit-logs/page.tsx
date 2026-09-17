"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, History, ShieldAlert } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import { fetchWorkspaceAuditLogs, type AuditLogEntry } from "@/lib/api/audit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { LoadingState } from "@/components/shared/loading-state"
import { PageHeader } from "@/components/shared/page-header"

export default function AuditLogsPage() {
  const router = useRouter()
  const { session } = useAuth()
  const { isAdmin } = useWorkspacePermissions()
  const workspaceId = session?.workspace.id ?? null

  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLogs = useCallback(async () => {
    if (!workspaceId || !isAdmin) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchWorkspaceAuditLogs(50)
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs.")
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, isAdmin])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Audit logs"
          description="Workspace activity and security events."
          action={
            <Button
              variant="outline"
              size="lg"
              className="min-h-11 gap-1.5"
              onClick={() => router.push("/settings")}
            >
              <ArrowLeft className="size-4" />
              Back to settings
            </Button>
          }
        />
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <ShieldAlert className="size-5" />
              <CardTitle>Administrator Access Required</CardTitle>
            </div>
            <CardDescription className="text-amber-700 dark:text-amber-400">
              Only workspace administrators are authorized to inspect audit logs. Your current role is{" "}
              <strong className="capitalize">{session?.workspace.role ?? "member"}</strong>.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Audit logs"
          description="Workspace activity and security events."
        />
        <LoadingState label="Loading workspace audit events" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Audit logs"
          description="Workspace activity and security events."
        />
        <ErrorState title="Cannot load audit logs" description={error} />
        <Button variant="outline" onClick={loadLogs}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit logs"
        description="Review all recorded administrative and operational events for this workspace."
        action={
          <Button
            variant="outline"
            size="lg"
            className="min-h-11 gap-1.5"
            onClick={() => router.push("/settings")}
          >
            <ArrowLeft className="size-4" />
            Back to settings
          </Button>
        }
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No audit events yet"
          description="Actions like workspace switching, brand brief updates, and content generation will appear here."
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="transition-colors hover:border-muted-foreground/30">
              <CardHeader className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                      {log.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      on <strong>{log.resource}</strong>
                      {log.resourceId ? ` (${log.resourceId})` : ""}
                    </span>
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </time>
                </div>
                <CardDescription className="pt-1 text-xs">
                  Performed by:{" "}
                  <strong>{log.actor?.name || log.actor?.email || log.actorId}</strong>
                </CardDescription>
              </CardHeader>
              {log.payload && Object.keys(log.payload).length > 0 ? (
                <CardContent className="pt-0 pb-4">
                  <pre className="overflow-x-auto rounded-md bg-muted/50 p-2.5 font-mono text-[11px] text-muted-foreground">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
