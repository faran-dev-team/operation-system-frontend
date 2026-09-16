"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"

import { getErrorMessage } from "@/lib/api/errors"
import {
  establishSession,
  loginWithPassword,
  logout as clearAuthSession,
  restoreSession,
} from "@/lib/auth/auth-api"
import {
  getAccessToken,
  getStoredSession,
  type AuthSession,
} from "@/lib/auth/session"
import { switchActiveWorkspace } from "@/lib/api/workspaces"

type AuthContextValue = {
  session: AuthSession | null
  isLoading: boolean
  login: (input: {
    email: string
    password: string
    remember?: boolean
  }) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
  switchWorkspace: (workspaceId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function boot() {
      const cached = getStoredSession()
      if (cached && active) {
        setSession(cached)
      }

      const restored = await restoreSession()
      if (!active) {
        return
      }
      setSession(restored)
      setIsLoading(false)
    }

    void boot()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(
    async (input: { email: string; password: string; remember?: boolean }) => {
      const loginResult = await loginWithPassword(input.email, input.password)
      const next = await establishSession(loginResult.accessToken, {
        remember: input.remember ?? true,
      })
      setSession(next)
    },
    []
  )

  const logout = useCallback(() => {
    clearAuthSession()
    setSession(null)
  }, [])

  const refresh = useCallback(async () => {
    const restored = await restoreSession()
    setSession(restored)
  }, [])

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    await switchActiveWorkspace(workspaceId)
    const token = getAccessToken()
    if (token) {
      const remember =
        typeof window !== "undefined" &&
        window.localStorage.getItem("os.remember") !== "0"
      const next = await establishSession(token, {
        remember,
        workspaceId,
      })
      setSession(next)
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      isLoading,
      login,
      logout,
      refresh,
      switchWorkspace,
    }),
    [session, isLoading, login, logout, refresh, switchWorkspace]
  )


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.")
  }
  return context
}

export function useAuthErrorMessage(error: unknown) {
  return getErrorMessage(error, "Something went wrong. Try again.")
}

/** Redirects unauthenticated users away from app routes. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`)
    }
  }, [isLoading, session, router, pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Checking your session...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return children
}

/** Sends signed-in users away from the login page. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && session) {
      router.replace("/dashboard")
    }
  }, [isLoading, session, router])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Checking your session...</p>
      </div>
    )
  }

  if (session) {
    return null
  }

  return children
}
