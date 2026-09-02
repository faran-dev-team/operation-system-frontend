export function ErrorState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div
      role="status"
      className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3"
    >
      <p className="text-sm font-medium text-destructive">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
