import Link from "next/link";
import type { ReactNode } from "react";
import { CenteredError } from "@/components/modules/shared/CenteredError";
import { BaseSkeleton } from "@/components/reusable-ui-blocks/placeholder/skeletons/BaseSkeleton";
import { Button } from "@/components/ui/button";
import { routes } from "@/routes/app.routes";

const EXECUTION_LIST_SKELETON_ROWS = [
  "execution-skeleton-1",
  "execution-skeleton-2",
  "execution-skeleton-3",
  "execution-skeleton-4",
  "execution-skeleton-5",
] as const;

export function ExecutionPageSkeleton() {
  return (
    <output className="block space-y-6" aria-label="Loading execution">
      <BaseSkeleton className="h-24 w-full rounded-lg" />
      <BaseSkeleton className="h-72 w-full rounded-lg" />
      <div className="grid gap-4 md:grid-cols-2">
        <BaseSkeleton className="h-40 rounded-lg" />
        <BaseSkeleton className="h-40 rounded-lg" />
      </div>
    </output>
  );
}

export function ExecutionListSkeleton() {
  return (
    <output className="block space-y-3" aria-label="Loading executions">
      {EXECUTION_LIST_SKELETON_ROWS.map((row) => (
        <BaseSkeleton key={row} className="h-28 w-full rounded-lg" />
      ))}
    </output>
  );
}

export function ErrorState({
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
    <CenteredError title={title} message={message}>
      {retry ? (
        <Button type="button" onClick={retry}>
          Try again
        </Button>
      ) : null}
      {action}
    </CenteredError>
  );
}

export function EmptyExecutionsState({
  onClearFilters,
}: {
  /** Pass when a status or date filter is active, so the empty state blames the filter. */
  onClearFilters?: () => void;
}) {
  if (onClearFilters) {
    return (
      <section className="rounded-lg border border-border bg-card p-8 text-center shadow-card">
        <h2 className="text-display-sm tracking-[-0.04em]">
          No executions match these filters
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Try a different status or date range.
        </p>
        <Button type="button" className="mt-6" onClick={onClearFilters}>
          Clear filters
        </Button>
      </section>
    );
  }
  return (
    <section className="rounded-lg border border-border bg-card p-8 text-center shadow-card">
      <h2 className="text-display-sm tracking-[-0.04em]">No executions yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Write your first post and publish it to LinkedIn and Facebook.
      </p>
      <Button asChild className="mt-6">
        <Link href={routes.create}>Create post</Link>
      </Button>
    </section>
  );
}

export function NotFoundExecutionState() {
  return (
    <ErrorState
      title="Execution not found"
      message="This execution is unavailable or you do not have access to it."
      action={
        <Button asChild variant="outline">
          <Link href={routes.executions}>Back to executions</Link>
        </Button>
      }
    />
  );
}
