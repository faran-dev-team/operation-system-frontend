import { Button } from "@/components/ui/button"
import { ItemList } from "@/components/shared/item-list"
import { PageHeader } from "@/components/shared/page-header"
import { contentDrafts } from "@/lib/mocks"

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Content studio"
        description="Start from a brand brief, then edit captions, images, and short videos before they go to review."
        action={
          <Button size="lg" className="min-h-11 w-full sm:w-auto">
            New draft
          </Button>
        }
      />
      <ItemList items={contentDrafts} />
    </div>
  )
}
