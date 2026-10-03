"use client";

import type { InfiniteScrollQuery } from "./types";
import { useInfiniteScrollObserver } from "./useInfiniteScrollObserver";

// ── Context Helper ────────────────────────────────────────────────────────────

/**
 * Takes the whole react-query result and reads the standard infinite-query
 * fields off it — no per-prop destructuring across the layers. The query is
 * also exposed in context so the renderer can read `isFetchingNextPage`
 * without the layout passing it down.
 */
export function useInfiniteScrollContextHelper(query: InfiniteScrollQuery) {
  const { triggerRef } = useInfiniteScrollObserver({
    hasMore: query?.hasNextPage,
    isFetching: query?.isFetchingNextPage,
    onIntersect: query?.fetchNextPage,
  });

  return { triggerRef, query };
}
