"use client"

import { Suspense } from "react"

import { LoadingState } from "@/components/shared/loading-state"
import { StubOAuthComplete } from "@/components/settings/stub-oauth-complete"

/** Reconnect stub redirects here (`/social/callback`). Same complete flow as `/social/oauth/stub`. */
export default function SocialCallbackPage() {
  return (
    <Suspense fallback={<LoadingState label="Preparing channel connection" />}>
      <StubOAuthComplete />
    </Suspense>
  )
}
