import { StatusBadge } from "@/components/shared/status-badge"
import type { ListRow } from "@/lib/mocks"

export function ItemList({ items }: { items: ListRow[] }) {
  return (
    <ul className="divide-y rounded-xl ring-1 ring-foreground/10">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div className="min-w-0">
            <p className="font-medium">{item.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{item.meta}</p>
          </div>
          <div className="shrink-0">
            <StatusBadge label={item.status} tone={item.tone} />
          </div>
        </li>
      ))}
    </ul>
  )
}
