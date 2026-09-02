import Link from "next/link"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ItemList } from "@/components/shared/item-list"
import { LoadingState } from "@/components/shared/loading-state"
import { PageHeader } from "@/components/shared/page-header"
import { dashboardStats, recentActivity } from "@/lib/mocks"
import { primaryNav } from "@/lib/navigation"

export default function DashboardPage() {
  const modules = primaryNav.filter((item) => item.href !== "/dashboard")

  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome back"
        description="This is a sample workspace so you can walk through the product while live data is still being connected."
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">Jump into a workspace area</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.href} size="sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <CardTitle>{item.label}</CardTitle>
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                  <Button
                    nativeButton={false}
                    variant="outline"
                    size="lg"
                    className="mt-2 min-h-11 w-fit"
                    render={<Link href={item.href} />}
                  >
                    Open
                  </Button>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          <h3 className="text-sm font-medium">Recent activity</h3>
          <ItemList items={recentActivity} />
        </div>
        <div className="space-y-3 lg:col-span-2">
          <h3 className="text-sm font-medium">Jobs in progress</h3>
          <p className="text-sm text-muted-foreground">
            A short video is still rendering. This is sample status, not a live
            job.
          </p>
          <LoadingState label="Sample job progress" />
        </div>
      </section>
    </div>
  )
}
