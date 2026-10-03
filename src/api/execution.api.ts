import apiClient from "@/lib/apiClient";
import type {
  ExecutionDetail,
  ExecutionListItem,
  ExecutionListParams,
  RetryExecutionResult,
  RetryPublicationResult,
  StartPublishResult,
} from "@/types/execution.type";

export async function getExecutions(
  params: ExecutionListParams = {},
  signal?: AbortSignal,
) {
  return apiClient<ExecutionListItem[]>("/executions", {
    query: params,
    signal,
  });
}

export const listExecutions = getExecutions;

export async function getExecution(id: string, signal?: AbortSignal) {
  return (await apiClient<ExecutionDetail>(`/executions/${id}`, { signal }))
    .data;
}

export async function publishPost(postId: string, platforms: string[]) {
  return (
    await apiClient<StartPublishResult>(`/posts/${postId}/publish`, {
      method: "POST",
      body: { platforms },
    })
  ).data;
}

export async function retryPublication(publicationId: string) {
  return (
    await apiClient<RetryPublicationResult>(
      `/publications/${publicationId}/retry`,
      { method: "POST" },
    )
  ).data;
}

export async function retryExecution(executionId: string) {
  return (
    await apiClient<RetryExecutionResult>(`/executions/${executionId}/retry`, {
      method: "POST",
    })
  ).data;
}
