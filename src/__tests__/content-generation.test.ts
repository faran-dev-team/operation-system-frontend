import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"

import { useContentGeneration } from "@/hooks/use-content-generation"
import * as contentApi from "@/lib/api/content"
import { ApiClientError } from "@/lib/api/errors"
import type { ContentJob, SubmitContentResponse } from "@/lib/api/types"

vi.mock("@/lib/api/content")

const mockedSubmit = vi.mocked(contentApi.submitContentRequest)
const mockedGetJob = vi.mocked(contentApi.getContentJob)

function job(overrides: Partial<ContentJob> = {}): ContentJob {
  return {
    id: "job-1",
    workspaceId: "ws-1",
    contentRequestId: "req-1",
    status: "succeeded",
    provider: "stub",
    promptVersion: "content-v1",
    errorCode: null,
    errorMessage: null,
    startedAt: "2026-09-16T00:00:00.000Z",
    completedAt: "2026-09-16T00:00:01.000Z",
    usageMetadata: null,
    draftId: "draft-1",
    createdAt: "2026-09-16T00:00:00.000Z",
    updatedAt: "2026-09-16T00:00:01.000Z",
    ...overrides,
  }
}

function submitResponse(
  overrides: Partial<SubmitContentResponse> = {}
): SubmitContentResponse {
  return {
    request: {
      id: "req-1",
      workspaceId: "ws-1",
      createdByUserId: "user-1",
      status: "succeeded",
      input: { topic: "Spring" },
      idempotencyKey: "key-1",
      createdAt: "2026-09-16T00:00:00.000Z",
    },
    job: job(),
    draft: {
      id: "draft-1",
      workspaceId: "ws-1",
      contentRequestId: "req-1",
      generationJobId: "job-1",
      title: "Draft: Spring",
      body: "Body",
      version: 1,
      provider: "stub",
      promptVersion: "content-v1",
      metadata: {},
      createdAt: "2026-09-16T00:00:00.000Z",
      updatedAt: "2026-09-16T00:00:00.000Z",
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useContentGeneration", () => {
  it("submits a request and finalizes on a synchronous succeeded job", async () => {
    mockedSubmit.mockResolvedValueOnce({ data: submitResponse(), requestId: "r1" })
    const onSuccess = vi.fn()

    const { result } = renderHook(() => useContentGeneration("ws-1", onSuccess))

    await act(async () => {
      result.current.submit({ topic: "Spring" })
    })

    await waitFor(() => expect(result.current.phase).toBe("succeeded"))
    expect(result.current.draftId).toBe("draft-1")
    expect(onSuccess).toHaveBeenCalledWith("draft-1")
    expect(mockedSubmit).toHaveBeenCalledTimes(1)
    // An idempotency key was generated and sent.
    expect(typeof mockedSubmit.mock.calls[0][1]).toBe("string")
    expect(mockedSubmit.mock.calls[0][1].length).toBeGreaterThan(0)
  })

  it("generates a distinct idempotency key for each intentional request", async () => {
    mockedSubmit.mockResolvedValue({ data: submitResponse(), requestId: "r1" })

    const { result } = renderHook(() => useContentGeneration("ws-1"))

    await act(async () => {
      result.current.submit({ topic: "First" })
    })
    await waitFor(() => expect(result.current.phase).toBe("succeeded"))

    await act(async () => {
      result.current.submit({ topic: "Second" })
    })
    await waitFor(() => expect(mockedSubmit).toHaveBeenCalledTimes(2))

    const firstKey = mockedSubmit.mock.calls[0][1]
    const secondKey = mockedSubmit.mock.calls[1][1]
    expect(firstKey).not.toBe(secondKey)
  })

  it("prevents duplicate submissions while a request is active", async () => {
    let resolveSubmit: (v: { data: SubmitContentResponse; requestId: string }) => void
    mockedSubmit.mockImplementationOnce(
      () => new Promise((resolve) => (resolveSubmit = resolve))
    )

    const { result } = renderHook(() => useContentGeneration("ws-1"))

    act(() => {
      result.current.submit({ topic: "Spring" })
    })
    await waitFor(() => expect(result.current.phase).toBe("submitting"))

    // Second submit while busy is ignored.
    act(() => {
      result.current.submit({ topic: "Spring again" })
    })
    expect(mockedSubmit).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveSubmit!({ data: submitResponse(), requestId: "r1" })
    })
    await waitFor(() => expect(result.current.phase).toBe("succeeded"))
  })

  it("reuses the same idempotency key when retrying an uncertain request", async () => {
    // First attempt: network error (uncertain).
    mockedSubmit.mockRejectedValueOnce(
      new ApiClientError({
        statusCode: 0,
        message: "Cannot reach the API.",
        error: "NetworkError",
        requestId: "r1",
      })
    )

    const { result } = renderHook(() => useContentGeneration("ws-1"))

    await act(async () => {
      result.current.submit({ topic: "Spring" })
    })
    await waitFor(() => expect(result.current.phase).toBe("failed"))
    expect(result.current.canRetry).toBe(true)
    const firstKey = mockedSubmit.mock.calls[0][1]

    // Retry succeeds and must reuse the same key.
    mockedSubmit.mockResolvedValueOnce({ data: submitResponse(), requestId: "r2" })
    await act(async () => {
      result.current.retry()
    })
    await waitFor(() => expect(result.current.phase).toBe("succeeded"))

    const retryKey = mockedSubmit.mock.calls[1][1]
    expect(retryKey).toBe(firstKey)
  })

  it("shows a safe failure message for a confirmed failed job and does not allow same-key retry", async () => {
    mockedSubmit.mockResolvedValueOnce({
      data: submitResponse({
        job: job({
          status: "failed",
          errorCode: "provider_timeout",
          errorMessage: "DeepSeek request timed out.",
          draftId: null,
        }),
        draft: null,
      }),
      requestId: "r1",
    })

    const { result } = renderHook(() => useContentGeneration("ws-1"))

    await act(async () => {
      result.current.submit({ topic: "Will fail" })
    })
    await waitFor(() => expect(result.current.phase).toBe("failed"))

    expect(result.current.status).toBe("failed")
    expect(result.current.errorCode).toBe("provider_timeout")
    expect(result.current.errorMessage).toBe("DeepSeek request timed out.")
    expect(result.current.canRetry).toBe(false)
    expect(result.current.draftId).toBeNull()
  })

  it("tracks job states by polling requested -> running -> succeeded", async () => {
    vi.useFakeTimers()
    try {
      mockedSubmit.mockResolvedValueOnce({
        data: submitResponse({
          job: job({ status: "requested", draftId: null }),
          draft: null,
        }),
        requestId: "r1",
      })
      mockedGetJob
        .mockResolvedValueOnce({
          data: job({ status: "running", draftId: null }),
          requestId: "p1",
        })
        .mockResolvedValueOnce({
          data: job({ status: "succeeded", draftId: "draft-1" }),
          requestId: "p2",
        })

      const onSuccess = vi.fn()
      const { result } = renderHook(() =>
        useContentGeneration("ws-1", onSuccess)
      )

      await act(async () => {
        result.current.submit({ topic: "Spring" })
        await vi.advanceTimersByTimeAsync(0)
      })
      // After submit + first immediate poll, status is running.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(result.current.status).toBe("running")
      expect(result.current.phase).toBe("polling")

      // Next poll cycle reaches succeeded.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1300)
      })
      expect(result.current.phase).toBe("succeeded")
      expect(result.current.draftId).toBe("draft-1")
      expect(onSuccess).toHaveBeenCalledWith("draft-1")
    } finally {
      vi.useRealTimers()
    }
  })

  it("stops polling on unmount (no state updates after unmount)", async () => {
    vi.useFakeTimers()
    try {
      mockedSubmit.mockResolvedValueOnce({
        data: submitResponse({
          job: job({ status: "requested", draftId: null }),
          draft: null,
        }),
        requestId: "r1",
      })
      mockedGetJob.mockResolvedValue({
        data: job({ status: "running", draftId: null }),
        requestId: "p1",
      })

      const { result, unmount } = renderHook(() =>
        useContentGeneration("ws-1")
      )

      await act(async () => {
        result.current.submit({ topic: "Spring" })
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(result.current.phase).toBe("polling")

      unmount()
      const callsAfterUnmount = mockedGetJob.mock.calls.length

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000)
      })
      // No further polling happened after unmount.
      expect(mockedGetJob.mock.calls.length).toBe(callsAfterUnmount)
    } finally {
      vi.useRealTimers()
    }
  })

  it("resets generation state when the workspace changes", async () => {
    mockedSubmit.mockResolvedValueOnce({ data: submitResponse(), requestId: "r1" })

    const { result, rerender } = renderHook(
      ({ wsId }: { wsId: string | null }) => useContentGeneration(wsId),
      { initialProps: { wsId: "ws-1" as string | null } }
    )

    await act(async () => {
      result.current.submit({ topic: "Spring" })
    })
    await waitFor(() => expect(result.current.phase).toBe("succeeded"))

    rerender({ wsId: "ws-2" })
    expect(result.current.phase).toBe("idle")
    expect(result.current.draftId).toBeNull()
    expect(result.current.status).toBeNull()
  })
})
