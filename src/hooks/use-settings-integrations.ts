"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { classifyApiError } from "@/lib/api/error-messages"
import { getProvidersHealth } from "@/lib/api/providers"
import { listSocialConnections } from "@/lib/api/social"
import type {
  ProvidersHealthResponse,
  SocialConnection,
} from "@/lib/api/types"

export type SettingsIntegrationsState = {
  providersHealth: ProvidersHealthResponse | null
  connections: SocialConnection[]
  isLoading: boolean
  error: string | null
  isAuthError: boolean
}

const INITIAL: SettingsIntegrationsState = {
  providersHealth: null,
  connections: [],
  isLoading: true,
  error: null,
  isAuthError: false,
}

const NO_WORKSPACE: SettingsIntegrationsState = {
  providersHealth: null,
  connections: [],
  isLoading: false,
  error: "No active workspace. Sign in again.",
  isAuthError: true,
}

export function useSettingsIntegrations(workspaceId: string | null | undefined) {
  const [state, setState] = useState<SettingsIntegrationsState>(
    workspaceId ? INITIAL : NO_WORKSPACE
  )
  const [renderedWorkspace, setRenderedWorkspace] = useState(workspaceId)
  const activeWorkspaceRef = useRef(workspaceId)

  // Reset synchronously on workspace change so prior workspace data never flashes.
  if (workspaceId !== renderedWorkspace) {
    setRenderedWorkspace(workspaceId)
    setState(workspaceId ? INITIAL : NO_WORKSPACE)
  }

  const load = useCallback(async (wsId: string) => {
    try {
      const [providersResult, connectionsResult] = await Promise.all([
        getProvidersHealth(),
        listSocialConnections(),
      ])

      if (activeWorkspaceRef.current !== wsId) return

      setState({
        providersHealth: providersResult.data,
        connections: connectionsResult.data,
        isLoading: false,
        error: null,
        isAuthError: false,
      })
    } catch (err) {
      if (activeWorkspaceRef.current !== wsId) return
      const classified = classifyApiError(
        err,
        "Could not load provider or channel status."
      )
      setState({
        providersHealth: null,
        connections: [],
        isLoading: false,
        error: classified.message,
        isAuthError: classified.isAuth,
      })
    }
  }, [])

  useEffect(() => {
    activeWorkspaceRef.current = workspaceId
    if (!workspaceId) return
    void (async () => {
      await load(workspaceId)
    })()
  }, [workspaceId, load])

  const reload = useCallback(() => {
    if (!workspaceId) return
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      isAuthError: false,
    }))
    void load(workspaceId)
  }, [workspaceId, load])

  return {
    ...state,
    reload,
  }
}
