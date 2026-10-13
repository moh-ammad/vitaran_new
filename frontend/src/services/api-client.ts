import { API_V1_PREFIX } from "@/constants/api";
import { getApiUrl } from "@/config/env";
import { isApiErrorResponse, isApiSuccessResponse } from "@/types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiUrl()}${API_V1_PREFIX}${normalizedPath}`;
}

export async function apiClient<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers, ...init } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  // Files are sent as-is; everything else is JSON.
  const isBinary = body instanceof Blob;

  if (body !== undefined && !isBinary && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: requestHeaders,
    body: body === undefined ? undefined : isBinary ? body : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const errorBody = isApiErrorResponse(payload) ? payload : undefined;
    throw new ApiError(
      errorBody?.error.message ?? response.statusText,
      response.status,
      errorBody?.error.details,
    );
  }

  if (!isApiSuccessResponse<T>(payload)) {
    throw new ApiError("Unexpected API response", response.status);
  }

  return payload.data;
}
