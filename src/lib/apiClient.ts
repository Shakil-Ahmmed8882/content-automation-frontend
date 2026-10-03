import { FetchError, type FetchOptions, ofetch } from "ofetch";
import type { ApiEnvelope } from "@/types/api.type";
import { ApiError, toApiError } from "./api-error";
import { rateLimit } from "./rate-limit";
import { sessionEvents } from "./session-events";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const http = ofetch.create({
  baseURL: BASE_URL,
  credentials: "include",
  retry: 0,
  timeout: 30_000,
});

export type ApiOptions = FetchOptions<"json"> & {
  skipAuthRefresh?: boolean;
  suppressSessionExpiry?: boolean;
};

const businessAuthPaths = new Set([
  "/auth/register",
  "/auth/verify-email",
  "/auth/login",
  "/auth/logout",
  "/auth/refresh-token",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

let refreshInFlight: Promise<void> | undefined;
let refreshGeneration = 0;

async function send<T>(path: string, options: FetchOptions<"json">) {
  if (!BASE_URL) {
    throw new ApiError(0, "NEXT_PUBLIC_API_BASE_URL is not configured.");
  }
  try {
    const result = await http<ApiEnvelope<T>>(path, options);
    if (!result.success) {
      throw new ApiError(result.statusCode, result.message, result);
    }
    return result;
  } catch (error) {
    const normalized = toApiError(error);
    if (normalized.status === 429) {
      const retryAfter =
        error instanceof FetchError
          ? Number(error.response?.headers.get("Retry-After"))
          : 0;
      rateLimit.pause(
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60,
      );
    }
    throw normalized;
  }
}

function refreshOnce() {
  refreshInFlight ??= send<null>("/auth/refresh-token", { method: "POST" })
    .then(() => {
      refreshGeneration++;
    })
    .finally(() => {
      refreshInFlight = undefined;
    });
  return refreshInFlight;
}

async function apiClient<T>(path: string, options: ApiOptions = {}) {
  const {
    skipAuthRefresh = false,
    suppressSessionExpiry = false,
    ...requestOptions
  } = options;
  const generation = refreshGeneration;
  try {
    return await send<T>(path, requestOptions);
  } catch (error) {
    const normalized = toApiError(error);
    if (
      normalized.status !== 401 ||
      skipAuthRefresh ||
      businessAuthPaths.has(path)
    ) {
      throw normalized;
    }
    try {
      if (generation === refreshGeneration) await refreshOnce();
    } catch (refreshError) {
      const failure = toApiError(refreshError);
      if (failure.status !== 401 && failure.status !== 403) throw failure;
      if (!suppressSessionExpiry) sessionEvents.expired();
      throw new ApiError(401, normalized.message, undefined, true);
    }
    try {
      return await send<T>(path, requestOptions);
    } catch (retryError) {
      const failure = toApiError(retryError);
      if (failure.status === 401) {
        if (!suppressSessionExpiry) sessionEvents.expired();
        throw new ApiError(401, failure.message, undefined, true);
      }
      throw failure;
    }
  }
}

export default apiClient;
