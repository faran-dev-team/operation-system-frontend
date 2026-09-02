import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/shared/error-state"
import { ItemList } from "@/components/shared/item-list"
import { PageHeader } from "@/components/shared/page-header"
import { publishingQueue } from "@/lib/mocks"

export default function PublishingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Publishing"
        description="Approve the exact post that goes out, pick networks, and set a time. Nothing is sent until someone confirms."
        action={
          <Button size="lg" className="min-h-11 w-full sm:w-auto">
            Review next post
          </Button>
        }
      />
      <ErrorState
        title="Instagram needs a reconnect"
        description="Publishing to Instagram is paused until the account is connected again. Other networks in this sample queue are unaffected."
      />
      <ItemList items={publishingQueue} />
    </div>
  )
}
