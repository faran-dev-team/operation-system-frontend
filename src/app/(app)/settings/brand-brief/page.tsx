"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileText } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { LoadingState } from "@/components/shared/loading-state"
import { PageHeader } from "@/components/shared/page-header"
import { useBrandBrief } from "@/hooks/use-brand-brief"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import type { UpsertBrandBriefPayload } from "@/lib/api/types"

const NAME_MAX = 200
const TEXT_MAX = 5000

type FormFields = {
  name: string
  tone: string
  approvedFacts: string
  prohibitedClaims: string
}

const EMPTY_FORM: FormFields = {
  name: "",
  tone: "",
  approvedFacts: "",
  prohibitedClaims: "",
}

function formFromBrief(brief: {
  name: string
  tone: string | null
  approvedFacts: string | null
  prohibitedClaims: string | null
}): FormFields {
  return {
    name: brief.name,
    tone: brief.tone ?? "",
    approvedFacts: brief.approvedFacts ?? "",
    prohibitedClaims: brief.prohibitedClaims ?? "",
  }
}

function fieldsEqual(a: FormFields, b: FormFields) {
  return (
    a.name === b.name &&
    a.tone === b.tone &&
    a.approvedFacts === b.approvedFacts &&
    a.prohibitedClaims === b.prohibitedClaims
  )
}

