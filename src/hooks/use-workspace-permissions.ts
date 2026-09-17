"use client"

import { useAuth } from "@/components/auth/auth-provider"

export function useWorkspacePermissions() {
  const { session } = useAuth()
  const role = session?.workspace?.role ?? null

  const isAdmin = role === "admin"
  const isOperator = role === "operator"
  const isReviewer = role === "reviewer"
  const canMutate = isAdmin || isOperator

  return {
    role,
    isAdmin,
    isOperator,
    isReviewer,
    canMutate,
  }
}
