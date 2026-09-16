"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { ApiClientError } from "@/lib/api/errors"
import { getBrandBrief, saveBrandBrief } from "@/lib/api/brand-brief"
import type {
  BrandBriefResponse,
  UpsertBrandBriefPayload,
} from "@/lib/api/types"

export type BrandBriefState = {
  brief: BrandBriefResponse | null
  isLoading: boolean
  isSaving: boolean
  isSaved: boolean
  error: string | null
  validationErrors: string[]
  isNotFound: boolean
}

const INITIAL_STATE: BrandBriefState = {
  brief: null,
  isLoading: true,
  isSaving: false,
  isSaved: false,
  error: null,
  validationErrors: [],
  isNotFound: false,
}

export function useBrandBrief(workspaceId: string | null | undefined) {
  const [state, setState] = useState<BrandBriefState>(INITIAL_STATE)
  const activeWorkspaceRef = useRef(workspaceId)

  const load = useCallback(async (wsId: string) => {
    setState((prev) => ({
      ...INITIAL_STATE,
      isLoading: true,
      brief: prev.brief && activeWorkspaceRef.current === wsId ? prev.brief : null,
    }))

    try {
      const { data } = await getBrandBrief()
      if (activeWorkspaceRef.current !== wsId) return
      setState({
        brief: data,
        isLoading: false,
        isSaving: false,
        isSaved: false,
        error: null,
        validationErrors: [],
        isNotFound: false,
      })
    } catch (err) {
      if (activeWorkspaceRef.current !== wsId) return

      if (err instanceof ApiClientError && err.statusCode === 404) {
        setState({
          ...INITIAL_STATE,
          isLoading: false,
          isNotFound: true,
        })
        return
      }

      if (err instanceof ApiClientError && err.statusCode === 401) {
        setState({
          ...INITIAL_STATE,
          isLoading: false,
          error: "Your session has expired. Please sign in again.",
        })
        return
      }

      if (err instanceof ApiClientError && err.statusCode === 403) {
        setState({
          ...INITIAL_STATE,
          isLoading: false,
          error: "You do not have permission to view this brand brief.",
        })
        return
      }

      setState({
        ...INITIAL_STATE,
        isLoading: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to load brand brief. Try again.",
      })
    }
  }, [])

  useEffect(() => {
    activeWorkspaceRef.current = workspaceId

    if (!workspaceId) {
      setState(INITIAL_STATE)
      return
    }

    setState(INITIAL_STATE)
    void load(workspaceId)
  }, [workspaceId, load])

  const save = useCallback(
    async (payload: UpsertBrandBriefPayload) => {
      if (state.isSaving || !workspaceId) return

      setState((prev) => ({
        ...prev,
        isSaving: true,
        isSaved: false,
        error: null,
        validationErrors: [],
      }))

      try {
        const { data } = await saveBrandBrief(payload)
        if (activeWorkspaceRef.current !== workspaceId) return
        setState((prev) => ({
          ...prev,
          brief: data,
          isSaving: false,
          isSaved: true,
          isNotFound: false,
          error: null,
          validationErrors: [],
        }))
      } catch (err) {
        if (activeWorkspaceRef.current !== workspaceId) return

        if (err instanceof ApiClientError && err.statusCode === 400) {
          const messages = Array.isArray(err.body.message)
            ? err.body.message
            : [err.body.message]
          setState((prev) => ({
            ...prev,
            isSaving: false,
            validationErrors: messages,
          }))
          return
        }

        if (err instanceof ApiClientError && err.statusCode === 401) {
          setState((prev) => ({
            ...prev,
            isSaving: false,
            error: "Your session has expired. Please sign in again.",
          }))
          return
        }

        if (err instanceof ApiClientError && err.statusCode === 403) {
          setState((prev) => ({
            ...prev,
            isSaving: false,
            error: "You do not have permission to edit this brand brief.",
          }))
          return
        }

        setState((prev) => ({
          ...prev,
          isSaving: false,
          error:
            err instanceof Error
              ? err.message
              : "Failed to save brand brief. Try again.",
        }))
      }
    },
    [state.isSaving, workspaceId]
  )

  const reload = useCallback(() => {
    if (workspaceId) {
      void load(workspaceId)
    }
  }, [workspaceId, load])

  return { ...state, save, reload }
}
