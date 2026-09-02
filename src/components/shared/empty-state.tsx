import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
}: {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-12 text-center sm:py-16">
      <Icon className="mb-3 size-8 text-muted-foreground" />
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {actionLabel ? (
        <Button className="mt-4 min-h-11 px-4" size="lg">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
