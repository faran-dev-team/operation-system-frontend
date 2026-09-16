import type { ApiErrorBody } from "@/lib/api/types"

export class ApiClientError extends Error {
  readonly statusCode: number
  readonly body: ApiErrorBody
  readonly requestId?: string

  constructor(body: ApiErrorBody, requestId?: string) {
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message
    super(message)
    this.name = "ApiClientError"
    this.statusCode = body.statusCode
    this.body = body
    this.requestId = requestId ?? body.requestId
  }
}

export function getErrorMessage(error: unknown, fallback = "Request failed.") {
  if (error instanceof ApiClientError) {
    return error.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
