"use client"

import { Suspense } from "react"

import { LoadingState } from "@/components/shared/loading-state"
import { StubOAuthComplete } from "@/components/settings/stub-oauth-complete"

export default function StubSocialOAuthPage() {
  return (
    <Suspense fallback={<LoadingState label="Preparing channel connection" />}>
      <StubOAuthComplete />
    </Suspense>
  )
}
