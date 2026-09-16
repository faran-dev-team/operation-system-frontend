import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"

import { useBrandBrief } from "@/hooks/use-brand-brief"
import * as brandBriefApi from "@/lib/api/brand-brief"
import { ApiClientError } from "@/lib/api/errors"
import type { BrandBriefResponse } from "@/lib/api/types"

vi.mock("@/lib/api/brand-brief")
vi.mock("@/lib/auth/session", () => ({
  getAccessToken: () => "test-token",
  getWorkspaceId: () => "ws-1",
}))

const MOCK_BRIEF: BrandBriefResponse = {
  id: "brief-1",
  workspaceId: "ws-1",
  name: "Test Brand",
  tone: "friendly",
  approvedFacts: "We ship fast.",
  prohibitedClaims: "No guarantees.",
  createdAt: "2026-09-15T00:00:00.000Z",
  updatedAt: "2026-09-15T12:00:00.000Z",
}

const mockedGet = vi.mocked(brandBriefApi.getBrandBrief)
const mockedSave = vi.mocked(brandBriefApi.saveBrandBrief)

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useBrandBrief", () => {
  it("loads an existing brief", async () => {
    mockedGet.mockResolvedValueOnce({
      data: MOCK_BRIEF,
      requestId: "req-1",
    })

    const { result } = renderHook(() => useBrandBrief("ws-1"))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.brief).toEqual(MOCK_BRIEF)
    expect(result.current.error).toBeNull()
    expect(result.current.isNotFound).toBe(false)
  })

  it("displays empty state when no brief exists (404)", async () => {
    mockedGet.mockRejectedValueOnce(
      new ApiClientError({
        statusCode: 404,
        message: "Brand brief was not found for this workspace.",
        error: "Not Found",
        requestId: "req-2",
      })
    )

    const { result } = renderHook(() => useBrandBrief("ws-1"))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.brief).toBeNull()
    expect(result.current.isNotFound).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it("saves a valid brief", async () => {
    mockedGet.mockResolvedValueOnce({
      data: MOCK_BRIEF,
      requestId: "req-1",
    })

    const updatedBrief = {
      ...MOCK_BRIEF,
      name: "Updated Brand",
      updatedAt: "2026-09-16T00:00:00.000Z",
    }
    mockedSave.mockResolvedValueOnce({
      data: updatedBrief,
      requestId: "req-3",
    })

    const { result } = renderHook(() => useBrandBrief("ws-1"))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.save({ name: "Updated Brand" })
    })

    expect(result.current.brief).toEqual(updatedBrief)
    expect(result.current.isSaved).toBe(true)
    expect(result.current.isSaving).toBe(false)
  })

  it("displays backend validation errors", async () => {
    mockedGet.mockResolvedValueOnce({
      data: MOCK_BRIEF,
      requestId: "req-1",
    })

    mockedSave.mockRejectedValueOnce(
      new ApiClientError({
        statusCode: 400,
        message: ["name must be a string", "name should not be empty"],
        error: "Bad Request",
        requestId: "req-4",
      })
    )

    const { result } = renderHook(() => useBrandBrief("ws-1"))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.save({ name: "" })
    })

    expect(result.current.validationErrors).toEqual([
      "name must be a string",
      "name should not be empty",
    ])
    expect(result.current.isSaving).toBe(false)
  })

  it("prevents duplicate saves while one is in progress", async () => {
    mockedGet.mockResolvedValueOnce({
      data: MOCK_BRIEF,
      requestId: "req-1",
    })

    let resolveSave: (value: { data: BrandBriefResponse; requestId: string }) => void
    mockedSave.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve
        })
    )

    const { result } = renderHook(() => useBrandBrief("ws-1"))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // First save starts
    act(() => {
      void result.current.save({ name: "Brand A" })
    })

    await waitFor(() => {
      expect(result.current.isSaving).toBe(true)
    })

    // Second save should be a no-op
    await act(async () => {
      await result.current.save({ name: "Brand B" })
    })

    expect(mockedSave).toHaveBeenCalledTimes(1)

    // Resolve the first save
    await act(async () => {
      resolveSave!({ data: { ...MOCK_BRIEF, name: "Brand A" }, requestId: "req-5" })
    })
  })

  it("handles expired session (401)", async () => {
    mockedGet.mockRejectedValueOnce(
      new ApiClientError({
        statusCode: 401,
        message: "Missing access token.",
        error: "Unauthorized",
        requestId: "req-6",
      })
    )

    const { result } = renderHook(() => useBrandBrief("ws-1"))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe(
      "Your session has expired. Please sign in again."
    )
  })

  it("handles permission failure (403)", async () => {
    mockedGet.mockRejectedValueOnce(
      new ApiClientError({
        statusCode: 403,
        message: "Forbidden.",
        error: "Forbidden",
        requestId: "req-7",
      })
    )

    const { result } = renderHook(() => useBrandBrief("ws-1"))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe(
      "You do not have permission to view this brand brief."
    )
  })

  it("clears and reloads data after workspace change", async () => {
    const briefWs1: BrandBriefResponse = {
      ...MOCK_BRIEF,
      id: "brief-ws1",
      workspaceId: "ws-1",
      name: "WS1 Brand",
    }
    const briefWs2: BrandBriefResponse = {
      ...MOCK_BRIEF,
      id: "brief-ws2",
      workspaceId: "ws-2",
      name: "WS2 Brand",
    }

    mockedGet.mockResolvedValueOnce({ data: briefWs1, requestId: "req-8" })

    const { result, rerender } = renderHook(
      ({ wsId }) => useBrandBrief(wsId),
      { initialProps: { wsId: "ws-1" as string | null } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.brief?.name).toBe("WS1 Brand")

    // Switch workspace
    mockedGet.mockResolvedValueOnce({ data: briefWs2, requestId: "req-9" })
    rerender({ wsId: "ws-2" })

    // Should reset to loading
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.brief?.name).toBe("WS2 Brand")
    expect(result.current.brief?.workspaceId).toBe("ws-2")
  })

  it("does not show one workspace's brief in another workspace", async () => {
    mockedGet.mockResolvedValueOnce({
      data: MOCK_BRIEF,
      requestId: "req-10",
    })

    const { result, rerender } = renderHook(
      ({ wsId }) => useBrandBrief(wsId),
      { initialProps: { wsId: "ws-1" as string | null } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.brief?.workspaceId).toBe("ws-1")

    // Switch to ws-2 which has no brief
    mockedGet.mockRejectedValueOnce(
      new ApiClientError({
        statusCode: 404,
        message: "Not found",
        error: "Not Found",
        requestId: "req-11",
      })
    )
    rerender({ wsId: "ws-2" })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.brief).toBeNull()
    expect(result.current.isNotFound).toBe(true)
  })
})
