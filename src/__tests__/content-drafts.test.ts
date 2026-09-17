import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"

import { useContentDrafts } from "@/hooks/use-content-drafts"
import * as contentApi from "@/lib/api/content"
import { ApiClientError } from "@/lib/api/errors"
import type { ContentDraft } from "@/lib/api/types"

vi.mock("@/lib/api/content")

const mockedList = vi.mocked(contentApi.listContentDrafts)
const mockedGetDraft = vi.mocked(contentApi.getContentDraft)
const mockedUpdateDraft = vi.mocked(contentApi.updateContentDraft)

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

describe("useContentDrafts – draft editing", () => {
  it("starts editing with the draft's current body and version visible", async () => {
    mockedList.mockResolvedValueOnce({
      data: [draft({ id: "d1", body: "Original", version: 2 })],
      requestId: "r1",
    })
    mockedGetDraft.mockResolvedValueOnce({
      data: draft({ id: "d1", body: "Original", version: 2 }),
      requestId: "r2",
    })

    const { result } = renderHook(() => useContentDrafts("ws-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.selectDraft("d1")
    })

    act(() => {
      result.current.startEditingDraft()
    })

    expect(result.current.isEditingDraft).toBe(true)
    expect(result.current.editDraftValue).toBe("Original")
    expect(result.current.selectedDraft?.version).toBe(2)
  })

  it("saves the edit, replaces local data with the server response (operator/admin)", async () => {
    mockedList.mockResolvedValueOnce({
      data: [draft({ id: "d1", body: "Original", version: 2 })],
      requestId: "r1",
    })
    mockedGetDraft.mockResolvedValueOnce({
      data: draft({ id: "d1", body: "Original", version: 2 }),
      requestId: "r2",
    })
    mockedUpdateDraft.mockResolvedValueOnce({
      data: draft({ id: "d1", body: "Updated body", version: 3 }),
      requestId: "r3",
    })

    const { result } = renderHook(() => useContentDrafts("ws-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.selectDraft("d1")
    })
    act(() => result.current.startEditingDraft())
    act(() => result.current.setEditDraftValue("Updated body"))

    await act(async () => {
      await result.current.saveEditingDraft()
    })

    expect(mockedUpdateDraft).toHaveBeenCalledWith("d1", {
      content: "Updated body",
      expectedVersion: 2,
    })
    expect(result.current.selectedDraft?.body).toBe("Updated body")
    expect(result.current.selectedDraft?.version).toBe(3)
    expect(result.current.drafts[0]?.version).toBe(3)
    expect(result.current.isEditingDraft).toBe(false)
    expect(result.current.draftEditSaved).toBe(true)
  })

  it("cancel restores view mode with the original value and never calls the API", async () => {
    mockedList.mockResolvedValueOnce({
      data: [draft({ id: "d1", body: "Original" })],
      requestId: "r1",
    })
    mockedGetDraft.mockResolvedValueOnce({
      data: draft({ id: "d1", body: "Original" }),
      requestId: "r2",
    })

    const { result } = renderHook(() => useContentDrafts("ws-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.selectDraft("d1")
    })
    act(() => result.current.startEditingDraft())
    act(() => result.current.setEditDraftValue("Something else entirely"))

    act(() => result.current.cancelEditingDraft())

    expect(result.current.isEditingDraft).toBe(false)
    expect(result.current.editDraftValue).toBe("")
    expect(result.current.selectedDraft?.body).toBe("Original")
    expect(mockedUpdateDraft).not.toHaveBeenCalled()
  })

  it("prevents duplicate save requests while one is already in flight", async () => {
    mockedList.mockResolvedValueOnce({ data: [draft({ id: "d1" })], requestId: "r1" })
    mockedGetDraft.mockResolvedValueOnce({ data: draft({ id: "d1" }), requestId: "r2" })

    let resolveSave: (v: { data: ContentDraft; requestId: string }) => void
    mockedUpdateDraft.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve
        })
    )

    const { result } = renderHook(() => useContentDrafts("ws-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.selectDraft("d1")
    })
    act(() => result.current.startEditingDraft())
    act(() => result.current.setEditDraftValue("First edit"))

    act(() => {
      void result.current.saveEditingDraft()
    })
    await waitFor(() => expect(result.current.isSavingDraftEdit).toBe(true))

    // A second attempt while the first is pending must be a no-op.
    await act(async () => {
      await result.current.saveEditingDraft()
    })
    expect(mockedUpdateDraft).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveSave!({
        data: draft({ id: "d1", body: "First edit", version: 2 }),
        requestId: "r3",
      })
    })
    await waitFor(() => expect(result.current.isSavingDraftEdit).toBe(false))
  })

  it("returns the conflict message on 409 and supports Reload to fetch the latest version", async () => {
    mockedList.mockResolvedValueOnce({ data: [draft({ id: "d1", version: 1 })], requestId: "r1" })
    mockedGetDraft.mockResolvedValueOnce({
      data: draft({ id: "d1", version: 1 }),
      requestId: "r2",
    })
    mockedUpdateDraft.mockRejectedValueOnce(
      new ApiClientError({
        statusCode: 409,
        message: "Draft version is stale.",
        error: "Conflict",
        requestId: "r3",
      })
    )

    const { result } = renderHook(() => useContentDrafts("ws-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.selectDraft("d1")
    })
    act(() => result.current.startEditingDraft())
    act(() => result.current.setEditDraftValue("Stale edit"))

    await act(async () => {
      await result.current.saveEditingDraft()
    })

    expect(result.current.draftEditConflict).toBe(true)
    expect(result.current.draftEditError).toBe(
      "This draft was updated elsewhere. Reload the latest version before saving."
    )

    mockedGetDraft.mockResolvedValueOnce({
      data: draft({ id: "d1", version: 2, body: "Someone else's edit" }),
      requestId: "r4",
    })
    await act(async () => {
      await result.current.reloadAfterConflict()
    })

    expect(result.current.selectedDraft?.version).toBe(2)
    expect(result.current.selectedDraft?.body).toBe("Someone else's edit")
    expect(result.current.draftEditConflict).toBe(false)
    expect(result.current.isEditingDraft).toBe(false)
  })

  it("clears edit state when a different draft is selected", async () => {
    mockedList.mockResolvedValueOnce({
      data: [draft({ id: "d1" }), draft({ id: "d2" })],
      requestId: "r1",
    })
    mockedGetDraft.mockResolvedValueOnce({ data: draft({ id: "d1" }), requestId: "r2" })

    const { result } = renderHook(() => useContentDrafts("ws-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.selectDraft("d1")
    })
    act(() => result.current.startEditingDraft())
    act(() => result.current.setEditDraftValue("In progress edit"))
    expect(result.current.isEditingDraft).toBe(true)

    mockedGetDraft.mockResolvedValueOnce({ data: draft({ id: "d2" }), requestId: "r3" })
    await act(async () => {
      await result.current.selectDraft("d2")
    })

    expect(result.current.isEditingDraft).toBe(false)
    expect(result.current.editDraftValue).toBe("")
    expect(result.current.selectedDraft?.id).toBe("d2")
  })

  it("clears edit state when the active workspace changes", async () => {
    mockedList.mockResolvedValueOnce({
      data: [draft({ id: "d1", workspaceId: "ws-1" })],
      requestId: "r1",
    })
    mockedGetDraft.mockResolvedValueOnce({
      data: draft({ id: "d1", workspaceId: "ws-1" }),
      requestId: "r2",
    })

    const { result, rerender } = renderHook(
      ({ wsId }: { wsId: string | null }) => useContentDrafts(wsId),
      { initialProps: { wsId: "ws-1" as string | null } }
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.selectDraft("d1")
    })
    act(() => result.current.startEditingDraft())
    act(() => result.current.setEditDraftValue("In progress edit"))
    expect(result.current.isEditingDraft).toBe(true)

    mockedList.mockResolvedValueOnce({ data: [], requestId: "r3" })
    rerender({ wsId: "ws-2" })

    expect(result.current.isEditingDraft).toBe(false)
    expect(result.current.editDraftValue).toBe("")
    expect(result.current.selectedDraft).toBeNull()
  })

  it("persists the saved content across a remount (simulated refresh)", async () => {
    mockedList.mockResolvedValueOnce({
      data: [draft({ id: "d1", body: "Original", version: 1 })],
      requestId: "r1",
    })
    mockedGetDraft.mockResolvedValueOnce({
      data: draft({ id: "d1", body: "Original", version: 1 }),
      requestId: "r2",
    })
    mockedUpdateDraft.mockResolvedValueOnce({
      data: draft({ id: "d1", body: "Saved forever", version: 2 }),
      requestId: "r3",
    })

    const { result, unmount } = renderHook(() => useContentDrafts("ws-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.selectDraft("d1")
    })
    act(() => result.current.startEditingDraft())
    act(() => result.current.setEditDraftValue("Saved forever"))
    await act(async () => {
      await result.current.saveEditingDraft()
    })
    expect(result.current.selectedDraft?.body).toBe("Saved forever")

    unmount()

    // Simulate a browser refresh: a fresh mount re-fetches from the server,
    // which now returns the persisted value. There is no client-side cache
    // to go stale.
    mockedList.mockResolvedValueOnce({
      data: [draft({ id: "d1", body: "Saved forever", version: 2 })],
      requestId: "r4",
    })
    mockedGetDraft.mockResolvedValueOnce({
      data: draft({ id: "d1", body: "Saved forever", version: 2 }),
      requestId: "r5",
    })

    const { result: fresh } = renderHook(() => useContentDrafts("ws-1"))
    await waitFor(() => expect(fresh.current.isLoading).toBe(false))
    expect(fresh.current.drafts[0]?.body).toBe("Saved forever")

    await act(async () => {
      await fresh.current.selectDraft("d1")
    })
    expect(fresh.current.selectedDraft?.body).toBe("Saved forever")
    expect(fresh.current.selectedDraft?.version).toBe(2)
  })
})
