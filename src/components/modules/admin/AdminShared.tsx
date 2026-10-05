"use client";

import type { ReactNode } from "react";
import { BaseSkeleton } from "@/components/reusable-ui-blocks/placeholder/skeletons/BaseSkeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-link-bg-soft text-link",
};

export function AdminBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="text-display-sm tracking-[-0.04em]">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

const SKELETON_ROWS = ["a", "b", "c", "d", "e"] as const;

export function AdminListSkeleton({ label }: { label: string }) {
  return (
    <output className="block space-y-2" aria-label={label}>
      {SKELETON_ROWS.map((row) => (
        <BaseSkeleton key={row} className="h-14 w-full rounded-md" />
      ))}
    </output>
  );
}

export function AdminErrorState({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <section
      role="alert"
      className="rounded-lg border border-border bg-card p-6 shadow-card"
    >
      <h2 className="text-display-sm tracking-[-0.04em]">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Button
        type="button"
        className="mt-5"
        onClick={onRetry}
        disabled={retrying}
      >
        Retry
      </Button>
    </section>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-8 text-center shadow-card">
      <h2 className="text-display-sm tracking-[-0.04em]">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}

export function AdminTableShell({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">{label}</caption>
        {children}
      </table>
    </div>
  );
}

export const thClass =
  "eyebrow whitespace-nowrap border-b border-border px-4 py-3 text-left font-medium";
export const tdClass = "border-b border-border-extra-light px-4 py-3 align-middle";

export function formatAdminDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatAdminDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
