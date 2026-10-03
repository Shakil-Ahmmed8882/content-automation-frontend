export const ErrorCode = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  DEVICE_NOT_AUTHORIZED: "DEVICE_NOT_AUTHORIZED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  UNAUTHORIZED: "UNAUTHORIZED",

  // ── Application (business domain) ─────────────────────────────────────────
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  FORBIDDEN: "FORBIDDEN",

  // ── Network / API ──────────────────────────────────────────────────────────
  NETWORK_ERROR: "NETWORK_ERROR",
  REQUEST_TIMEOUT: "REQUEST_TIMEOUT",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // ── Server ─────────────────────────────────────────────────────────────────
  SERVER_ERROR: "SERVER_ERROR",

  // ── Unknown ────────────────────────────────────────────────────────────────
  UNKNOWN: "UNKNOWN",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ── AppError ───────────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    // Prefix the message with the code so it survives React error boundary
    // serialization (custom properties are stripped in production).
    super(`[${code}] ${message}`);
    // Client boundaries can parse the code back with AppError.parseCode(error).
    this.name = "AppError";
  }

  /**
   * Extracts the ErrorCode from an error caught by an error boundary.
   * Works for both client-thrown AppErrors and dev server errors.
   * Returns null for production server errors (message is sanitized by Next.js).
   */
  static parseCode(error: Error): ErrorCode | null {
    const match = error.message.match(/^\[([A-Z_]+)\]/);
    const code = match?.[1];
    return code && code in ErrorCode ? (code as ErrorCode) : null;
  }

  static fromHttpStatus(status: number, apiMessage?: string): AppError {
    switch (status) {
      case 401:
        return new AppError(
          ErrorCode.INVALID_CREDENTIALS,
          apiMessage ?? "Invalid email or password.",
        );
      case 403:
        return new AppError(
          ErrorCode.FORBIDDEN,
          apiMessage ?? "You do not have permission to access this resource.",
        );
      case 404:
        return new AppError(
          ErrorCode.NOT_FOUND,
          apiMessage ?? "The requested resource was not found.",
        );
      case 408:
      case 504:
        return new AppError(
          ErrorCode.REQUEST_TIMEOUT,
          "The request timed out. Please try again.",
        );
      case 409:
        return new AppError(
          ErrorCode.CONFLICT,
          apiMessage ?? "This resource already exists.",
        );
      case 406:
        return new AppError(
          ErrorCode.UNAUTHORIZED,
          apiMessage ?? "Authentication required. Please log in again.",
        );
      case 422:
        return new AppError(
          ErrorCode.VALIDATION_FAILED,
          apiMessage ?? "The submitted data is invalid.",
        );
      case 503:
        return new AppError(
          ErrorCode.SERVICE_UNAVAILABLE,
          "Service is temporarily unavailable. Please try again later.",
        );
      default:
        if (status >= 500) {
          return new AppError(
            ErrorCode.SERVER_ERROR,
            "An unexpected server error occurred. Please try again.",
          );
        }
        return new AppError(
          ErrorCode.UNKNOWN,
          apiMessage ?? "Something went wrong.",
        );
    }
  }
}

// ── ActionResult ───────────────────────────────────────────────────────────────

/**
 * Discriminated union returned by all server actions.
 *
 * @example
 * const result = await someAction(...);
 * if (!result.ok) {
 *   // result.code is ErrorCode, result.message is a user-safe string
 * }
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; message: string };

// ── Logger ─────────────────────────────────────────────────────────────────────

/**
 * Server-side logger. Swap the body for your observability provider
 * (Sentry, Datadog, Axiom, etc.) without touching call sites.
 */
export function logError(context: string, error: unknown): void {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    console.error(`[${context}]`, error);
    return;
  }

  // Production: structured JSON — pipe to your log aggregator
  console.error(
    JSON.stringify({
      level: "error",
      context,
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof AppError ? error.code : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }),
  );
}
