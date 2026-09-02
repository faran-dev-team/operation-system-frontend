import { Button } from "@/components/ui/button"
import { ItemList } from "@/components/shared/item-list"
import { PageHeader } from "@/components/shared/page-header"
import { emailCampaigns } from "@/lib/mocks"

export default function EmailPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Email"
        description="Import allowed contacts, write the sequence, send a test, then stop follow-ups when someone unsubscribes."
        action={
          <Button size="lg" className="min-h-11 w-full sm:w-auto">
            New campaign
          </Button>
        }
      />
      <ItemList items={emailCampaigns} />
    </div>
  )
}
