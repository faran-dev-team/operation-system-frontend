import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Sign in",
}

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-foreground text-background lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-background text-xs font-semibold text-foreground">
            OS
          </div>
          <p className="text-sm font-semibold">Operation System</p>
        </div>

        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Run marketing and sales from one workspace.
          </h2>
          <p className="text-sm leading-6 text-background/70">
            Create content, publish to social, manage comments, launch ads, send
            email, and place approved outbound calls without leaving the product.
          </p>
        </div>

        <p className="text-xs text-background/50">
          Authorized workspaces only. All publishing and spend stays behind
          approval.
        </p>
      </aside>

      <section className="flex items-center justify-center bg-background px-4 py-10 sm:px-8">
        <LoginForm />
      </section>
    </main>
  )
}
