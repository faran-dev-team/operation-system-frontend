"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu } from "@base-ui/react/menu"
import { Check, ChevronsUpDown, Building2, Loader2 } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchUserWorkspaces } from "@/lib/api/workspaces"
import type { WorkspaceSummary } from "@/lib/api/types"
import { cn } from "@/lib/utils"

export function WorkspaceSwitcher() {
  const { session, switchWorkspace } = useAuth()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([])
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const currentWorkspaceId = session?.workspace.id
  const currentWorkspaceName = session?.workspace.name ?? "Select workspace"
  const currentRole = session?.workspace.role ?? "member"

  useEffect(() => {
    let active = true
    if (session?.accessToken) {
      fetchUserWorkspaces()
        .then((list) => {
          if (active) {
            setWorkspaces(list)
          }
        })
        .catch((err) => {
          if (active) {
            console.error("Failed to load workspaces:", err)
          }
        })
    }
    return () => {
      active = false
    }
  }, [session?.accessToken, currentWorkspaceId])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen && session?.accessToken) {
      setIsLoadingList(true)
      fetchUserWorkspaces()
        .then((list) => setWorkspaces(list))
        .catch((err) => console.error("Failed to load workspaces:", err))
        .finally(() => setIsLoadingList(false))
    }
  }

  async function handleSelect(workspaceId: string) {
    if (workspaceId === currentWorkspaceId || isSwitching) {
      return
    }

    setIsSwitching(true)
    setSwitchingId(workspaceId)
    try {
      await switchWorkspace(workspaceId)
      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error("Failed to switch workspace:", err)
    } finally {
      setIsSwitching(false)
      setSwitchingId(null)
    }
  }

  return (
    <Menu.Root open={open} onOpenChange={handleOpenChange}>
      <Menu.Trigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 max-w-[14rem] gap-1.5 px-2.5 sm:max-w-[18rem]"
            disabled={isSwitching}
          />
        }
      >
        <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium text-xs sm:text-sm">
          {currentWorkspaceName}
        </span>
        <Badge
          variant="secondary"
          className="hidden px-1 py-0 text-[10px] capitalize sm:inline-flex"
        >
          {currentRole}
        </Badge>
        {isSwitching ? (
          <Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <ChevronsUpDown className="size-3 shrink-0 text-muted-foreground opacity-60" />
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50">
          <Menu.Popup className="w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none focus:outline-none">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Workspaces
            </div>

            {isLoadingList && workspaces.length === 0 ? (
              <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                <Loader2 className="mr-2 size-3.5 animate-spin" />
                Loading...
              </div>
            ) : workspaces.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                No other workspaces found
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {workspaces.map((ws) => {
                  const isActive = ws.id === currentWorkspaceId
                  const isThisSwitching = switchingId === ws.id

                  return (
                    <Menu.Item
                      key={ws.id}
                      onClick={() => handleSelect(ws.id)}
                      disabled={isSwitching}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 text-xs outline-none transition-colors",
                        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        isActive && "font-medium bg-muted/60",
                        isSwitching && "pointer-events-none opacity-60"
                      )}
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="truncate">{ws.name}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {ws.role}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center pl-2">
                        {isThisSwitching ? (
                          <Loader2 className="size-3.5 animate-spin text-primary" />
                        ) : isActive ? (
                          <Check className="size-3.5 text-primary" />
                        ) : null}
                      </div>
                    </Menu.Item>
                  )
                })}
              </div>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
