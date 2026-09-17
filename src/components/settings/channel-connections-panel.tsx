"use client"

import { Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { accountTypeLabel } from "@/lib/settings/status-display"
import type { SocialAccountType, SocialConnection } from "@/lib/api/types"
import type { StatusTone } from "@/lib/mocks"

const DEFAULT_ACCOUNT_TYPES: SocialAccountType[] = [
  "facebook",
  "instagram",
  "linkedin",
  "x",
]

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  connected: "Connected",
  disconnected: "Disconnected",
  expired: "Needs attention",
  error: "Error",
}

const STATUS_TONE: Record<string, StatusTone> = {
  pending: "review",
  connected: "success",
  disconnected: "neutral",
  expired: "warning",
  error: "warning",
}

type ChannelRow = {
  accountType: SocialAccountType
  connection: SocialConnection | null
}

function buildRows(
  accountTypes: SocialAccountType[],
  connections: SocialConnection[]
): ChannelRow[] {
  const types = accountTypes.length > 0 ? accountTypes : DEFAULT_ACCOUNT_TYPES
  return types.map((accountType) => {
    const connection =
      connections.find((row) => row.accountType === accountType) ?? null
    return { accountType, connection }
  })
}

function connectionMeta(connection: SocialConnection | null) {
  if (!connection) return "Not connected yet"
  const parts = [
    connection.externalAccountId
      ? `Account ${connection.externalAccountId}`
      : null,
    connection.lastHealthMessage?.trim() || null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : "No health details yet"
}

export function ChannelConnectionsPanel({
  connections,
  accountTypes = DEFAULT_ACCOUNT_TYPES,
  canMutate,
  busyKey,
  actionError,
  onConnect,
  onDisconnect,
  onReconnect,
}: {
  connections: SocialConnection[]
  accountTypes?: SocialAccountType[]
  canMutate: boolean
  busyKey: string | null
  actionError: string | null
  onConnect: (accountType: SocialAccountType) => void
  onDisconnect: (connectionId: string) => void
  onReconnect: (connectionId: string) => void
}) {
  const rows = buildRows(accountTypes, connections)
  const busy = Boolean(busyKey)

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Channel connections</h3>
        <p className="text-sm text-muted-foreground">
          Connect Instagram, X, Facebook Page, or LinkedIn for this workspace.
          This uses the backend stub OAuth flow until live provider apps are
          finished.
        </p>
      </div>

      {!canMutate ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          View-only: reviewers can see connection status but cannot connect or
          disconnect channels.
        </p>
      ) : null}

      {actionError ? (
        <ErrorState title="Channel action failed" description={actionError} />
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No channels available"
          description="Social account types could not be loaded."
        />
      ) : (
        <ul className="divide-y rounded-xl ring-1 ring-foreground/10">
          {rows.map(({ accountType, connection }) => {
            const status = connection?.status ?? "disconnected"
            const statusLabel =
              connection == null
                ? "Not connected"
                : (STATUS_LABEL[status] ?? String(status))
            const tone: StatusTone =
              connection == null
                ? "neutral"
                : (STATUS_TONE[status] ?? "neutral")
            const isConnected = status === "connected"
            const isExpired = status === "expired"
            const showDisconnect = Boolean(connection) && (isConnected || isExpired)
            const showReconnect = Boolean(connection)
            const showConnect = !connection || status === "disconnected" || status === "pending"

            return (
              <li
                key={accountType}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{accountTypeLabel(accountType)}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {connectionMeta(connection)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={statusLabel} tone={tone} />
                  {canMutate && showConnect ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-9"
                      disabled={busy}
                      onClick={() => onConnect(accountType)}
                    >
                      {busyKey === `connect:${accountType}` ? "Connecting..." : "Connect"}
                    </Button>
                  ) : null}
                  {canMutate && showReconnect ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-9"
                      disabled={busy}
                      onClick={() => connection && onReconnect(connection.id)}
                    >
                      {busyKey === `reconnect:${connection?.id}`
                        ? "Reconnecting..."
                        : "Reconnect"}
                    </Button>
                  ) : null}
                  {canMutate && showDisconnect ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="min-h-9"
                      disabled={busy}
                      onClick={() => connection && onDisconnect(connection.id)}
                    >
                      {busyKey === `disconnect:${connection?.id}`
                        ? "Disconnecting..."
                        : "Disconnect"}
                    </Button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
