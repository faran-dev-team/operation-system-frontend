import { ApiClientError } from "@/lib/api/errors"

export type ClassifiedError = {
  message: string
  isAuth: boolean
  isPermission: boolean
  isNotFound: boolean
}

/** Maps an API error to a safe, actionable message and a coarse category. */
export function classifyApiError(
  error: unknown,
  fallback = "Something went wrong. Try again."
): ClassifiedError {
  if (error instanceof ApiClientError) {
    if (error.statusCode === 401) {
      return {
        message: "Your session has expired. Please sign in again.",
        isAuth: true,
        isPermission: false,
        isNotFound: false,
      }
    }
    if (error.statusCode === 403) {
      return {
        message: "You do not have permission to do this in this workspace.",
        isAuth: false,
        isPermission: true,
        isNotFound: false,
      }
    }
    if (error.statusCode === 404) {
      return {
        message: error.message || "Not found.",
        isAuth: false,
        isPermission: false,
        isNotFound: true,
      }
    }
    return {
      message: error.message || fallback,
      isAuth: false,
      isPermission: false,
      isNotFound: false,
    }
  }

  return {
    message: error instanceof Error && error.message ? error.message : fallback,
    isAuth: false,
    isPermission: false,
    isNotFound: false,
  }
}
