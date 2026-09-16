"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Menu } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher"
import { getPageTitle } from "@/lib/navigation"

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const title = getPageTitle(pathname)
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    router.replace("/login")
  }

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
        <WorkspaceSwitcher />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-9 gap-1.5 px-2"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  )
}
