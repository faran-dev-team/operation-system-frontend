import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { renderHook } from "@testing-library/react"

import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import BrandBriefPage from "@/app/(app)/settings/brand-brief/page"
import ContentPage from "@/app/(app)/content/page"
import AuditLogsPage from "@/app/(app)/settings/audit-logs/page"
import * as auditApi from "@/lib/api/audit"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock auth hook
const mockSession = {
  user: { id: "u-1", email: "test@example.com", name: "Test User" },
  workspace: { id: "ws-1", name: "Alpha", role: "operator" as "admin" | "operator" | "reviewer" },
  workspaces: [{ id: "ws-1", name: "Alpha", role: "operator" as "admin" | "operator" | "reviewer" }],
  accessToken: "fake-jwt",
}

let currentRole: "admin" | "operator" | "reviewer" | null = "operator"

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    session: currentRole
      ? {
          ...mockSession,
          workspace: { id: "ws-1", name: "Alpha", role: currentRole },
          workspaces: [{ id: "ws-1", name: "Alpha", role: currentRole }],
        }
      : null,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    switchWorkspace: vi.fn(),
    refreshSession: vi.fn(),
  }),
}))

// Mock BrandBrief hook
vi.mock("@/hooks/use-brand-brief", () => ({
  useBrandBrief: () => ({
    brief: {
      id: "brief-1",
      workspaceId: "ws-1",
      name: "Acme Corp",
      tone: "Professional",
      approvedFacts: "High quality",
      prohibitedClaims: "None",
      createdAt: "2026-09-15T00:00:00.000Z",
      updatedAt: "2026-09-15T12:00:00.000Z",
    },
    isLoading: false,
    isNotFound: false,
    error: null,
    validationErrors: [],
    isSaving: false,
    save: vi.fn(),
  }),
}))

// Mock Content hooks
vi.mock("@/hooks/use-content-drafts", () => ({
  useContentDrafts: () => ({
    drafts: [],
    isLoading: false,
    isError: false,
    errorMessage: null,
    refresh: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-content-generation", () => ({
  useContentGeneration: () => ({
    phase: "idle",
    latestDraft: null,
    error: null,
    isBusy: false,
    canRetry: false,
    errorMessage: null,
    submit: vi.fn(),
    retry: vi.fn(),
    reset: vi.fn(),
  }),
}))

// Mock Audit API
vi.mock("@/lib/api/audit")
const mockedFetchAudit = vi.mocked(auditApi.fetchWorkspaceAuditLogs)

describe("RBAC Permissions and UI Gating", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentRole = "operator"
  })

  describe("useWorkspacePermissions Hook", () => {
    it("evaluates admin role correctly", () => {
      currentRole = "admin"
      const { result } = renderHook(() => useWorkspacePermissions())
      expect(result.current.role).toBe("admin")
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isOperator).toBe(false)
      expect(result.current.isReviewer).toBe(false)
      expect(result.current.canMutate).toBe(true)
    })

    it("evaluates operator role correctly", () => {
      currentRole = "operator"
      const { result } = renderHook(() => useWorkspacePermissions())
      expect(result.current.role).toBe("operator")
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isOperator).toBe(true)
      expect(result.current.isReviewer).toBe(false)
      expect(result.current.canMutate).toBe(true)
    })

    it("evaluates reviewer role correctly", () => {
      currentRole = "reviewer"
      const { result } = renderHook(() => useWorkspacePermissions())
      expect(result.current.role).toBe("reviewer")
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isOperator).toBe(false)
      expect(result.current.isReviewer).toBe(true)
      expect(result.current.canMutate).toBe(false)
    })

    it("handles null session gracefully", () => {
      currentRole = null
      const { result } = renderHook(() => useWorkspacePermissions())
      expect(result.current.role).toBeNull()
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isReviewer).toBe(false)
      expect(result.current.canMutate).toBe(false)
    })
  })

  describe("Brand Brief Page RBAC UI", () => {
    it("enables inputs and save button for operator", () => {
      currentRole = "operator"
      render(<BrandBriefPage />)

      const nameInput = screen.getByLabelText(/Brand name/i)
      const toneInput = screen.getByLabelText(/Tone/i)
      const saveButton = screen.getByRole("button", { name: /Save changes/i })

      expect(nameInput).not.toBeDisabled()
      expect(toneInput).not.toBeDisabled()
      expect(saveButton).not.toBeDisabled()
      expect(screen.queryByText(/View-only as Reviewer/i)).toBeNull()
    })

    it("disables inputs and displays view-only banner for reviewer", () => {
      currentRole = "reviewer"
      render(<BrandBriefPage />)

      expect(
        screen.getByText(/Editing or creating brand briefs requires an Operator or Administrator role/i)
      ).toBeInTheDocument()

      const nameInput = screen.getByLabelText(/Brand name/i)
      const toneInput = screen.getByLabelText(/Tone/i)
      const saveButton = screen.getByRole("button", { name: /Read-only as Reviewer/i })

      expect(nameInput).toBeDisabled()
      expect(toneInput).toBeDisabled()
      expect(saveButton).toBeDisabled()
    })
  })

  describe("Content Generation Page RBAC UI", () => {
    it("enables prompt inputs and submit button for operator", () => {
      currentRole = "operator"
      render(<ContentPage />)

      const topicInput = screen.getByLabelText(/Topic/i)
      const generateButton = screen.getByRole("button", { name: /Generate draft/i })

      expect(topicInput).not.toBeDisabled()
      expect(generateButton).not.toBeDisabled()
      expect(screen.queryByText(/Content generation is restricted/i)).toBeNull()
    })

    it("disables prompt inputs and shows restricted banner for reviewer", () => {
      currentRole = "reviewer"
      render(<ContentPage />)

      expect(
        screen.getByText(/Content generation is restricted to Operators and Administrators. Reviewers have view-only access to drafts./i)
      ).toBeInTheDocument()

      const topicInput = screen.getByLabelText(/Topic/i)
      const generateButton = screen.getByRole("button", { name: /Read-only as Reviewer/i })

      expect(topicInput).toBeDisabled()
      expect(generateButton).toBeDisabled()
    })
  })

  describe("Audit Logs Page RBAC UI", () => {
    it("shows access restricted alert and does not fetch logs when user is reviewer", () => {
      currentRole = "reviewer"
      render(<AuditLogsPage />)

      expect(screen.getByText(/Administrator Access Required/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Only workspace administrators are authorized to inspect audit logs./i)
      ).toBeInTheDocument()
      expect(mockedFetchAudit).not.toHaveBeenCalled()
    })

    it("fetches and renders audit records when user is admin", async () => {
      currentRole = "admin"
      mockedFetchAudit.mockResolvedValueOnce([
        {
          id: "log-1",
          workspaceId: "ws-1",
          action: "brand_brief.updated",
          resource: "brand_brief",
          resourceId: "brief-1",
          actorId: "u-1",
          actor: { id: "u-1", name: "Admin User", email: "admin@test.com" },
          payload: { name: "Updated Brand" },
          createdAt: "2026-09-17T12:00:00.000Z",
        },
      ])

      render(<AuditLogsPage />)

      await waitFor(() => {
        expect(mockedFetchAudit).toHaveBeenCalledTimes(1)
      })

      expect(screen.getByText("brand_brief.updated")).toBeInTheDocument()
      expect(screen.getByText("Admin User")).toBeInTheDocument()
      expect(screen.getByText(/\(brief-1\)/)).toBeInTheDocument()
    })
  })
})
