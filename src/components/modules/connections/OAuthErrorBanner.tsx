"use client";

import { AlertCircle, X } from "lucide-react";
import { BaseButton } from "@/components/reusable-ui-blocks/buttons/BaseButton";

const bannerCopy = {
  cancelled: "Connection cancelled.",
  "invalid-state": "That connection attempt expired. Please try again.",
  failed: "We couldn't complete the connection. Please try again.",
} as const;

export type OAuthErrorCode = keyof typeof bannerCopy;

export function normalizeOAuthError(
  value: string | null,
): OAuthErrorCode | null {
  if (value === "cancelled" || value === "invalid-state" || value === "failed")
    return value;
  return null;
}

export function OAuthErrorBanner({
  code,
  onDismiss,
}: {
  code: OAuthErrorCode;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
    >
      <div className="flex min-w-0 gap-3">
        <AlertCircle
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-destructive"
        />
        <div>
          <p className="font-medium">Connection issue</p>
          <p className="mt-1 text-muted-foreground">{bannerCopy[code]}</p>
        </div>
      </div>
      <BaseButton
        type="button"
        aria-label="Dismiss connection error"
        onClick={onDismiss}
        className="h-8 w-8 shrink-0 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <X aria-hidden="true" className="size-4" />
      </BaseButton>
    </div>
  );
}
