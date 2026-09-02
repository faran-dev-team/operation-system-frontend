import { Button } from "@/components/ui/button"
import { ItemList } from "@/components/shared/item-list"
import { PageHeader } from "@/components/shared/page-header"
import { adCampaigns } from "@/lib/mocks"

export default function AdsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Advertising"
        description="Set up Google and Meta campaigns, keep spend on pause until launch, and check status without leaving the workspace."
        action={
          <Button size="lg" className="min-h-11 w-full sm:w-auto">
            New campaign
          </Button>
        }
      />
      <ItemList items={adCampaigns} />
    </div>
  )
}
