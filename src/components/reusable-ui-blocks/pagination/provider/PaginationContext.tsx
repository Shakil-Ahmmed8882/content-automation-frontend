"use client";

import { makeSelectorContext } from "@/components/reusable-ui-blocks/shared-context/makeSelectorContext";
import { useContextSelector } from "@/components/reusable-ui-blocks/shared-context/useContextSelector";
import { usePaginationContextHelper } from "./usePaginationContextHelper";

// 1. Infer type from the helper hook — never write it manually
type TPagination = ReturnType<typeof usePaginationContextHelper>;

// 2. Create context + base provider via shared factory
export const { Context, Provider } =
  makeSelectorContext<TPagination>("Pagination");

// 3. Provider — calls the helper hook, nothing else
export function PaginationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Provider value={usePaginationContextHelper()}>{children}</Provider>;
}

// 4. Selector hook — only expose what consumers actually need
export const usePaginationSelector = () => ({
  currentPage: useContextSelector(Context, "Pagination", (s) => s.currentPage),
  goToPage: useContextSelector(Context, "Pagination", (s) => s.goToPage),
  meta: useContextSelector(Context, "Pagination", (s) => s.meta),
  syncMeta: useContextSelector(Context, "Pagination", (s) => s.syncMeta),
});
