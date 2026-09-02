import type { LucideIcon } from "lucide-react"
import {
  CalendarClock,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageSquare,
  Phone,
  Settings,
  Sparkles,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  description: string
}

export const primaryNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "See drafts, jobs, and results in one place.",
  },
  {
    href: "/content",
    label: "Content studio",
    icon: Sparkles,
    description: "Write copy and create images or short videos.",
  },
  {
    href: "/publishing",
    label: "Publishing",
    icon: CalendarClock,
    description: "Review, approve, and schedule social posts.",
  },
  {
    href: "/comments",
    label: "Comments",
    icon: MessageSquare,
    description: "Read comments and send approved replies.",
  },
  {
    href: "/ads",
    label: "Advertising",
    icon: Megaphone,
    description: "Create, pause, and track Google and Meta ads.",
  },
  {
    href: "/email",
    label: "Email",
    icon: Mail,
    description: "Build campaigns and handle follow-ups.",
  },
  {
    href: "/calls",
    label: "Calls",
    icon: Phone,
    description: "Run approved outbound calls and review outcomes.",
  },
]

export const secondaryNav: NavItem[] = [
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "Workspace, brand details, and channel connections.",
  },
]

export function getPageTitle(pathname: string) {
  const match = [...primaryNav, ...secondaryNav].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
  return match?.label ?? "Dashboard"
}
