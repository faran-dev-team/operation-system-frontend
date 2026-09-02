import { Phone } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"

export default function CallsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Calls"
        description="Only approved numbers can be called. You will see transcripts, outcomes, and whether a person asked to stop."
      />
      <EmptyState
        icon={Phone}
        title="No calls in this workspace yet"
        description="When a campaign is approved, completed calls will show up here with the outcome and a short summary."
        actionLabel="Create call campaign"
      />
    </div>
  )
}
