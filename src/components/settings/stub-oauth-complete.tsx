"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/shared/error-state"
import { LoadingState } from "@/components/shared/loading-state"
import { classifyApiError } from "@/lib/api/error-messages"
import { completeSocialOAuth } from "@/lib/api/social"
import { accountTypeLabel } from "@/lib/settings/status-display"

function createStubCode() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `stub-${crypto.randomUUID()}`
  }
  return `stub-${Date.now()}`
}

/** Completes backend stub OAuth using query params from the start/reconnect URL. */
export function StubOAuthComplete() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const started = useRef(false)
  const [error, setError] = useState<string | null>(null)

  const accountType = searchParams.get("accountType")
  const state = searchParams.get("state")
  const redirectUri = searchParams.get("redirectUri")
  const missingParams = !accountType || !state || !redirectUri

  useEffect(() => {
    if (missingParams || started.current) return

    started.current = true
    void (async () => {
      try {
        await completeSocialOAuth(accountType, {
          code: createStubCode(),
          state,
          redirectUri,
        })
        router.replace("/settings?channel=connected")
      } catch (err) {
        const classified = classifyApiError(
          err,
          "Could not finish the channel connection."
        )
        setError(classified.message)
      }
    })()
  }, [missingParams, accountType, state, redirectUri, router])

  if (missingParams) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 px-4 py-10">
        <ErrorState
          title="Connection failed"
          description="Missing OAuth details. Return to Settings and try Connect again."
        />
        <Button nativeButton={false} render={<Link href="/settings" />}>
          Back to Settings
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 px-4 py-10">
        <ErrorState title="Connection failed" description={error} />
        <p className="text-sm text-muted-foreground">
          If the social adapter shows &quot;Not configured&quot;, set
          PROVIDER_TOKEN_ENCRYPTION_KEY in the backend .env and restart the API.
        </p>
        <Button nativeButton={false} render={<Link href="/settings" />}>
          Back to Settings
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-3 px-4 py-10">
      <LoadingState
        label={`Finishing ${accountTypeLabel(accountType)} connection`}
      />
      <p className="text-center text-sm text-muted-foreground">
        Completing stub OAuth for {accountTypeLabel(accountType)}...
      </p>
    </div>
  )
}
