import { Badge } from "@/components/ui/badge"
import type { StatusTone } from "@/lib/mocks"

const toneVariant: Record<StatusTone, "outline" | "secondary" | "default" | "destructive"> = {
  neutral: "outline",
  review: "secondary",
  success: "default",
  warning: "destructive",
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: StatusTone
}) {
  return <Badge variant={toneVariant[tone]}>{label}</Badge>
}
