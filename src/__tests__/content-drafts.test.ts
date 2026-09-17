import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"

import { useContentDrafts } from "@/hooks/use-content-drafts"
import * as contentApi from "@/lib/api/content"
import { ApiClientError } from "@/lib/api/errors"
import type { ContentDraft } from "@/lib/api/types"

vi.mock("@/lib/api/content")

const mockedList = vi.mocked(contentApi.listContentDrafts)
const mockedGetDraft = vi.mocked(contentApi.getContentDraft)

function draft(overrides: Partial<ContentDraft> = {}): ContentDraft {
  return {
    id: "draft-1",
    workspaceId: "ws-1",
    contentRequestId: "req-1",
    generationJobId: "job-1",
    title: "Draft: Spring",
    body: "Body text",
    version: 1,
    provider: "stub",
    promptVersion: "content-v1",
    metadata: {},
    createdAt: "2026-09-16T00:00:00.000Z",
    updatedAt: "2026-09-16T00:00:00.000Z",
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useContentDrafts", () => {
  it("loads the draft list", async () => {
    const drafts = [draft({ id: "d1" }), draft({ id: "d2" })]
    mockedList.mockResolvedValueOnce({ data: drafts, requestId: "r1" })

    const { result } = renderHook(() => useContentDrafts("ws-1"))
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.drafts).toHaveLength(2)
    expect(result.current.error).toBeNull()
  })

  it("shows an empty state when there are no drafts", async () => {
    mockedList.mockResolvedValueOnce({ data: [], requestId: "r1" })

    const { result } = renderHook(() => useContentDrafts("ws-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.drafts).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it("surfaces an auth failure on the list", async () => {
    mockedList.mockRejectedValueOnce(
      new ApiClientError({
        statusCode: 401,
        message: "Missing access token.",
        error: "Unauthorized",
        requestId: "r1",
      })
    )

    const { result } = renderHook(() => useContentDrafts("ws-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.drafts).toEqual([])
    expect(result.current.error).toBe(
      "Your session has expired. Please sign in again."
    )
  })

  it("opens a single draft (detail)", async () => {
    mockedList.mockResolvedValueOnce({ data: [draft({ id: "d1" })], requestId: "r1" })
    mockedGetDraft.mockResolvedValueOnce({
      data: draft({ id: "d1", body: "Full body" }),
      requestId: "r2",
    })

    const { result } = renderHook(() => useContentDrafts("ws-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.selectDraft("d1")
    })

    expect(result.current.selectedDraft?.id).toBe("d1")
    expect(result.current.selectedDraft?.body).toBe("Full body")
  })

  it("reloads the list on demand (refresh persistence)", async () => {
    mockedList.mockResolvedValueOnce({ data: [draft({ id: "d1" })], requestId: "r1" })

    const { result } = renderHook(() => useContentDrafts("ws-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.drafts).toHaveLength(1)

    mockedList.mockResolvedValueOnce({
      data: [draft({ id: "d1" }), draft({ id: "d2" })],
      requestId: "r2",
    })

    act(() => {
      result.current.reload()
    })
    await waitFor(() => expect(result.current.drafts).toHaveLength(2))
  })

  it("clears and reloads drafts when the workspace changes, never leaking across workspaces", async () => {
    const alphaDrafts = [draft({ id: "alpha-1", workspaceId: "ws-1" })]
    const betaDrafts = [draft({ id: "beta-1", workspaceId: "ws-2" })]

    mockedList.mockResolvedValueOnce({ data: alphaDrafts, requestId: "r1" })

    const { result, rerender } = renderHook(
      ({ wsId }: { wsId: string | null }) => useContentDrafts(wsId),
      { initialProps: { wsId: "ws-1" as string | null } }
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.drafts[0]?.id).toBe("alpha-1")

    mockedList.mockResolvedValueOnce({ data: betaDrafts, requestId: "r2" })
    rerender({ wsId: "ws-2" })

    // Alpha's drafts must be cleared immediately; a loading state shows.
    expect(result.current.drafts).toEqual([])
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.drafts).toHaveLength(1)
    expect(result.current.drafts[0]?.id).toBe("beta-1")
    expect(result.current.drafts.every((d: { workspaceId: string }) => d.workspaceId === "ws-2")).toBe(true)
  })
})
