"use client"

import Link from "next/link"
import { RefreshCw } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/shared/error-state"
import { ItemList } from "@/components/shared/item-list"
import { LoadingState } from "@/components/shared/loading-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { ChannelConnectionsPanel } from "@/components/settings/channel-connections-panel"
import { useChannelConnectionActions } from "@/hooks/use-channel-connection-actions"
import { useSettingsIntegrations } from "@/hooks/use-settings-integrations"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import { providersHealthToRows } from "@/lib/settings/status-display"
import type { StatusTone } from "@/lib/mocks"

function overallTone(status: "ready" | "degraded" | undefined): StatusTone {
  if (status === "ready") return "success"
  if (status === "degraded") return "warning"
  return "neutral"
}

export default function SettingsPage() {
  const { session } = useAuth()
  const { isAdmin, canMutate } = useWorkspacePermissions()
  const workspaceId = session?.workspace.id ?? null
  const {
    providersHealth,
    connections,
    isLoading,
    error,
    reload,
  } = useSettingsIntegrations(workspaceId)

  const {
    busyKey,
    actionError,
    connect,
    disconnect,
    reconnect,
  } = useChannelConnectionActions({
    canMutate,
    onChanged: reload,
  })

  const providerRows = providersHealth
    ? providersHealthToRows(providersHealth)
    : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage this workspace, brand details, and which channels are allowed to publish or spend."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              onClick={reload}
              disabled={isLoading || !workspaceId}
            >
              <RefreshCw className="size-4" />
              Refresh status
            </Button>
            <Button
              nativeButton={false}
              size="lg"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              render={<Link href="/settings/brand-brief" />}
            >
              Edit brand brief
            </Button>
            {isAdmin ? (
              <Button
                nativeButton={false}
                size="lg"
                variant="outline"
                className="min-h-11 w-full sm:w-auto"
                render={<Link href="/settings/audit-logs" />}
              >
                Audit logs
              </Button>
            ) : null}
          </div>
        }
      />

      {isLoading ? <LoadingState label="Loading provider and channel status" /> : null}

      {!isLoading && error ? (
        <ErrorState title="Could not load settings status" description={error} />
      ) : null}

      {!isLoading && !error && providersHealth ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium">Provider status</h3>
            <StatusBadge
              label={providersHealth.status === "ready" ? "Ready" : "Degraded"}
              tone={overallTone(providersHealth.status)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Live readiness for DeepSeek, Retell, email, social, and ads adapters.
          </p>
          <ItemList items={providerRows} />
        </div>
      ) : null}

      {!isLoading && !error ? (
        <ChannelConnectionsPanel
          connections={connections}
          canMutate={canMutate}
          busyKey={busyKey}
          actionError={actionError}
          onConnect={connect}
          onDisconnect={disconnect}
          onReconnect={reconnect}
        />
      ) : null}
    </div>
  )
}
