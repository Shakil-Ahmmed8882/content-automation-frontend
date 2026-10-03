import apiClient from "@/lib/apiClient";
import type { ExecutionListItem } from "@/types/execution.type";

export async function listExecutions(
  params: { page?: number; limit?: number; sort?: string } = {},
  signal?: AbortSignal,
) {
  return apiClient<ExecutionListItem[]>("/executions", {
    query: params,
    signal,
  });
}
