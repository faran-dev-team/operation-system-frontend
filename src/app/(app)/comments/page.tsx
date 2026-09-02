import { Button } from "@/components/ui/button"
import { ItemList } from "@/components/shared/item-list"
import { PageHeader } from "@/components/shared/page-header"
import { commentInbox } from "@/lib/mocks"

export default function CommentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Comments"
        description="Read incoming comments, use a suggested reply when it is grounded in your brand facts, then send only what you approve."
        action={
          <Button size="lg" className="min-h-11 w-full sm:w-auto">
            Open inbox
          </Button>
        }
      />
      <ItemList items={commentInbox} />
    </div>
  )
}
