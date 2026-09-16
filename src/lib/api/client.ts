import { ApiClientError } from "@/lib/api/errors"
import type { ApiErrorBody, ApiRequestOptions } from "@/lib/api/types"

function getApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (!raw) {
    return "http://localhost:4000"
  }
  return raw.replace(/\/$/, "")
}

function buildUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${getApiBaseUrl()}${normalized}`
}

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `req-${Date.now()}`
}

async function parseErrorBody(
  response: Response,
  requestId: string
): Promise<ApiErrorBody> {
  try {
    const data = (await response.json()) as Partial<ApiErrorBody>
    return {
      statusCode: data.statusCode ?? response.status,
      message: data.message ?? (response.statusText || "Request failed."),
      error: data.error ?? "Error",
      requestId: data.requestId ?? requestId,
      path: data.path,
      timestamp: data.timestamp,
    }
  } catch {
    return {
      statusCode: response.status,
      message: response.statusText || "Request failed.",
      error: "Error",
      requestId,
    }
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<{ data: T; requestId: string }> {
  const requestId = options.requestId ?? createRequestId()
  const headers: Record<string, string> = {
    Accept: "application/json",
    "x-request-id": requestId,
    ...options.headers,
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  if (!options.skipAuth && options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  if (options.workspaceId) {
    headers["x-workspace-id"] = options.workspaceId
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiClientError({
      statusCode: 0,
      message:
        "Cannot reach the API. Confirm the backend is running and NEXT_PUBLIC_API_URL is correct.",
      error: "NetworkError",
      requestId,
    })
  }

  const responseRequestId = response.headers.get("x-request-id") ?? requestId

  if (!response.ok) {
    const body = await parseErrorBody(response, responseRequestId)
    throw new ApiClientError(body, responseRequestId)
  }

  if (response.status === 204) {
    return { data: undefined as T, requestId: responseRequestId }
  }

  const data = (await response.json()) as T
  return { data, requestId: responseRequestId }
}

export function getPublicApiUrl() {
  return getApiBaseUrl()
}
