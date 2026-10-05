import apiClient from "@/lib/apiClient";
import type { AuditLog, ListAuditLogsParams, Paged } from "@/types/admin.type";

export async function listAuditLogs(
  params: ListAuditLogsParams = {},
  signal?: AbortSignal,
): Promise<Paged<AuditLog>> {
  const result = await apiClient<AuditLog[]>("/admin/audit-logs", {
    query: params,
    signal,
  });
  return {
    data: result.data,
    meta: result.meta ?? {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      total: result.data.length,
      totalPages: 1,
    },
  };
}
