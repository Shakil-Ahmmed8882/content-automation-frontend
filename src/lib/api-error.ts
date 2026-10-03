import { FetchError } from "ofetch";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;
  readonly sessionExpired: boolean;

  constructor(
    status: number,
    message: string,
    body?: unknown,
    sessionExpired = false,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.sessionExpired = sessionExpired;
    this.fieldErrors = {};
    if (isRecord(body) && isRecord(body.errors)) {
      for (const [key, value] of Object.entries(body.errors)) {
        if (typeof value === "string") this.fieldErrors[key] = value;
      }
    }
  }

  get userMessage() {
    if (this.sessionExpired)
      return "Your session expired. Please sign in again.";
    if (this.status === 429)
      return "Too many attempts. Please try again later.";
    if (this.status >= 500)
      return "Something went wrong on our side. Please try again.";
    if (this.status === 0)
      return "Couldn't reach the server. Check your connection and try again.";
    return this.message || "Something went wrong. Please try again.";
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof FetchError) {
    const status = error.response?.status ?? 0;
    const body: unknown = error.data;
    const message =
      isRecord(body) && typeof body.message === "string" ? body.message : "";
    return new ApiError(status, message, body);
  }
  return new ApiError(0, "The request could not be completed.");
}
