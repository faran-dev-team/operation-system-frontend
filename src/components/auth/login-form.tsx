"use client"

import { useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiClientError, getErrorMessage } from "@/lib/api"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const remember = formData.get("remember") === "on"

    try {
      await login({ email, password, remember })
      const next = searchParams.get("next")
      router.replace(next && next.startsWith("/") ? next : "/dashboard")
    } catch (err) {
      if (err instanceof ApiClientError) {
        const message = Array.isArray(err.body.message)
          ? err.body.message.join(", ")
          : err.body.message
        if (
          err.statusCode === 401 &&
          /invalid email or password/i.test(message)
        ) {
          setError("Invalid email or password.")
        } else {
          setError(message || "Sign in failed. Try again.")
        }
      } else {
        setError(getErrorMessage(err, "Sign in failed. Try again."))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
          OS
        </div>
        <div>
          <p className="text-sm font-semibold">Operation System</p>
          <p className="text-xs text-muted-foreground">Marketing workspace</p>
        </div>
      </div>

      <div className="mb-8 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your work email and password to access your workspace.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            className="h-11 min-h-11 px-3"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              minLength={6}
              placeholder="Enter your password"
              className="h-11 min-h-11 px-3 pr-11"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword((open) => !open)}
              className="absolute top-1/2 right-2.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="size-4 rounded border border-input accent-foreground"
            disabled={isSubmitting}
          />
          Remember me
        </label>

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-11 min-h-11 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Need an account? Ask your workspace admin for an invite.
      </p>
    </div>
  )
}
