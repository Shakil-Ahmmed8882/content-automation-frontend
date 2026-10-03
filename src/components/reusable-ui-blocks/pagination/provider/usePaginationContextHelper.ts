"use client";

import { useCallback, useState } from "react";

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export function usePaginationContextHelper() {
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const syncMeta = useCallback((incoming: PaginationMeta) => {
    setMeta(incoming);
    // Keep currentPage in sync if the server corrects it
    setCurrentPage(incoming.current_page);
  }, []);

  return {
    currentPage,
    goToPage,
    meta,
    syncMeta,
  };
}
