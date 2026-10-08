"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BaseButton } from "@/components/reusable-ui-blocks/buttons/BaseButton";
import { BaseImage } from "@/components/reusable-ui-blocks/images/BaseImage";
import {
  useExecution,
  useRetryExecution,
  useRetryPublication,
} from "@/hooks/execution.hook";
import { ApiError } from "@/lib/api-error";
import { isActiveExecution, isTerminalExecution } from "@/lib/status";
import { routes } from "@/routes/app.routes";
import type {
  ExecutionStatus,
  PublicationDetail,
} from "@/types/execution.type";
import {
  ErrorState,
  ExecutionPageSkeleton,
  NotFoundExecutionState,
} from "./ExecutionStateBlocks";
import { ExecutionStatusBadge, PublicationStatusBadge } from "./StatusBadge";
import {
  failedPublications,
  formatDateTime,
  getErrorMessage,
  needsConnectionAction,
  outcomeMessage,
  successfulPublications,
} from "./utils";
import { WorkflowGraph } from "./WorkflowGraph";

function CompletionToastDescription({
  publications,
}: {
  publications: PublicationDetail[];
}) {
  const successes = successfulPublications(publications);
  const failures = failedPublications(publications);
  return (
    <div className="mt-2 space-y-1 text-sm">
      {successes.map((publication) => (
        <a
          key={publication.id}
          href={publication.externalPostUrl ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="block underline"
        >
          View {publication.platform.name} post
        </a>
      ))}
      {failures.map((publication) => (
        <p key={publication.id}>
          {publication.platform.name}:{" "}
          {publication.failureReason ?? "Publish failed"}
        </p>
      ))}
    </div>
  );
}

function RetryErrorToast(error: unknown, router: ReturnType<typeof useRouter>) {
  const message = getErrorMessage(error);
  toast.error(message, {
    action: needsConnectionAction(message)
      ? {
          label: "Connections",
          onClick: () => router.push(routes.connections),
        }
      : undefined,
  });
}

export function ExecutionDetailPage({ executionId }: { executionId: string }) {
  const router = useRouter();
  const query = useExecution(executionId);
  const retryPublication = useRetryPublication(executionId);
  const retryExecution = useRetryExecution(executionId);
  const previousStatus = useRef<ExecutionStatus | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const execution = query.data;
  const retryablePublications = useMemo(
    () =>
      execution?.publications.filter((publication) => publication.retryable) ??
      [],
    [execution?.publications],
  );

  useEffect(() => {
    if (!execution || !isActiveExecution(execution.status)) return;
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, [execution]);

  useEffect(() => {
    if (!execution) return;
    const last = previousStatus.current;
    if (
      last &&
      isActiveExecution(last) &&
      isTerminalExecution(execution.status)
    ) {
      const message = outcomeMessage(execution);
      const description = (
        <CompletionToastDescription publications={execution.publications} />
      );
      if (execution.status === "COMPLETED") {
        toast.success(message, { description });
      } else if (execution.status === "PARTIALLY_COMPLETED") {
        toast.warning(message, { description });
      } else {
        toast.error(message, { description });
      }
    }
    previousStatus.current = execution.status;
  }, [execution]);

  if (query.isPending) return <ExecutionPageSkeleton />;
  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) {
      return <NotFoundExecutionState />;
    }
    return (
      <ErrorState
        message={getErrorMessage(query.error)}
        retry={() => void query.refetch()}
      />
    );
  }
  if (!execution) return <NotFoundExecutionState />;

  const isActive = isActiveExecution(execution.status);
  const activeAge = now - Date.parse(execution.createdAt);
  const showSlowNotice = isActive && activeAge > 300_000;

  return (
    <section className="space-y-6" aria-labelledby="execution-title">
      <section className="rounded-lg border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Execution</p>
            <h1
              id="execution-title"
              className="mt-2 truncate text-display-md tracking-[-0.04em]"
            >
              {execution.post.title || "Untitled post"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isActive
                ? "Publishing started. You can leave this page."
                : outcomeMessage(execution)}
            </p>
          </div>
          <div aria-live="polite">
            <ExecutionStatusBadge status={execution.status} />
          </div>
        </div>

        {showSlowNotice ? (
          <div className="mt-5 rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            <p className="font-medium">Taking longer than expected.</p>
            <p className="mt-1">
              The background worker may still be processing this execution.
            </p>
            <BaseButton
              type="button"
              className="mt-3 border border-warning bg-transparent text-warning hover:bg-warning/10"
              onClick={() => void query.refetch()}
            >
              Refresh
            </BaseButton>
          </div>
        ) : null}

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Started</dt>
            <dd className="mt-1 font-medium">
              {formatDateTime(execution.startedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Completed</dt>
            <dd className="mt-1 font-medium">
              {formatDateTime(execution.completedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="mt-1 font-medium">
              {formatDateTime(execution.createdAt)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-lg border border-border bg-card p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-display-sm tracking-[-0.04em]">Post content</h2>
            {execution.post.isDeleted ? (
              <span className="rounded-sm bg-warning/10 px-2 py-1 text-xs text-warning">
                Post deleted
              </span>
            ) : null}
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-6">
            {execution.post.content}
          </p>
        </article>
        {execution.post.imageUrl ? (
          <div className="relative min-h-64 overflow-hidden rounded-lg border border-border bg-card shadow-card outline outline-1 outline-border">
            <BaseImage
              src={execution.post.imageUrl}
              alt={execution.post.title ?? "Published post image"}
              className="h-full min-h-64 w-full"
            />
          </div>
        ) : null}
      </section>

      <WorkflowGraph execution={execution} />

      <section
        className="rounded-lg border border-border bg-card p-6 shadow-card"
        aria-labelledby="platform-results-title"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Results</p>
            <h2
              id="platform-results-title"
              className="mt-2 text-display-sm tracking-[-0.04em]"
            >
              Platform results
            </h2>
          </div>
          {retryablePublications.length > 0 ? (
            <BaseButton
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary-hover active:scale-[0.96]"
              isLoading={retryExecution.isPending}
              onClick={() =>
                retryExecution.mutate(undefined, {
                  onSuccess: (result) => {
                    toast.success(
                      `Retry started for ${result.retried} failed publication${result.retried === 1 ? "" : "s"}.`,
                    );
                  },
                  onError: (error) => RetryErrorToast(error, router),
                })
              }
            >
              Retry {retryablePublications.length} failed
            </BaseButton>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4">
          {execution.publications.map((publication) => (
            <article
              key={publication.id}
              className="rounded-md border border-border bg-background p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-medium">
                    {publication.platform.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {publication.platformAccountName ??
                      "Account snapshot unavailable"}
                  </p>
                </div>
                <PublicationStatusBadge status={publication.status} />
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Published</dt>
                  <dd className="mt-1 font-medium">
                    {formatDateTime(publication.publishedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Retry count</dt>
                  <dd className="mt-1 font-medium">{publication.retryCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">External post</dt>
                  <dd className="mt-1 font-medium">
                    {publication.externalPostUrl ? (
                      <a
                        href={publication.externalPostUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        View post
                      </a>
                    ) : (
                      "Not available"
                    )}
                  </dd>
                </div>
              </dl>
              {publication.failureReason ? (
                <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {publication.failureReason}
                </p>
              ) : null}
              {publication.retryable ? (
                <BaseButton
                  type="button"
                  className="mt-4 border border-border bg-background text-foreground hover:bg-accent active:scale-[0.96]"
                  isLoading={
                    retryPublication.isPending &&
                    retryPublication.variables === publication.id
                  }
                  onClick={() =>
                    retryPublication.mutate(publication.id, {
                      onSuccess: () => toast.success("Retry started."),
                      onError: (error) => RetryErrorToast(error, router),
                    })
                  }
                >
                  Retry {publication.platform.name}
                </BaseButton>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <Link
        href={routes.executions}
        className="inline-flex text-sm font-medium text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        Back to executions
      </Link>
    </section>
  );
}
