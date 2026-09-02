export type StatusTone = "neutral" | "review" | "success" | "warning"

export type ListRow = {
  id: string
  title: string
  meta: string
  status: string
  tone: StatusTone
}

export const dashboardStats = [
  { label: "Open drafts", value: "4" },
  { label: "Waiting for review", value: "2" },
  { label: "Paused campaigns", value: "1" },
  { label: "Calls today", value: "0" },
]

export const recentActivity: ListRow[] = [
  {
    id: "a1",
    title: "Summer launch caption",
    meta: "Content studio · 2 hours ago",
    status: "Draft",
    tone: "neutral",
  },
  {
    id: "a2",
    title: "Instagram square post",
    meta: "Publishing · Yesterday",
    status: "In review",
    tone: "review",
  },
  {
    id: "a3",
    title: "Search campaign: home services",
    meta: "Advertising · 3 days ago",
    status: "Paused",
    tone: "warning",
  },
]

export const contentDrafts: ListRow[] = [
  {
    id: "c1",
    title: "Summer launch caption",
    meta: "Facebook, Instagram · Updated 2 hours ago",
    status: "Draft",
    tone: "neutral",
  },
  {
    id: "c2",
    title: "Customer story quote card",
    meta: "LinkedIn · Updated yesterday",
    status: "Ready",
    tone: "success",
  },
  {
    id: "c3",
    title: "15 second promo clip",
    meta: "Reels, ads · Updated 4 days ago",
    status: "Rendering",
    tone: "review",
  },
]

export const publishingQueue: ListRow[] = [
  {
    id: "p1",
    title: "Instagram square post",
    meta: "Scheduled for tomorrow, 10:00 AM",
    status: "In review",
    tone: "review",
  },
  {
    id: "p2",
    title: "LinkedIn company update",
    meta: "Waiting on final caption",
    status: "Needs edits",
    tone: "warning",
  },
]

export const commentInbox: ListRow[] = [
  {
    id: "m1",
    title: "What are your weekend hours?",
    meta: "Instagram · 18 minutes ago",
    status: "Needs reply",
    tone: "warning",
  },
  {
    id: "m2",
    title: "Loved the new offer",
    meta: "Facebook · 2 hours ago",
    status: "Draft ready",
    tone: "review",
  },
  {
    id: "m3",
    title: "Can you ship to Karachi?",
    meta: "LinkedIn · Yesterday",
    status: "Replied",
    tone: "success",
  },
]

export const adCampaigns: ListRow[] = [
  {
    id: "ad1",
    title: "Search: home services",
    meta: "Google · Budget on hold",
    status: "Paused",
    tone: "warning",
  },
  {
    id: "ad2",
    title: "Prospecting: spring offer",
    meta: "Meta · Image and video ads",
    status: "Draft",
    tone: "neutral",
  },
]

export const emailCampaigns: ListRow[] = [
  {
    id: "e1",
    title: "Welcome sequence",
    meta: "5 test recipients · Last send yesterday",
    status: "Active",
    tone: "success",
  },
]

export const workspaceConnections: ListRow[] = [
  {
    id: "s1",
    title: "Facebook Page",
    meta: "Connected as Northwind Marketing",
    status: "Connected",
    tone: "success",
  },
  {
    id: "s2",
    title: "Instagram",
    meta: "Token expired. Reconnect to publish.",
    status: "Needs attention",
    tone: "warning",
  },
  {
    id: "s3",
    title: "Google Ads",
    meta: "Not connected yet",
    status: "Not connected",
    tone: "neutral",
  },
]
