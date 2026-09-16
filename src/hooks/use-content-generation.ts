"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getContentJob, submitContentRequest } from "@/lib/api/content"
import { classifyApiError } from "@/lib/api/error-messages"
import { ApiClientError } from "@/lib/api/errors"
import type {
  ContentJobStatus,
  CreateContentRequestPayload,
} from "@/lib/api/types"

const POLL_INTERVAL_MS = 1200
const POLL_TIMEOUT_MS = 60_000

export type GenerationPhase =
  | "idle"
  | "submitting"
  | "polling"
  | "succeeded"
  | "failed"

export type GenerationState = {
  phase: GenerationPhase
  status: ContentJobStatus | null
  jobId: string | null
  draftId: string | null
  errorCode: string | null
  errorMessage: string | null
  /** True only when the previous attempt was uncertain (safe to reuse the key). */
  canRetry: boolean
}

const INITIAL_STATE: GenerationState = {
  phase: "idle",
  status: null,
  jobId: null,
  draftId: null,
  errorCode: null,
  errorMessage: null,
  canRetry: false,
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Creates one idempotency key per intentional request. */
function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useContentGeneration(
  workspaceId: string | null | undefined,
  onSuccess?: (draftId: string | null) => void
) {
  const [state, setState] = useState<GenerationState>(INITIAL_STATE)
  const [renderedWorkspace, setRenderedWorkspace] = useState(workspaceId)

  const activeWorkspaceRef = useRef(workspaceId)
  const pollTokenRef = useRef(0)
  const busyRef = useRef(false)
  const idempotencyKeyRef = useRef<string | null>(null)
  const lastPayloadRef = useRef<CreateContentRequestPayload | null>(null)
  const onSuccessRef = useRef(onSuccess)

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  // Reset visible state synchronously when the active workspace changes.
  // (Poll cancellation and attempt refs are cleared in the effect below, which
  // runs immediately after this commit.)
  if (workspaceId !== renderedWorkspace) {
    setRenderedWorkspace(workspaceId)
    setState(INITIAL_STATE)
  }

  const startPolling = useCallback((jobId: string, wsId: string) => {
    const token = pollTokenRef.current
    const deadline = Date.now() + POLL_TIMEOUT_MS

    const poll = async () => {
      while (true) {
        if (pollTokenRef.current !== token) return
        if (activeWorkspaceRef.current !== wsId) return

        if (Date.now() > deadline) {
          busyRef.current = false
          setState((prev) => ({
            ...prev,
            phase: "failed",
            errorCode: "timeout",
            errorMessage:
              "Generation is taking longer than expected. Try again.",
            canRetry: true,
          }))
          return
        }

        try {
          const { data } = await getContentJob(jobId)
          if (pollTokenRef.current !== token) return
          if (activeWorkspaceRef.current !== wsId) return

          if (data.status === "succeeded") {
            busyRef.current = false
            setState((prev) => ({
              ...prev,
              phase: "succeeded",
              status: "succeeded",
              jobId: data.id,
              draftId: data.draftId,
              errorCode: null,
              errorMessage: null,
              canRetry: false,
            }))
            onSuccessRef.current?.(data.draftId)
            return
          }

          if (data.status === "failed") {
            busyRef.current = false
            setState((prev) => ({
              ...prev,
              phase: "failed",
              status: "failed",
              jobId: data.id,
              draftId: null,
              errorCode: data.errorCode ?? "generation_failed",
              errorMessage:
                data.errorMessage ?? "Content generation failed. Try again.",
              canRetry: false,
            }))
            return
          }

          // Non-terminal: reflect progress and keep polling.
          setState((prev) => ({
            ...prev,
            phase: "polling",
            status: data.status,
            jobId: data.id,
          }))
        } catch (err) {
          if (pollTokenRef.current !== token) return
          if (activeWorkspaceRef.current !== wsId) return
          const { message, isAuth, isPermission } = classifyApiError(
            err,
            "Lost connection while tracking generation."
          )
          busyRef.current = false
          setState((prev) => ({
            ...prev,
            phase: "failed",
            errorCode: isAuth
              ? "unauthorized"
              : isPermission
                ? "forbidden"
                : "poll_error",
            errorMessage: message,
            canRetry: !isAuth && !isPermission,
          }))
          return
        }

        await sleep(POLL_INTERVAL_MS)
      }
    }

    void poll()
  }, [])

  const runRequest = useCallback(
    async (payload: CreateContentRequestPayload, key: string) => {
      const wsId = activeWorkspaceRef.current
      if (!wsId) return
      if (busyRef.current) return

      busyRef.current = true
      // Cancel any in-flight poll before starting a fresh attempt.
      pollTokenRef.current += 1

      setState({
        phase: "submitting",
        status: "requested",
        jobId: null,
        draftId: null,
        errorCode: null,
        errorMessage: null,
        canRetry: false,
      })

      try {
        const { data } = await submitContentRequest(payload, key)
        if (activeWorkspaceRef.current !== wsId) {
          busyRef.current = false
          return
        }

        const job = data.job
        if (!job) {
          busyRef.current = false
          setState((prev) => ({
            ...prev,
            phase: "failed",
            errorCode: "no_job",
            errorMessage:
              "The request did not start a generation job. Try again.",
            canRetry: true,
          }))
          return
        }

        // Terminal already (synchronous backend): finalize without polling.
        if (job.status === "succeeded") {
          busyRef.current = false
          setState({
            phase: "succeeded",
            status: "succeeded",
            jobId: job.id,
            draftId: job.draftId ?? data.draft?.id ?? null,
            errorCode: null,
            errorMessage: null,
            canRetry: false,
          })
          onSuccessRef.current?.(job.draftId ?? data.draft?.id ?? null)
          return
        }

        if (job.status === "failed") {
          busyRef.current = false
          setState({
            phase: "failed",
            status: "failed",
            jobId: job.id,
            draftId: null,
            errorCode: job.errorCode ?? "generation_failed",
            errorMessage:
              job.errorMessage ?? "Content generation failed. Try again.",
            canRetry: false,
          })
          return
        }

        // Non-terminal: track via the job endpoint.
        setState({
          phase: "polling",
          status: job.status,
          jobId: job.id,
          draftId: null,
          errorCode: null,
          errorMessage: null,
          canRetry: false,
        })
        startPolling(job.id, wsId)
      } catch (err) {
        if (activeWorkspaceRef.current !== wsId) {
          busyRef.current = false
          return
        }
        busyRef.current = false
        const { message, isAuth, isPermission } = classifyApiError(
          err,
          "Failed to submit content request."
        )
        const statusCode = err instanceof ApiClientError ? err.statusCode : 0
        const isValidation = statusCode === 400
        setState({
          phase: "failed",
          status: "failed",
          jobId: null,
          draftId: null,
          errorCode: isValidation
            ? "validation"
            : isAuth
              ? "unauthorized"
              : isPermission
                ? "forbidden"
                : "submit_error",
          errorMessage: message,
          // Reuse the key only for uncertain outcomes (network / server errors).
          canRetry: !isValidation && !isAuth && !isPermission,
        })
      }
    },
    [startPolling]
  )

  // New intentional request: fresh idempotency key.
  const submit = useCallback(
    (payload: CreateContentRequestPayload) => {
      if (busyRef.current) return
      const key = createIdempotencyKey()
      idempotencyKeyRef.current = key
      lastPayloadRef.current = payload
      void runRequest(payload, key)
    },
    [runRequest]
  )

  // Retry the same uncertain request: reuse the stored key.
  const retry = useCallback(() => {
    if (busyRef.current) return
    const key = idempotencyKeyRef.current
    const payload = lastPayloadRef.current
    if (!key || !payload) return
    void runRequest(payload, key)
  }, [runRequest])

  const reset = useCallback(() => {
    pollTokenRef.current += 1
    busyRef.current = false
    idempotencyKeyRef.current = null
    lastPayloadRef.current = null
    setState(INITIAL_STATE)
  }, [])

  // Cancel polling and clear attempt state whenever the active workspace
  // changes or the component unmounts. (No setState here — the render-phase
  // block above resets the visible state.)
  useEffect(() => {
    activeWorkspaceRef.current = workspaceId
    pollTokenRef.current += 1
    busyRef.current = false
    idempotencyKeyRef.current = null
    lastPayloadRef.current = null

    return () => {
      pollTokenRef.current += 1
      busyRef.current = false
    }
  }, [workspaceId])

  const isBusy = state.phase === "submitting" || state.phase === "polling"

  return { ...state, isBusy, submit, retry, reset }
}
