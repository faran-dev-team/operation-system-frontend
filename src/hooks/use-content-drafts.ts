"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getContentDraft, listContentDrafts } from "@/lib/api/content"
import { classifyApiError } from "@/lib/api/error-messages"
import type { ContentDraft } from "@/lib/api/types"

export type DraftsState = {
  drafts: ContentDraft[]
  isLoading: boolean
  error: string | null
  selectedDraft: ContentDraft | null
  isDetailLoading: boolean
  detailError: string | null
}

const INITIAL_STATE: DraftsState = {
  drafts: [],
  isLoading: true,
  error: null,
  selectedDraft: null,
  isDetailLoading: false,
  detailError: null,
}

export function useContentDrafts(workspaceId: string | null | undefined) {
  const [state, setState] = useState<DraftsState>(INITIAL_STATE)
  const [renderedWorkspace, setRenderedWorkspace] = useState(workspaceId)
  const activeWorkspaceRef = useRef(workspaceId)

  // Reset visible state synchronously when the active workspace changes, so a
  // previous workspace's drafts never flash before the new ones load.
  if (workspaceId !== renderedWorkspace) {
    setRenderedWorkspace(workspaceId)
    setState(
      workspaceId ? INITIAL_STATE : { ...INITIAL_STATE, isLoading: false }
    )
  }

  const load = useCallback(async (wsId: string) => {
    try {
      const { data } = await listContentDrafts()
      if (activeWorkspaceRef.current !== wsId) return
      setState((prev) => ({
        ...prev,
        drafts: data,
        isLoading: false,
        error: null,
      }))
    } catch (err) {
      if (activeWorkspaceRef.current !== wsId) return
      const { message } = classifyApiError(err, "Failed to load drafts.")
      setState((prev) => ({
        ...prev,
        drafts: [],
        isLoading: false,
        error: message,
      }))
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
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    void load(workspaceId)
  }, [workspaceId, load])

  const selectDraft = useCallback(
    async (draftId: string) => {
      if (!workspaceId) return
      const wsId = workspaceId
      setState((prev) => ({
        ...prev,
        isDetailLoading: true,
        detailError: null,
      }))
      try {
        const { data } = await getContentDraft(draftId)
        if (activeWorkspaceRef.current !== wsId) return
        setState((prev) => ({
          ...prev,
          selectedDraft: data,
          isDetailLoading: false,
          detailError: null,
        }))
      } catch (err) {
        if (activeWorkspaceRef.current !== wsId) return
        const { message } = classifyApiError(err, "Failed to open draft.")
        setState((prev) => ({
          ...prev,
          selectedDraft: null,
          isDetailLoading: false,
          detailError: message,
        }))
      }
    },
    [workspaceId]
  )

  const clearSelectedDraft = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedDraft: null,
      isDetailLoading: false,
      detailError: null,
    }))
  }, [])

  return { ...state, reload, selectDraft, clearSelectedDraft }
}
