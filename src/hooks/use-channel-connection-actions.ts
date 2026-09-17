"use client"

import { useCallback, useState } from "react"

import { classifyApiError } from "@/lib/api/error-messages"
import {
  disconnectSocialConnection,
  reconnectSocialConnection,
  startSocialOAuth,
} from "@/lib/api/social"
import type { SocialAccountType } from "@/lib/api/types"

function stubRedirectUri() {
  if (typeof window === "undefined") return ""
  return `${window.location.origin}/social/oauth/stub`
}

export function useChannelConnectionActions(options: {
  canMutate: boolean
  onChanged: () => void
}) {
  const { canMutate, onChanged } = options
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const run = useCallback(
    async (key: string, work: () => Promise<void>, refresh = true) => {
      if (!canMutate) {
        setActionError(
          "Only operators and administrators can manage channel connections."
        )
        return
      }
      setBusyKey(key)
      setActionError(null)
      try {
        await work()
        if (refresh) onChanged()
      } catch (err) {
        const classified = classifyApiError(
          err,
          "Could not update this channel connection."
        )
        setActionError(classified.message)
      } finally {
        setBusyKey(null)
      }
    },
    [canMutate, onChanged]
  )

  const connect = useCallback(
    (accountType: SocialAccountType | string) =>
      run(
        `connect:${accountType}`,
        async () => {
          const redirectUri = stubRedirectUri()
          const { data } = await startSocialOAuth(accountType, redirectUri)
          window.location.assign(data.url)
        },
        false
      ),
    [run]
  )

  const disconnect = useCallback(
    (connectionId: string) =>
      run(`disconnect:${connectionId}`, async () => {
        await disconnectSocialConnection(connectionId)
      }),
    [run]
  )

  const reconnect = useCallback(
    (connectionId: string) =>
      run(
        `reconnect:${connectionId}`,
        async () => {
          const { data } = await reconnectSocialConnection(connectionId)
          window.location.assign(data.url)
        },
        false
      ),
    [run]
  )

  return {
    busyKey,
    actionError,
    connect,
    disconnect,
    reconnect,
  }
}
