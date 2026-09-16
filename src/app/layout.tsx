import type { Metadata } from "next"
import { Geist } from "next/font/google"

import { Providers } from "@/components/providers"
import { cn } from "@/lib/utils"

import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Operation System",
  description: "AI Marketing & Sales platform",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-svh overflow-x-hidden antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
