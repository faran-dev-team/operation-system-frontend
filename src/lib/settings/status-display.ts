import type { ListRow, StatusTone } from "@/lib/mocks"
import type {
  ConnectionLifecycleStatus,
  IntegrationStatus,
  ProviderHealth,
  ProvidersHealthResponse,
  SocialAccountType,
  SocialConnection,
} from "@/lib/api/types"

const PROVIDER_LABELS: Record<string, string> = {
  deepseek: "DeepSeek",
  retell: "Retell",
  email: "Email (SMTP)",
  social: "Social adapter",
  ads: "Ads",
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
}

const ACCOUNT_LABELS: Record<SocialAccountType, string> = {
  facebook: "Facebook Page",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
}

const INTEGRATION_LABEL: Record<IntegrationStatus, string> = {
  ok: "Ready",
  skipped: "Not configured",
  error: "Error",
}

const INTEGRATION_TONE: Record<IntegrationStatus, StatusTone> = {
  ok: "success",
  skipped: "neutral",
  error: "warning",
}

const CONNECTION_LABEL: Record<ConnectionLifecycleStatus, string> = {
  pending: "Pending",
  connected: "Connected",
  disconnected: "Disconnected",
  expired: "Needs attention",
  error: "Error",
}

const CONNECTION_TONE: Record<ConnectionLifecycleStatus, StatusTone> = {
  pending: "review",
  connected: "success",
  disconnected: "neutral",
  expired: "warning",
  error: "warning",
}

export function providerLabel(provider: string) {
  return PROVIDER_LABELS[provider] ?? provider
}

export function accountTypeLabel(accountType: string | null | undefined) {
  if (!accountType) return "Channel"
  return ACCOUNT_LABELS[accountType as SocialAccountType] ?? accountType
}

export function providersHealthToRows(
  health: ProvidersHealthResponse
): ListRow[] {
  const order = ["deepseek", "retell", "email", "social", "ads"] as const
  return order.map((key) => {
    const check: ProviderHealth = health.checks[key]
    const status = (check.status in INTEGRATION_LABEL
      ? check.status
      : "skipped") as IntegrationStatus
    return {
      id: `provider-${key}`,
      title: providerLabel(key),
      meta: check.message?.trim() || `Last checked ${formatCheckedAt(check.checkedAt)}`,
      status: INTEGRATION_LABEL[status],
      tone: INTEGRATION_TONE[status],
    }
  })
}

export function socialConnectionsToRows(
  connections: SocialConnection[]
): ListRow[] {
  return connections.map((row) => {
    const statusKey = (
      row.status in CONNECTION_LABEL ? row.status : "pending"
    ) as ConnectionLifecycleStatus
    const title = row.displayName?.trim() || accountTypeLabel(row.accountType)
    const account = accountTypeLabel(row.accountType)
    const metaParts = [
      account !== title ? account : null,
      row.externalAccountId ? `Account ${row.externalAccountId}` : null,
      row.lastHealthMessage?.trim() || null,
    ].filter(Boolean)

    return {
      id: row.id,
      title,
      meta: metaParts.length > 0 ? metaParts.join(" · ") : "No health details yet",
      status: CONNECTION_LABEL[statusKey],
      tone: CONNECTION_TONE[statusKey],
    }
  })
}

function formatCheckedAt(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}
