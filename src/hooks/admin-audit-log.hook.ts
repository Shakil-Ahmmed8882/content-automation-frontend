"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "@/api/admin-audit-log.api";
import type { ListAuditLogsParams } from "@/types/admin.type";

export function useAuditLogs(params: ListAuditLogsParams) {
  return useQuery({
    queryKey: ["admin", "audit-logs", params],
    queryFn: ({ signal }) => listAuditLogs(params, signal),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