export default function BrandBriefPage() {
  const router = useRouter()
  const { session } = useAuth()
  const { isReviewer } = useWorkspacePermissions()
  const workspaceId = session?.workspace.id ?? null

  const {
    brief,
    isLoading,
    isSaving,
    isSaved,
    error,
    validationErrors,
    isNotFound,
    save,
    reload,
  } = useBrandBrief(workspaceId)

  const [form, setForm] = useState<FormFields>(EMPTY_FORM)
  const [original, setOriginal] = useState<FormFields>(EMPTY_FORM)
  const [populatedFor, setPopulatedFor] = useState<string | null>(null)
  const [localErrors, setLocalErrors] = useState<string[]>([])

  const dirty = useMemo(() => !fieldsEqual(form, original), [form, original])

  // Populate form when brief loads — keyed on brief.id to avoid re-populating same brief
  if (brief && populatedFor !== brief.id) {
    const filled = formFromBrief(brief)
    setForm(filled)
    setOriginal(filled)
    setPopulatedFor(brief.id)
    setLocalErrors([])
  }

  // Reset form for empty brief — keyed on workspaceId to avoid re-clearing
  if (isNotFound && workspaceId && populatedFor !== workspaceId) {
    setForm(EMPTY_FORM)
    setOriginal(EMPTY_FORM)
    setPopulatedFor(workspaceId)
    setLocalErrors([])
  }

  // Clear everything when workspace is gone
  if (!workspaceId && populatedFor !== null) {
    setForm(EMPTY_FORM)
    setOriginal(EMPTY_FORM)
    setPopulatedFor(null)
    setLocalErrors([])
  }

  useEffect(() => {
    if (!dirty) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [dirty])

  const setField = useCallback(
    <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  function validate(): string[] {
    const errors: string[] = []
    const trimmedName = form.name.trim()
    if (!trimmedName) {
      errors.push("Brand name is required.")
    } else if (trimmedName.length > NAME_MAX) {
      errors.push(`Brand name must be ${NAME_MAX} characters or fewer.`)
    }
    if (form.tone.length > NAME_MAX) {
      errors.push(`Tone must be ${NAME_MAX} characters or fewer.`)
    }
    if (form.approvedFacts.length > TEXT_MAX) {
      errors.push(`Approved facts must be ${TEXT_MAX} characters or fewer.`)
    }
    if (form.prohibitedClaims.length > TEXT_MAX) {
      errors.push(`Prohibited claims must be ${TEXT_MAX} characters or fewer.`)
    }
    return errors
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSaving) return

    const errors = validate()
    if (errors.length > 0) {
      setLocalErrors(errors)
      return
    }
    setLocalErrors([])

    const payload: UpsertBrandBriefPayload = {
      name: form.name.trim(),
    }
    if (form.tone.trim()) payload.tone = form.tone.trim()
    if (form.approvedFacts.trim()) payload.approvedFacts = form.approvedFacts.trim()
    if (form.prohibitedClaims.trim())
      payload.prohibitedClaims = form.prohibitedClaims.trim()

    await save(payload)
    setOriginal(form)
  }

  const allErrors = [...localErrors, ...validationErrors]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Brand brief"
          description="Loading your brand details..."
        />
        <LoadingState label="Loading brand brief" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Brand brief"
          description="Manage your brand identity and guidelines."
          action={
            <Button
              variant="outline"
              size="lg"
              className="min-h-11 gap-1.5"
              onClick={() => router.push("/settings")}
            >
              <ArrowLeft className="size-4" />
              Back to settings
            </Button>
          }
        />
        <ErrorState title="Cannot load brand brief" description={error} />
        <Button variant="outline" onClick={reload}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand brief"
        description="Define your brand voice so every piece of content stays consistent."
        action={
          <Button
            variant="outline"
            size="lg"
            className="min-h-11 gap-1.5"
            onClick={() => {
              if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) {
                return
              }
              router.push("/settings")
            }}
          >
            <ArrowLeft className="size-4" />
            Back to settings
          </Button>
        }
      />

      {isNotFound && !brief ? (
        <EmptyState
          icon={FileText}
          title="No brand brief yet"
          description="Fill out the form below to create your workspace's brand brief."
        />
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Brand details</CardTitle>
            <CardDescription>
              These details guide AI-generated content for{" "}
              <strong>{session?.workspace.name ?? "this workspace"}</strong>.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isReviewer ? (
              <div
                role="status"
                className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300"
              >
                <strong>View-only:</strong> You are currently signed in with the Reviewer role. Editing or creating brand briefs requires an Operator or Administrator role.
              </div>
            ) : null}
            {allErrors.length > 0 ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              >
                <ul className="list-inside list-disc space-y-0.5">
                  {allErrors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {isSaved && !dirty ? (
              <div
                role="status"
                className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400"
              >
                Brand brief saved successfully.
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="brand-name">
                Brand name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brand-name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Pilot Alpha"
                maxLength={NAME_MAX}
                required
                autoComplete="organization"
                disabled={isSaving || isReviewer}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand-tone">Tone</Label>
              <Input
                id="brand-tone"
                value={form.tone}
                onChange={(e) => setField("tone", e.target.value)}
                placeholder="e.g. clear and direct"
                maxLength={NAME_MAX}
                disabled={isSaving || isReviewer}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand-approved-facts">Approved facts</Label>
              <textarea
                id="brand-approved-facts"
                value={form.approvedFacts}
                onChange={(e) => setField("approvedFacts", e.target.value)}
                placeholder="Facts your content may reference"
                maxLength={TEXT_MAX}
                rows={4}
                disabled={isSaving || isReviewer}
                className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 md:text-sm dark:bg-input/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand-prohibited-claims">Prohibited claims</Label>
              <textarea
                id="brand-prohibited-claims"
                value={form.prohibitedClaims}
                onChange={(e) => setField("prohibitedClaims", e.target.value)}
                placeholder="Claims your content must never make"
                maxLength={TEXT_MAX}
                rows={4}
                disabled={isSaving || isReviewer}
                className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 md:text-sm dark:bg-input/30"
              />
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {dirty
                ? "You have unsaved changes."
                : brief
                  ? `Last saved ${new Date(brief.updatedAt).toLocaleString()}`
                  : ""}
            </p>
            <Button
              type="submit"
              size="lg"
              className="min-h-11 w-full sm:w-auto"
              disabled={isSaving || isReviewer}
            >
              {isReviewer
                ? "Read-only as Reviewer"
                : isSaving
                  ? "Saving..."
                : brief && !isNotFound
                  ? "Save changes"
                  : "Create brand brief"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
