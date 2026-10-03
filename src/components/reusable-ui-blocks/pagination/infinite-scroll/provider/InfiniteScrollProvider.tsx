"use client";

import type { ReactNode } from "react";
import { makeSelectorContext } from "@/components/reusable-ui-blocks/shared-context/makeSelectorContext";
import { useContextSelector } from "@/components/reusable-ui-blocks/shared-context/useContextSelector";
import type { InfiniteScrollQuery } from "./types";
import { useInfiniteScrollContextHelper } from "./useInfiniteScrollContextHelper";

// 1. Infer type from the helper hook — never write it manually
type TInfiniteScroll = ReturnType<typeof useInfiniteScrollContextHelper>;

// 2. Create context + base provider via shared factory
export const {
  Context: InfiniteScrollContext,
  Provider: InfiniteScrollContextProvider,
} = makeSelectorContext<TInfiniteScroll>("InfiniteScroll");

// ── Types ─────────────────────────────────────────────────────────────────────

interface InfiniteScrollProviderProps {
  children: ReactNode;
  // The whole react-query useInfiniteQuery result — passed straight through.
  query: InfiniteScrollQuery;
}

// 3. Provider — hands the whole query to the helper, nothing else
export function InfiniteScrollProvider({
  children,
  query,
}: InfiniteScrollProviderProps) {
  const value = useInfiniteScrollContextHelper(query);

  return (
    <InfiniteScrollContextProvider value={value}>
      {children}
    </InfiniteScrollContextProvider>
  );
}

// 4. Selector hook — consumers use this, never import the context directly
export function useInfiniteScrollSelector<R>(s: (state: TInfiniteScroll) => R) {
  return useContextSelector(InfiniteScrollContext, "InfiniteScroll", s);
}
