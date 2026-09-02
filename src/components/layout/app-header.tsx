"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { getPageTitle } from "@/lib/navigation"

export function AppHeader() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              className="min-h-11 min-w-11 lg:hidden"
            />
          }
        >
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(18rem,85vw)] p-0" showCloseButton>
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <h1 className="truncate text-sm font-medium sm:text-base">{title}</h1>

      <div className="ml-auto flex min-w-0 items-center gap-2">
        <Badge variant="outline" className="max-w-[9rem] truncate sm:max-w-none">
          Pilot Alpha
        </Badge>
        <span className="hidden truncate text-xs text-muted-foreground sm:inline">
          Operator
        </span>
      </div>
    </header>
  )
}
