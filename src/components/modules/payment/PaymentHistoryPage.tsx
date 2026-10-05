"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ScrollableTabsHeader } from "@/components/reusable-ui-blocks/common-modules/scrollable-tabs-header/ScrollableTabsHeader";
import { Pagination } from "@/components/reusable-ui-blocks/pagination/Pagination";
import {
  PaginationProvider,
  usePaginationSelector,
} from "@/components/reusable-ui-blocks/pagination/provider/PaginationContext";
import { NoResultFoundWrapper } from "@/components/reusable-ui-blocks/placeholder/no-results-found-wrapper/NoResultFoundWrapper";
import { TabsProvider } from "@/components/reusable-ui-blocks/tabs/TabsProvider";
import type { Tab } from "@/components/reusable-ui-blocks/tabs/tabs.type";
import { Button } from "@/components/ui/button";
import { usePaymentHistory } from "@/hooks/payment.hook";
import { useSession } from "@/hooks/auth.hook";
import { routes } from "@/routes";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/types/payment.type";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import {
  EmptyPaymentsState,
  PaymentErrorState,
  PaymentListSkeleton,
} from "./PaymentStateBlocks";
import {
  formatMoney,
  formatPaymentDate,
  paymentErrorMessage,
} from "./payment.utils";

const STATUS_TABS: Tab[] = [
  { id: "all", value: "All" },
  { id: "SUCCESS", value: "Success" },
  { id: "PENDING", value: "Pending" },
  { id: "FAILED", value: "Failed" },
  { id: "CANCELLED", value: "Cancelled" },
];

function parseStatus(value: string | null): PaymentStatus | undefined {
  return PAYMENT_STATUSES.find((status) => status === value);
}

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function PaymentHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const { currentPage, goToPage, syncMeta } = usePaginationSelector();
  const page = parsePage(searchParams.get("page"));
  const status = parseStatus(searchParams.get("status"));
  const applyingUrlPage = useRef(false);

  const params = useMemo(() => ({ page, limit: 10, status }), [page, status]);
  const query = usePaymentHistory(params);

  const updateSearch = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      router.push(`${routes.paymentHistory}?${next.toString()}`);
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
    if (currentPage !== page) updateSearch({ page: String(currentPage) });
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
  const showUpgrade = session.data?.isPremium === false;

  return (
    <section className="space-y-6" aria-labelledby="payment-history-title">
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
          title="Payment history"
          tabs={STATUS_TABS}
          className="rounded-lg border border-border bg-card p-5 shadow-card"
          right={
            showUpgrade ? (
              <Button asChild size="sm">
                <Link href={routes.payment}>Upgrade</Link>
              </Button>
            ) : undefined
          }
        />
      </TabsProvider>

      {query.isPending ? (
        <PaymentListSkeleton />
      ) : query.isError ? (
        <PaymentErrorState
          title="Couldn't load your payments"
          message={paymentErrorMessage(query.error)}
          retry={() => void query.refetch()}
        />
      ) : (
        <NoResultFoundWrapper
          data={query.data.data}
          fallback={
            <EmptyPaymentsState
              filtered={Boolean(status)}
              showUpgrade={showUpgrade}
            />
          }
        >
          <ul className="space-y-3" aria-label="Payment history">
            {query.data.data.map((payment) => (
              <li key={payment.id}>
                <Link
                  href={routes.paymentHistoryDetail(payment.id)}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-card transition-[border-color,background-color] duration-150 hover:border-ring hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-ring sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-base font-medium">
                      {formatMoney(payment)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatPaymentDate(payment.createdAt)}
                    </p>
                  </div>
                  <p className="min-w-0 truncate font-mono text-xs text-muted-foreground">
                    {payment.merchantInvoiceNumber}
                  </p>
                  <PaymentStatusBadge status={payment.status} />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination className="mt-6 rounded-lg border border-border bg-card p-4 shadow-card [&_*]:text-foreground" />
        </NoResultFoundWrapper>
      )}
    </section>
  );
}

export function PaymentHistoryPage() {
  return (
    <PaginationProvider>
      <PaymentHistoryContent />
    </PaginationProvider>
  );
}
