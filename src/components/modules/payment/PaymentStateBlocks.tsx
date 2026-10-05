import Link from "next/link";
import type { ReactNode } from "react";
import { BaseSkeleton } from "@/components/reusable-ui-blocks/placeholder/skeletons/BaseSkeleton";
import { Button } from "@/components/ui/button";
import { routes } from "@/routes";

const LIST_SKELETON_ROWS = [
  "payment-skeleton-1",
  "payment-skeleton-2",
  "payment-skeleton-3",
  "payment-skeleton-4",
] as const;

export function PaymentListSkeleton() {
  return (
    <output className="block space-y-3" aria-label="Loading payments">
      {LIST_SKELETON_ROWS.map((row) => (
        <BaseSkeleton key={row} className="h-20 w-full rounded-lg" />
      ))}
    </output>
  );
}

export function PaymentCardSkeleton({ label }: { label: string }) {
  return (
    <output className="mx-auto block max-w-md space-y-4" aria-label={label}>
      <BaseSkeleton className="h-64 w-full rounded-lg" />
    </output>
  );
}

export function PaymentErrorState({
  title = "Something went wrong",
  message,
  retry,
  action,
}: {
  title?: string;
  message: string;
  retry?: () => void;
  action?: ReactNode;
}) {
  return (
    <section
      className="rounded-lg border border-border bg-card p-6 shadow-card"
      role="alert"
    >
      <h2 className="text-display-sm tracking-[-0.04em]">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {retry ? (
          <Button type="button" onClick={retry}>
            Try again
          </Button>
        ) : null}
        {action}
      </div>
    </section>
  );
}

export function EmptyPaymentsState({
  filtered,
  showUpgrade,
}: {
  filtered: boolean;
  showUpgrade: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-8 text-center shadow-card">
      <h2 className="text-display-sm tracking-[-0.04em]">
        {filtered ? "No payments match this filter" : "No payments yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {filtered
          ? "Try a different status or show all payments."
          : "When you upgrade, your payments appear here."}
      </p>
      {filtered ? (
        <Button asChild variant="outline" className="mt-6">
          <Link href={routes.paymentHistory}>Show all</Link>
        </Button>
      ) : null}
      {!filtered && showUpgrade ? (
        <Button asChild className="mt-6">
          <Link href={routes.payment}>Go Premium</Link>
        </Button>
      ) : null}
    </section>
  );
}
