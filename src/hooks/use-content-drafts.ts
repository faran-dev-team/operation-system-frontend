"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  getContentDraft,
  listContentDrafts,
  updateContentDraft,
} from "@/lib/api/content"
import { classifyApiError } from "@/lib/api/error-messages"
import { ApiClientError } from "@/lib/api/errors"
import type { ContentDraft } from "@/lib/api/types"

const DRAFT_CONFLICT_MESSAGE =
  "This draft was updated elsewhere. Reload the latest version before saving."

export type DraftsState = {
  drafts: ContentDraft[]
  isLoading: boolean
  error: string | null
  selectedDraft: ContentDraft | null
  isDetailLoading: boolean
  detailError: string | null
  isEditingDraft: boolean
  editDraftValue: string
  isSavingDraftEdit: boolean
  draftEditError: string | null
  draftEditConflict: boolean
  draftEditSaved: boolean
}

const INITIAL_STATE: DraftsState = {
  drafts: [],
  isLoading: true,
  error: null,
  selectedDraft: null,
  isDetailLoading: false,
  detailError: null,
  isEditingDraft: false,
  editDraftValue: "",
  isSavingDraftEdit: false,
  draftEditError: null,
  draftEditConflict: false,
  draftEditSaved: false,
}

/** Clears every draft-editing field; used whenever the selected draft changes. */
const RESET_EDIT_FIELDS = {
  isEditingDraft: false,
  editDraftValue: "",
  isSavingDraftEdit: false,
  draftEditError: null,
  draftEditConflict: false,
  draftEditSaved: false,
} as const

export function useContentDrafts(workspaceId: string | null | undefined) {
  const [state, setState] = useState<DraftsState>(INITIAL_STATE)
  const [renderedWorkspace, setRenderedWorkspace] = useState(workspaceId)
  const activeWorkspaceRef = useRef(workspaceId)

  // Reset visible state synchronously when the active workspace changes, so a
  // previous workspace's drafts (and any in-progress edit) never leak into
  // the newly selected workspace.
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
        ...RESET_EDIT_FIELDS,
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
      ...RESET_EDIT_FIELDS,
    }))
  }, [])

  const startEditingDraft = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedDraft) return prev
      return {
        ...prev,
        isEditingDraft: true,
        editDraftValue: prev.selectedDraft.body,
        draftEditError: null,
        draftEditConflict: false,
        draftEditSaved: false,
      }
    })
  }, [])

  const setEditDraftValue = useCallback((value: string) => {
    setState((prev) => ({ ...prev, editDraftValue: value }))
  }, [])

  const cancelEditingDraft = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isEditingDraft: false,
      editDraftValue: "",
      draftEditError: null,
      draftEditConflict: false,
    }))
  }, [])

  const saveEditingDraft = useCallback(async () => {
    if (state.isSavingDraftEdit) return
    const draft = state.selectedDraft
    if (!draft || !workspaceId) return

    const content = state.editDraftValue.trim()
    if (!content) {
      setState((prev) => ({ ...prev, draftEditError: "Content is required." }))
      return
    }

    const wsId = workspaceId
    setState((prev) => ({
      ...prev,
      isSavingDraftEdit: true,
      draftEditError: null,
      draftEditConflict: false,
    }))

    try {
      const { data } = await updateContentDraft(draft.id, {
        content,
        expectedVersion: draft.version,
      })
      if (activeWorkspaceRef.current !== wsId) return
      setState((prev) => ({
        ...prev,
        selectedDraft: data,
        drafts: prev.drafts.map((item) => (item.id === data.id ? data : item)),
        isEditingDraft: false,
        editDraftValue: "",
        isSavingDraftEdit: false,
        draftEditError: null,
        draftEditConflict: false,
        draftEditSaved: true,
      }))
    } catch (err) {
      if (activeWorkspaceRef.current !== wsId) return

      if (err instanceof ApiClientError && err.statusCode === 409) {
        setState((prev) => ({
          ...prev,
          isSavingDraftEdit: false,
          draftEditConflict: true,
          draftEditError: DRAFT_CONFLICT_MESSAGE,
        }))
        return
      }

      const { message } = classifyApiError(err, "Failed to save draft.")
      setState((prev) => ({
        ...prev,
        isSavingDraftEdit: false,
        draftEditError: message,
      }))
    }
  }, [state.isSavingDraftEdit, state.selectedDraft, state.editDraftValue, workspaceId])

  const reloadAfterConflict = useCallback(async () => {
    const draft = state.selectedDraft
    if (!draft || !workspaceId) return
    const wsId = workspaceId

    setState((prev) => ({ ...prev, isDetailLoading: true }))
    try {
      const { data } = await getContentDraft(draft.id)
      if (activeWorkspaceRef.current !== wsId) return
      setState((prev) => ({
        ...prev,
        selectedDraft: data,
        drafts: prev.drafts.map((item) => (item.id === data.id ? data : item)),
        isDetailLoading: false,
        ...RESET_EDIT_FIELDS,
      }))
    } catch (err) {
      if (activeWorkspaceRef.current !== wsId) return
      const { message } = classifyApiError(err, "Failed to reload draft.")
      setState((prev) => ({
        ...prev,
        isDetailLoading: false,
        detailError: message,
      }))
    }
  }, [state.selectedDraft, workspaceId])

  return {
    ...state,
    reload,
    selectDraft,
    clearSelectedDraft,
    startEditingDraft,
    setEditDraftValue,
    cancelEditingDraft,
    saveEditingDraft,
    reloadAfterConflict,
  }
}
