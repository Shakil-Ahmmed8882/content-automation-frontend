import { ApiError } from "@/lib/api-error";
import type {
  ExecutionDetail,
  PublicationDetail,
} from "@/types/execution.type";

export function formatDateTime(value: string | null) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.status >= 400 && error.status < 500
      ? error.message
      : error.userMessage;
  }
  return "Something went wrong. Please try again.";
}

export function platformNameFromKey(key: string) {
  return key
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

export function needsConnectionAction(message: string) {
  return /\bconnect\b|\breconnect\b|expired/i.test(message);
}

export function outcomeMessage(execution: ExecutionDetail) {
  if (execution.status === "COMPLETED") return "Published successfully.";
  if (execution.status === "FAILED") return "Publishing failed. You can retry.";
  const successful = execution.publications
    .filter((publication) => publication.status === "SUCCESS")
    .map((publication) => publication.platform.name);
  const failed = execution.publications
    .filter((publication) => publication.status === "FAILED")
    .map((publication) => publication.platform.name);
  if (successful.length > 0 && failed.length > 0) {
    return `${formatNameList(successful)} published successfully, but ${formatNameList(
      failed,
    )} failed.`;
  }
  return "Publishing failed. You can retry.";
}

export function formatNameList(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

export function successfulPublications(publications: PublicationDetail[]) {
  return publications.filter(
    (publication) =>
      publication.status === "SUCCESS" && publication.externalPostUrl,
  );
}

export function failedPublications(publications: PublicationDetail[]) {
  return publications.filter((publication) => publication.status === "FAILED");
}
