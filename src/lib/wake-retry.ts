import { ApiError } from "./api-error";
import { rateLimit } from "./rate-limit";

// The free-tier backend sleeps when idle and takes about a minute to boot on
// the next request, so transient failures are retried for this long.
export const WAKE_WINDOW_MS = 90_000;
const MAX_DELAY_MS = 8_000;

/**
 * TanStack `retry`/`retryDelay` pair that keeps retrying transient failures
 * (see `ApiError.isTransient`) until a deadline set by the first failure.
 * Anything else — 401, 403, 500, validation — fails immediately. `reset`
 * starts a fresh window, e.g. after a success.
 */
export function createWakeRetry(windowMs = WAKE_WINDOW_MS, now = Date.now) {
  let deadline = 0;
  return {
    retry(_failureCount: number, error: unknown) {
      const transient =
        error instanceof ApiError &&
        error.isTransient &&
        rateLimit.getSnapshot() <= now();
      if (transient) {
        deadline ||= now() + windowMs;
        if (now() < deadline) return true;
      }
      deadline = 0;
      return false;
    },
    retryDelay: (failureCount: number) =>
      Math.min(1000 * 2 ** failureCount, MAX_DELAY_MS),
    reset() {
      deadline = 0;
    },
  };
}
