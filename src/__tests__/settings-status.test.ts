import { describe, expect, it } from "vitest"

import {
  providersHealthToRows,
  socialConnectionsToRows,
} from "@/lib/settings/status-display"
import type {
  ProvidersHealthResponse,
  SocialConnection,
} from "@/lib/api/types"

describe("settings status display", () => {
  it("maps provider health checks into list rows", () => {
    const health: ProvidersHealthResponse = {
      status: "degraded",
      checks: {
        deepseek: {
          provider: "deepseek",
          status: "ok",
          checkedAt: "2026-09-16T12:00:00.000Z",
          message: "DeepSeek reachable.",
        },
        retell: {
          provider: "retell",
          status: "skipped",
          checkedAt: "2026-09-16T12:00:00.000Z",
          message: "RETELL_API_KEY or RETELL_AGENT_ID is not configured.",
        },
        email: {
          provider: "email",
          status: "error",
          checkedAt: "2026-09-16T12:00:00.000Z",
          message: "SMTP failed.",
        },
        social: {
          provider: "social",
          status: "ok",
          checkedAt: "2026-09-16T12:00:00.000Z",
        },
        ads: {
          provider: "ads",
          status: "ok",
          checkedAt: "2026-09-16T12:00:00.000Z",
        },
      },
    }

    const rows = providersHealthToRows(health)
    expect(rows).toHaveLength(5)
    expect(rows[0]).toMatchObject({
      title: "DeepSeek",
      status: "Ready",
      tone: "success",
    })
    expect(rows[1]).toMatchObject({
      title: "Retell",
      status: "Not configured",
      tone: "neutral",
    })
    expect(rows[2]).toMatchObject({
      title: "Email (SMTP)",
      status: "Error",
      tone: "warning",
    })
  })

  it("maps social connections into list rows", () => {
    const connections: SocialConnection[] = [
      {
        id: "c1",
        accountType: "instagram",
        status: "connected",
        externalAccountId: "stub_instagram_abc",
        scopes: ["email"],
        displayName: "Instagram connection",
        lastHealthAt: "2026-09-16T12:00:00.000Z",
        lastHealthMessage: "Connected via stub OAuth callback.",
        createdAt: "2026-09-16T11:00:00.000Z",
        updatedAt: "2026-09-16T12:00:00.000Z",
      },
      {
        id: "c2",
        accountType: "x",
        status: "expired",
        externalAccountId: null,
        scopes: [],
        displayName: null,
        lastHealthAt: null,
        lastHealthMessage: "Token expired.",
        createdAt: "2026-09-16T11:00:00.000Z",
        updatedAt: "2026-09-16T12:00:00.000Z",
      },
    ]

    const rows = socialConnectionsToRows(connections)
    expect(rows[0]).toMatchObject({
      id: "c1",
      title: "Instagram connection",
      status: "Connected",
      tone: "success",
    })
    expect(rows[0].meta).toContain("Instagram")
    expect(rows[1]).toMatchObject({
      title: "X (Twitter)",
      status: "Needs attention",
      tone: "warning",
    })
  })
})
