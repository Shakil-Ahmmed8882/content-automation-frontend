import { toApiError } from "@/lib/api-error";

export function apiMessage(error: unknown) {
  const normalized = toApiError(error);
  return normalized.message || normalized.userMessage;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function isPlatformKey(value: string) {
  return /^[a-z0-9-]+$/.test(value);
}
