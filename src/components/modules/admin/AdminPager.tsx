"use client";

import { useEffect, useRef } from "react";
import { Pagination } from "@/components/reusable-ui-blocks/pagination/Pagination";
import {
  PaginationProvider,
  usePaginationSelector,
} from "@/components/reusable-ui-blocks/pagination/provider/PaginationContext";
import type { PageMeta } from "@/types/admin.type";

type PagerProps = {
  page: number;
  meta: PageMeta | undefined;
  onPageChange: (page: number) => void;
};

function PagerBridge({ page, meta, onPageChange }: PagerProps) {
  const { currentPage, goToPage, syncMeta } = usePaginationSelector();
  const urlPage = useRef(page);

  // The URL is the source of truth: follow it when it changes.
  useEffect(() => {
    urlPage.current = page;
    if (currentPage !== page) goToPage(page);
    // biome-ignore lint/correctness/useExhaustiveDependencies: only react to URL page changes
  }, [page]);

  // A click in <Pagination> moves currentPage away from the URL page.
  useEffect(() => {
    if (currentPage === urlPage.current) return;
    urlPage.current = currentPage;
    onPageChange(currentPage);
  }, [currentPage, onPageChange]);

  useEffect(() => {
    if (!meta) return;
    syncMeta({
      current_page: meta.page,
      last_page: meta.totalPages,
      per_page: meta.limit,
      total: meta.total,
    });
  }, [meta, syncMeta]);

  return (
    <Pagination className="mt-4 rounded-lg border border-border bg-card p-4 shadow-card [&_*]:text-foreground" />
  );
}

export function AdminPager(props: PagerProps) {
  return (
    <PaginationProvider>
      <PagerBridge {...props} />
    </PaginationProvider>
  );
}
