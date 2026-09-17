import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import ContentPage from "@/app/(app)/content/page"
import * as useContentDraftsModule from "@/hooks/use-content-drafts"
import type { ContentDraft } from "@/lib/api/types"

vi.mock("@/hooks/use-content-generation", () => ({
  useContentGeneration: () => ({
    phase: "idle",
    status: null,
    jobId: null,
    draftId: null,
    errorCode: null,
    errorMessage: null,
    canRetry: false,
    isBusy: false,
    submit: vi.fn(),
    retry: vi.fn(),
    reset: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-content-drafts")

let currentRole: "admin" | "operator" | "reviewer" = "operator"

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    session: {
      user: { id: "u-1", email: "test@example.com", name: "Test User" },
      workspace: { id: "ws-1", name: "Alpha", role: currentRole },
    },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}))

const mockedUseContentDrafts = vi.mocked(useContentDraftsModule.useContentDrafts)

const BASE_DRAFT: ContentDraft = {
  id: "draft-1",
  workspaceId: "ws-1",
  contentRequestId: "req-1",
  generationJobId: "job-1",
  title: "Spring launch",
  body: "Original body",
  version: 3,
  provider: "stub",
  promptVersion: "content-v1",
  metadata: {},
  createdAt: "2026-09-17T00:00:00.000Z",
  updatedAt: "2026-09-17T00:00:00.000Z",
}

function buildDraftsMock(
  overrides: Partial<ReturnType<typeof useContentDraftsModule.useContentDrafts>> = {}
) {
  return {
    drafts: [BASE_DRAFT],
    isLoading: false,
    error: null,
    selectedDraft: BASE_DRAFT,
    isDetailLoading: false,
    detailError: null,
    isEditingDraft: false,
    editDraftValue: "",
    isSavingDraftEdit: false,
    draftEditError: null,
    draftEditConflict: false,
    draftEditSaved: false,
    reload: vi.fn(),
    selectDraft: vi.fn(),
    clearSelectedDraft: vi.fn(),
    startEditingDraft: vi.fn(),
    setEditDraftValue: vi.fn(),
    cancelEditingDraft: vi.fn(),
    saveEditingDraft: vi.fn(),
    reloadAfterConflict: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  currentRole = "operator"
})

describe("Content draft editing (page-level RBAC and controls)", () => {
  it("shows an enabled Edit control for operators", () => {
    currentRole = "operator"
    mockedUseContentDrafts.mockReturnValue(buildDraftsMock())
    render(<ContentPage />)
    expect(screen.getByRole("button", { name: "Edit" })).not.toBeDisabled()
  })

  it("shows an enabled Edit control for administrators", () => {
    currentRole = "admin"
    mockedUseContentDrafts.mockReturnValue(buildDraftsMock())
    render(<ContentPage />)
    expect(screen.getByRole("button", { name: "Edit" })).not.toBeDisabled()
  })

  it("shows a disabled view-only control for reviewers with no enabled editing controls", () => {
    currentRole = "reviewer"
    mockedUseContentDrafts.mockReturnValue(buildDraftsMock())
    render(<ContentPage />)

    const viewOnlyButton = screen.getByRole("button", {
      name: /View-only \(Reviewer\)/i,
    })
    expect(viewOnlyButton).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull()
    expect(screen.queryByLabelText("Draft content")).toBeNull()
  })

  it("reviewers see no enabled editing controls even if isEditingDraft were somehow true", () => {
    currentRole = "reviewer"
    // Defense-in-depth: even if the hook state were (incorrectly) in edit
    // mode, the reviewer must still see the read-only view, not an editable
    // textarea with enabled Save/Cancel controls.
    mockedUseContentDrafts.mockReturnValue(
      buildDraftsMock({ isEditingDraft: true, editDraftValue: "Original body" })
    )
    render(<ContentPage />)

    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull()
    expect(screen.queryByLabelText("Draft content")).toBeNull()
    expect(screen.getByText("Original body")).toBeInTheDocument()
  })

  it("clicking Edit calls startEditingDraft", () => {
    const mock = buildDraftsMock()
    mockedUseContentDrafts.mockReturnValue(mock)
    render(<ContentPage />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    expect(mock.startEditingDraft).toHaveBeenCalledTimes(1)
  })

  it("shows the current version and seeds the textarea with the original value while editing", () => {
    mockedUseContentDrafts.mockReturnValue(
      buildDraftsMock({ isEditingDraft: true, editDraftValue: "Original body" })
    )
    render(<ContentPage />)

    expect(screen.getByText("Version 3")).toBeInTheDocument()
    expect(screen.getByLabelText("Draft content")).toHaveValue("Original body")
  })

  it("typing in the textarea calls setEditDraftValue", () => {
    const mock = buildDraftsMock({
      isEditingDraft: true,
      editDraftValue: "Original body",
    })
    mockedUseContentDrafts.mockReturnValue(mock)
    render(<ContentPage />)

    fireEvent.change(screen.getByLabelText("Draft content"), {
      target: { value: "Changed body" },
    })
    expect(mock.setEditDraftValue).toHaveBeenCalledWith("Changed body")
  })

  it("clicking Save calls saveEditingDraft", () => {
    const mock = buildDraftsMock({
      isEditingDraft: true,
      editDraftValue: "Changed body",
    })
    mockedUseContentDrafts.mockReturnValue(mock)
    render(<ContentPage />)

    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(mock.saveEditingDraft).toHaveBeenCalledTimes(1)
  })

  it("disables Save and Cancel while submitting, preventing duplicate requests", () => {
    mockedUseContentDrafts.mockReturnValue(
      buildDraftsMock({ isEditingDraft: true, isSavingDraftEdit: true })
    )
    render(<ContentPage />)

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
  })

  it("clicking Cancel calls cancelEditingDraft", () => {
    const mock = buildDraftsMock({
      isEditingDraft: true,
      editDraftValue: "Changed body",
    })
    mockedUseContentDrafts.mockReturnValue(mock)
    render(<ContentPage />)

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(mock.cancelEditingDraft).toHaveBeenCalledTimes(1)
  })

  it("shows the 409 conflict message with a Reload action", () => {
    const mock = buildDraftsMock({
      isEditingDraft: true,
      draftEditConflict: true,
      draftEditError:
        "This draft was updated elsewhere. Reload the latest version before saving.",
    })
    mockedUseContentDrafts.mockReturnValue(mock)
    render(<ContentPage />)

    expect(
      screen.getByText(
        "This draft was updated elsewhere. Reload the latest version before saving."
      )
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Reload" }))
    expect(mock.reloadAfterConflict).toHaveBeenCalledTimes(1)
  })

  it("shows a validation error without a Reload action for non-conflict failures", () => {
    mockedUseContentDrafts.mockReturnValue(
      buildDraftsMock({
        isEditingDraft: true,
        draftEditConflict: false,
        draftEditError: "Content is required.",
      })
    )
    render(<ContentPage />)

    expect(screen.getByText("Content is required.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Reload" })).toBeNull()
  })

  it("shows a success message after saving", () => {
    mockedUseContentDrafts.mockReturnValue(
      buildDraftsMock({ isEditingDraft: false, draftEditSaved: true })
    )
    render(<ContentPage />)

    expect(screen.getByText("Draft saved successfully.")).toBeInTheDocument()
  })
})
