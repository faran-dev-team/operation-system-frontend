"use client"

import { useCallback, useMemo, useState } from "react"
import { FileText, Loader2, Pencil, RefreshCw, Sparkles, X } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { LoadingState } from "@/components/shared/loading-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { useContentDrafts } from "@/hooks/use-content-drafts"
import { useContentGeneration } from "@/hooks/use-content-generation"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import type { ContentJobStatus } from "@/lib/api/types"
import type { StatusTone } from "@/lib/mocks"

const TOPIC_MAX = 500
const AUDIENCE_MAX = 200
const FORMAT_MAX = 100

const STATUS_META: Record<ContentJobStatus, { label: string; tone: StatusTone }> = {
  requested: { label: "Requested", tone: "neutral" },
  running: { label: "Running", tone: "review" },
  succeeded: { label: "Succeeded", tone: "success" },
  failed: { label: "Failed", tone: "warning" },
}

function draftMeta(createdAt: string, provider: string | null) {
  const when = new Date(createdAt).toLocaleString()
  return provider ? `${provider} · ${when}` : when
}

export default function ContentPage() {
  const { session } = useAuth()
  const { isReviewer, canMutate } = useWorkspacePermissions()
  const workspaceId = session?.workspace.id ?? null

  const {
    drafts,
    isLoading,
    error,
    selectedDraft,
    isDetailLoading,
    detailError,
    isEditingDraft,
    editDraftValue,
    isSavingDraftEdit,
    draftEditError,
    draftEditConflict,
    draftEditSaved,
    reload,
    selectDraft,
    clearSelectedDraft,
    startEditingDraft,
    setEditDraftValue,
    cancelEditingDraft,
    saveEditingDraft,
    reloadAfterConflict,
  } = useContentDrafts(workspaceId)

  const onSuccess = useCallback(
    (draftId: string | null) => {
      reload()
      if (draftId) {
        void selectDraft(draftId)
      }
    },
    [reload, selectDraft]
  )

  const generation = useContentGeneration(workspaceId, onSuccess)

  const [topic, setTopic] = useState("")
  const [audience, setAudience] = useState("")
  const [format, setFormat] = useState("")
  const [formErrors, setFormErrors] = useState<string[]>([])

  const statusMeta = useMemo(
    () => (generation.status ? STATUS_META[generation.status] : null),
    [generation.status]
  )

  function validate(): string[] {
    const errors: string[] = []
    const trimmed = topic.trim()
    if (!trimmed) {
      errors.push("Topic is required.")
    } else if (trimmed.length > TOPIC_MAX) {
      errors.push(`Topic must be ${TOPIC_MAX} characters or fewer.`)
    }
    if (audience.length > AUDIENCE_MAX) {
      errors.push(`Audience must be ${AUDIENCE_MAX} characters or fewer.`)
    }
    if (format.length > FORMAT_MAX) {
      errors.push(`Format must be ${FORMAT_MAX} characters or fewer.`)
    }
    return errors
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (generation.isBusy) return

    const errors = validate()
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors([])

    const payload: {
      topic: string
      audience?: string
      format?: string
    } = { topic: topic.trim() }
    if (audience.trim()) payload.audience = audience.trim()
    if (format.trim()) payload.format = format.trim()

    generation.submit(payload)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content studio"
        description="Describe what you need and generate a draft grounded in this workspace's brand brief."
      />

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>New draft</CardTitle>
            <CardDescription>
              Generating for{" "}
              <strong>{session?.workspace.name ?? "this workspace"}</strong>.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isReviewer ? (
              <div
                role="status"
                className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300"
              >
                <strong>View-only:</strong> Content generation is restricted to Operators and Administrators. Reviewers have view-only access to drafts.
              </div>
            ) : null}
            {formErrors.length > 0 ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              >
                <ul className="list-inside list-disc space-y-0.5">
                  {formErrors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="content-topic">
                Topic <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="content-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Spring launch announcement for our new plan"
                maxLength={TOPIC_MAX}
                rows={3}
                disabled={generation.isBusy || isReviewer}
                className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 md:text-sm dark:bg-input/30"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="content-audience">Audience</Label>
                <Input
                  id="content-audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. existing customers"
                  maxLength={AUDIENCE_MAX}
                  disabled={generation.isBusy || isReviewer}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content-format">Format</Label>
                <Input
                  id="content-format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  placeholder="e.g. email, caption, blog"
                  maxLength={FORMAT_MAX}
                  disabled={generation.isBusy || isReviewer}
                />
              </div>
            </div>

            {generation.phase !== "idle" && statusMeta ? (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {generation.isBusy ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : null}
                    <span className="text-sm font-medium">
                      {generation.phase === "submitting"
                        ? "Submitting request..."
                        : generation.phase === "polling"
                          ? "Generating draft..."
                          : generation.phase === "succeeded"
                            ? "Draft ready"
                            : "Generation failed"}
                    </span>
                  </div>
                  <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
                </div>

                {generation.phase === "failed" && generation.errorMessage ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-destructive">
                      {generation.errorMessage}
                    </p>
                    {generation.canRetry ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generation.retry()}
                        disabled={generation.isBusy || isReviewer}
                      >
                        Retry
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Adjust your inputs and generate again.
                      </p>
                    )}
                  </div>
                ) : null}

                {generation.phase === "succeeded" ? (
                  <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
                    Your draft was generated and added to the list below.
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="justify-end">
            <Button
              type="submit"
              size="lg"
              className="min-h-11 w-full gap-1.5 sm:w-auto"
              disabled={generation.isBusy || isReviewer}
            >
              <Sparkles className="size-4" />
              {isReviewer ? "Read-only as Reviewer" : generation.isBusy ? "Generating..." : "Generate draft"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {selectedDraft || isDetailLoading || detailError ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span className="truncate">
                {selectedDraft?.title ?? "Draft"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={clearSelectedDraft}
                aria-label="Close draft"
              >
                <X className="size-4" />
              </Button>
            </CardTitle>
            {selectedDraft ? (
              <CardDescription>
                {draftMeta(selectedDraft.createdAt, selectedDraft.provider)}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {isDetailLoading ? (
              <LoadingState label="Loading draft" />
            ) : detailError ? (
              <ErrorState title="Cannot open draft" description={detailError} />
            ) : selectedDraft ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline">Version {selectedDraft.version}</Badge>
                  {!isEditingDraft ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={startEditingDraft}
                      disabled={!canMutate}
                    >
                      <Pencil className="size-3.5" />
                      {canMutate ? "Edit" : "View-only (Reviewer)"}
                    </Button>
                  ) : null}
                </div>

                {draftEditSaved && !isEditingDraft ? (
                  <div
                    role="status"
                    className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400"
                  >
                    Draft saved successfully.
                  </div>
                ) : null}

                {draftEditError ? (
                  <div
                    role="alert"
                    className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    <p>{draftEditError}</p>
                    {draftEditConflict ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void reloadAfterConflict()}
                      >
                        Reload
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {isEditingDraft && canMutate ? (
                  <div className="space-y-2">
                    <Label htmlFor="draft-edit-content">Draft content</Label>
                    <textarea
                      id="draft-edit-content"
                      value={editDraftValue}
                      onChange={(e) => setEditDraftValue(e.target.value)}
                      disabled={isSavingDraftEdit}
                      rows={8}
                      className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm leading-relaxed transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void saveEditingDraft()}
                        disabled={isSavingDraftEdit}
                      >
                        {isSavingDraftEdit ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelEditingDraft}
                        disabled={isSavingDraftEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedDraft.body}
                  </p>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Drafts</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={reload}
            disabled={isLoading}
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <LoadingState label="Loading drafts" />
        ) : error ? (
          <div className="space-y-3">
            <ErrorState title="Cannot load drafts" description={error} />
            <Button variant="outline" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : drafts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No drafts yet"
            description="Generate your first draft using the form above."
          />
        ) : (
          <ul className="divide-y rounded-xl ring-1 ring-foreground/10">
            {drafts.map((draft) => {
              const isActive = selectedDraft?.id === draft.id
              return (
                <li key={draft.id}>
                  <button
                    type="button"
                    onClick={() => selectDraft(draft.id)}
                    className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4 aria-[current=true]:bg-muted/50"
                    aria-current={isActive}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {draft.title ?? "Untitled draft"}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {draftMeta(draft.createdAt, draft.provider)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Badge variant="outline">v{draft.version}</Badge>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
