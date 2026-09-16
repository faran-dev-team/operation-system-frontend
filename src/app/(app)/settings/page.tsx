"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ItemList } from "@/components/shared/item-list"
import { PageHeader } from "@/components/shared/page-header"
import { workspaceConnections } from "@/lib/mocks"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage this workspace, brand details, and which channels are allowed to publish or spend."
        action={
          <Button
            nativeButton={false}
            size="lg"
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            render={<Link href="/settings/brand-brief" />}
          >
            Edit brand brief
          </Button>
        }
      />
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Channel connections</h3>
        <ItemList items={workspaceConnections} />
      </div>
    </div>
  )
}
