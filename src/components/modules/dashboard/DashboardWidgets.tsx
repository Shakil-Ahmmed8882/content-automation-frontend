"use client";

import { Link2, Workflow } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { NoResultFoundWrapper } from "@/components/reusable-ui-blocks/placeholder/no-results-found-wrapper/NoResultFoundWrapper";
import { BaseSkeleton } from "@/components/reusable-ui-blocks/placeholder/skeletons/BaseSkeleton";
import { Button } from "@/components/ui/button";
import { useAuthCooldown } from "@/hooks/auth.hook";
import { useConnections, usePlatforms } from "@/hooks/connection.hook";
import { useRecentExecutions } from "@/hooks/execution.hook";
import { toApiError } from "@/lib/api-error";
import { executionStatus } from "@/lib/status";
import { routes } from "@/routes";

function Widget({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-lg bg-card p-5 shadow-card sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-base">{title}</h2>
        <Link
          href={href}
          className="rounded-sm text-sm text-link hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          View all
        </Link>
      </div>
      {children}
    </section>
  );
}

function WidgetLoading() {
  return (
    <output aria-label="Loading widget" className="block space-y-3">
      {[0, 1, 2].map((key) => (
        <BaseSkeleton key={key} className="h-14 w-full" />
      ))}
    </output>
  );
}

function WidgetError({
  error,
  retry,
  pending,
}: {
  error: unknown;
  retry: () => void;
  pending: boolean;
}) {
  const cooldown = useAuthCooldown();
  return (
    <div className="space-y-4">
      <p role="alert" className="text-sm text-muted-foreground">
        {toApiError(error).userMessage}
      </p>
      <Button
        variant="outline"
        disabled={pending || cooldown > 0}
        onClick={retry}
      >
        {cooldown > 0
          ? `Retry in ${cooldown}s`
          : pending
            ? "Retrying..."
            : "Retry"}
      </Button>
    </div>
  );
}

function EmptyWidget({
  icon,
  title,
  description,
  href,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
      <div className="rounded-md bg-muted p-3 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-sm">{title}</h3>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      <Button asChild variant="outline">
        <Link href={href}>{action}</Link>
      </Button>
    </div>
  );
}

export function ConnectionsSummaryCard() {
  const connections = useConnections();
  const platforms = usePlatforms();
  const error = connections.error ?? platforms.error;
  const pending = connections.isPending || platforms.isPending;
  return (
    <Widget title="Connected platforms" href={routes.connections}>
      {error ? (
        <WidgetError
          error={error}
          pending={connections.isFetching || platforms.isFetching}
          retry={() => {
            void connections.refetch();
            void platforms.refetch();
          }}
        />
      ) : pending ? (
        <WidgetLoading />
      ) : (
        <NoResultFoundWrapper
          data={connections.data ?? []}
          fallback={
            <EmptyWidget
              icon={<Link2 className="size-5" />}
              title="Connect your first platform"
              description="Link an account to start publishing. Your access tokens stay on the server."
              href={routes.connections}
              action="Explore connections"
            />
          }
        >
          <ul className="divide-y divide-border">
            {connections.data?.map((connection) => (
              <li
                key={connection.id}
                className="flex items-center justify-between gap-3 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {platforms.data?.find(
                      (platform) => platform.key === connection.platform.key,
                    )?.name ?? connection.platform.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {connection.platformAccountName ?? "Linked account"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-sm px-2 py-1 text-xs ${connection.status === "CONNECTED" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
                >
                  {connection.status === "CONNECTED" ? "Connected" : "Expired"}
                </span>
              </li>
            ))}
          </ul>
        </NoResultFoundWrapper>
      )}
    </Widget>
  );
}

export function RecentExecutionsCard() {
  const query = useRecentExecutions();
  return (
    <Widget title="Recent executions" href={routes.executions}>
      {query.isError ? (
        <WidgetError
          error={query.error}
          pending={query.isFetching}
          retry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <WidgetLoading />
      ) : (
        <NoResultFoundWrapper
          data={query.data.data}
          fallback={
            <EmptyWidget
              icon={<Workflow className="size-5" />}
              title="No executions yet"
              description="Your publishing history and per-platform results will appear here after your first publish."
              href={routes.create}
              action="Create a post"
            />
          }
        >
          <ul className="divide-y divide-border">
            {query.data.data.map((execution) => {
              const status = executionStatus[execution.status];
              return (
                <li key={execution.id}>
                  <Link
                    href={`${routes.executions}/${execution.id}`}
                    className="flex items-center justify-between gap-3 rounded-sm py-4 focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {execution.post.title || execution.post.contentPreview}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {execution.platforms
                          .map((platform) => platform.name)
                          .join(", ")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-sm px-2 py-1 text-xs ${status.tone}`}
                    >
                      {status.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </NoResultFoundWrapper>
      )}
    </Widget>
  );
}
