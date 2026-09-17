import { describe, expect, it } from "vitest"

import { accountTypeLabel } from "@/lib/settings/status-display"
import type { SocialAccountType, SocialConnection } from "@/lib/api/types"

const ACCOUNT_TYPES: SocialAccountType[] = [
  "facebook",
  "instagram",
  "linkedin",
  "x",
]

function buildChannelRows(
  accountTypes: SocialAccountType[],
  connections: SocialConnection[]
) {
  return accountTypes.map((accountType) => ({
    accountType,
    connection: connections.find((row) => row.accountType === accountType) ?? null,
    label: accountTypeLabel(accountType),
  }))
}

describe("channel connection rows", () => {
  it("shows all account types even when none are connected", () => {
    const rows = buildChannelRows(ACCOUNT_TYPES, [])
    expect(rows).toHaveLength(4)
    expect(rows.every((row) => row.connection === null)).toBe(true)
    expect(rows.map((row) => row.label)).toEqual([
      "Facebook Page",
      "Instagram",
      "LinkedIn",
      "X (Twitter)",
    ])
  })

  it("maps an existing connection onto its account type", () => {
    const connections: SocialConnection[] = [
      {
        id: "c1",
        accountType: "instagram",
        status: "connected",
        externalAccountId: "stub_instagram_1",
        scopes: ["email"],
        displayName: "Instagram connection",
        lastHealthAt: null,
        lastHealthMessage: "Connected via stub OAuth callback.",
        createdAt: "2026-09-17T00:00:00.000Z",
        updatedAt: "2026-09-17T00:00:00.000Z",
      },
    ]

    const rows = buildChannelRows(ACCOUNT_TYPES, connections)
    const instagram = rows.find((row) => row.accountType === "instagram")
    expect(instagram?.connection?.status).toBe("connected")
    expect(rows.filter((row) => row.connection).length).toBe(1)
  })
})
