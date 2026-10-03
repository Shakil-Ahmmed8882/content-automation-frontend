"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ScrollableTabsHeader } from "@/components/reusable-ui-blocks/common-modules/scrollable-tabs-header/ScrollableTabsHeader";
import { buildDateFilterQueryParams } from "@/components/reusable-ui-blocks/common-modules/utils/buildDateFilterQueryParams";
import type { DateRangeFilter } from "@/components/reusable-ui-blocks/common-modules/utils/getDateRangeFromFilter";
import { DateRangePresetFilter } from "@/components/reusable-ui-blocks/dates/date-filter";
import { Pagination } from "@/components/reusable-ui-blocks/pagination/Pagination";
import {
  PaginationProvider,
  usePaginationSelector,
} from "@/components/reusable-ui-blocks/pagination/provider/PaginationContext";
import { NoResultFoundWrapper } from "@/components/reusable-ui-blocks/placeholder/no-results-found-wrapper/NoResultFoundWrapper";
import { TabsProvider } from "@/components/reusable-ui-blocks/tabs/TabsProvider";
import type { Tab } from "@/components/reusable-ui-blocks/tabs/tabs.type";
import { useExecutions } from "@/hooks/execution.hook";
import { routes } from "@/routes/app.routes";
import type { ExecutionStatus } from "@/types/execution.type";
import {
  EmptyExecutionsState,
  ErrorState,
  ExecutionListSkeleton,
} from "./ExecutionStateBlocks";
import { ExecutionStatusBadge, PublicationStatusBadge } from "./StatusBadge";
import { formatDateTime, getErrorMessage } from "./utils";

const STATUS_TABS: Tab[] = [
  { id: "all", value: "All" },
  { id: "PENDING", value: "Queued" },
  { id: "RUNNING", value: "Publishing" },
  { id: "COMPLETED", value: "Published" },
  { id: "PARTIALLY_COMPLETED", value: "Partial" },
  { id: "FAILED", value: "Failed" },
];

function isExecutionStatus(value: string | null): value is ExecutionStatus {
  return (
    value === "PENDING" ||
    value === "RUNNING" ||
    value === "COMPLETED" ||
    value === "PARTIALLY_COMPLETED" ||
    value === "FAILED"
  );
}

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseDate(value: string | null | undefined) {
  if (!value) return undefined;
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function ExecutionsHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentPage, goToPage, syncMeta } = usePaginationSelector();
  const page = parsePage(searchParams.get("page"));
  const statusParam = searchParams.get("status");
  const status = isExecutionStatus(statusParam) ? statusParam : undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const applyingUrlPage = useRef(false);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      sort: "-createdAt",
      status,
      dateFrom,
      dateTo,
    }),
    [dateFrom, dateTo, page, status],
  );
  const query = useExecutions(params);

  const updateSearch = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      router.push(`${routes.executions}?${next.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (currentPage === page) return;
    applyingUrlPage.current = true;
    goToPage(page);
  }, [currentPage, goToPage, page]);

  useEffect(() => {
    if (applyingUrlPage.current) {
      applyingUrlPage.current = false;
      return;
    }
    if (currentPage !== page) {
      updateSearch({ page: String(currentPage) });
    }
  }, [currentPage, page, updateSearch]);

  useEffect(() => {
    if (!query.data?.meta) return;
    syncMeta({
      current_page: query.data.meta.page,
      last_page: query.data.meta.totalPages,
      per_page: query.data.meta.limit,
      total: query.data.meta.total,
    });
  }, [query.data?.meta, syncMeta]);

  const activeTab = status ?? "all";
  const customStartDate = parseDate(dateFrom);
  const customEndDate = parseDate(dateTo);

  return (
    <section className="space-y-6" aria-labelledby="executions-title">
      <TabsProvider
        activeTabs={[activeTab]}
        setActiveTabs={(nextTabs) => {
          const next =
            typeof nextTabs === "function" ? nextTabs([activeTab]) : nextTabs;
          const nextStatus = next[0] === "all" ? undefined : next[0];
          updateSearch({ status: nextStatus, page: "1" });
        }}
      >
        <ScrollableTabsHeader
          title="Executions"
          tabs={STATUS_TABS}
          className="rounded-lg border border-border bg-card p-5 shadow-card [&_*]:border-border [&_*]:text-foreground"
          right={
            <DateRangePresetFilter
              emptyLabel="Date"
              initialPreset={
                customStartDate && customEndDate ? "custom_date" : undefined
              }
              initialCustomRange={
                customStartDate && customEndDate
                  ? { from: customStartDate, to: customEndDate }
                  : undefined
              }
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-sm border border-border bg-background px-4 text-sm font-medium text-foreground transition-[background-color,border-color] duration-150 hover:bg-accent"
              buttonColor="bg-background"
              iconClassName="size-4 shrink-0"
              onChange={(_range, selection) => {
                const queryParams = buildDateFilterQueryParams({
                  dateType: selection.preset as DateRangeFilter | undefined,
                  customStartDate: selection.customRange?.from,
                  customEndDate: selection.customRange?.to,
                });
                updateSearch({
                  dateFrom: queryParams.start_date,
                  dateTo: queryParams.end_date,
                  page: "1",
                });
              }}
            />
          }
        />
      </TabsProvider>

      {query.isPending ? (
        <ExecutionListSkeleton />
      ) : query.isError ? (
        <ErrorState
          message={getErrorMessage(query.error)}
          retry={() => void query.refetch()}
        />
      ) : (
        <NoResultFoundWrapper
          data={query.data.data}
          fallback={<EmptyExecutionsState />}
        >
          <div className="space-y-3" aria-live="polite">
            {query.data.data.map((execution) => (
              <Link
                key={execution.id}
                href={routes.executionDetail(execution.id)}
                className="block rounded-lg border border-border bg-card p-4 shadow-card transition-[border-color,background-color] duration-150 hover:border-ring hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-ring"
              >
                <article className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-medium">
                      {execution.post.title ||
                        execution.post.contentPreview ||
                        "Untitled post"}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {execution.post.contentPreview}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Started {formatDateTime(execution.startedAt)} · Completed{" "}
                      {formatDateTime(execution.completedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
                    {execution.platforms.map((platform) => (
                      <PublicationStatusBadge
                        key={`${execution.id}-${platform.key}`}
                        status={platform.status}
                        className="max-w-full"
                      />
                    ))}
                    <ExecutionStatusBadge status={execution.status} />
                  </div>
                </article>
              </Link>
            ))}
          </div>
          <Pagination className="mt-6 rounded-lg border border-border bg-card p-4 shadow-card [&_*]:text-foreground" />
        </NoResultFoundWrapper>
      )}
    </section>
  );
}

export function ExecutionsHistoryPage() {
  return (
    <PaginationProvider>
      <ExecutionsHistoryContent />
    </PaginationProvider>
  );
}
