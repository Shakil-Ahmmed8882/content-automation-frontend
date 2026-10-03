"use client";

import type { ReactNode } from "react";
import { ShowIf } from "@/components/reusable-ui-blocks/guard/ShowIf";
import { useInfiniteScrollSelector } from "../provider/InfiniteScrollProvider";

interface InfiniteScrollRendererProps {
  // The accumulated items (already-rendered grid/list) — always visible at top.
  children: ReactNode;
  // Shimmer shown below the items only while the next page is loading. Optional —
  // omit it to fall back to a plain sentinel with no visible loading state.
  paginationSkeleton?: ReactNode;
}

export function InfiniteScrollRenderer({
  children,
  paginationSkeleton,
}: InfiniteScrollRendererProps) {
  const triggerRef = useInfiniteScrollSelector((s) => s.triggerRef);
  const isPaginationLoading = useInfiniteScrollSelector(
    (s) => s.query.isFetchingNextPage,
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      {children}
      <ShowIf condition={isPaginationLoading}>{paginationSkeleton}</ShowIf>
      {/* Sentinel — observed to trigger the next page */}
      <div ref={triggerRef} className="h-1 w-full" />
    </div>
  );
}
