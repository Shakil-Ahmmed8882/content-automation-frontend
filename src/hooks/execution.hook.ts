"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getExecution,
  getExecutions,
  listExecutions,
  publishPost,
  retryExecution,
  retryPublication,
} from "@/api/execution.api";
import { isActiveExecution } from "@/lib/status";
import type {
  ExecutionDetail,
  ExecutionListParams,
  PublicationDetail,
} from "@/types/execution.type";
import { useAuthCooldown } from "./auth.hook";

export const executionQueryKey = ["executions"] as const;
export const executionDetailQueryKey = (id: string) =>
  ["execution", id] as const;

function getPollInterval(createdAt: string) {
  const age = Date.now() - Date.parse(createdAt);
  return age > 60_000 ? 5000 : 3000;
}

function queuePublication(publication: PublicationDetail): PublicationDetail {
  return {
    ...publication,
    status: "PENDING",
    failureReason: null,
    retryable: false,
  };
}

export function useRecentExecutions() {
  const cooldown = useAuthCooldown();
  const params = { limit: 5, sort: "-createdAt" };
  return useQuery({
    queryKey: [...executionQueryKey, params],
    queryFn: ({ signal }) => listExecutions(params, signal),
    enabled: cooldown === 0,
  });
}

export function useExecutions(params: ExecutionListParams) {
  const cooldown = useAuthCooldown();
  return useQuery({
    queryKey: [...executionQueryKey, params],
    queryFn: ({ signal }) => getExecutions(params, signal),
    enabled: cooldown === 0,
    refetchInterval: (query) =>
      query.state.data?.data.some((item) => isActiveExecution(item.status))
        ? 10_000
        : false,
    refetchIntervalInBackground: false,
  });
}

export function useExecution(id: string) {
  const cooldown = useAuthCooldown();
  return useQuery({
    queryKey: executionDetailQueryKey(id),
    queryFn: ({ signal }) => getExecution(id, signal),
    enabled: cooldown === 0 && id.trim().length > 0,
    staleTime: 0,
    retry: 3,
    refetchInterval: (query) => {
      const execution = query.state.data;
      if (!execution || !isActiveExecution(execution.status)) return false;
      return getPollInterval(execution.createdAt);
    },
    refetchIntervalInBackground: false,
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      platforms,
    }: {
      postId: string;
      platforms: string[];
    }) => publishPost(postId, platforms),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: executionQueryKey });
      void queryClient.invalidateQueries({
        queryKey: executionDetailQueryKey(result.executionId),
      });
    },
  });
}

export function useRetryPublication(executionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicationId: string) => retryPublication(publicationId),
    onMutate: async (publicationId) => {
      await queryClient.cancelQueries({
        queryKey: executionDetailQueryKey(executionId),
      });
      const previous = queryClient.getQueryData<ExecutionDetail>(
        executionDetailQueryKey(executionId),
      );
      if (previous) {
        queryClient.setQueryData<ExecutionDetail>(
          executionDetailQueryKey(executionId),
          {
            ...previous,
            status: "RUNNING",
            publications: previous.publications.map((publication) =>
              publication.id === publicationId
                ? queuePublication(publication)
                : publication,
            ),
          },
        );
      }
      return { previous };
    },
    onError: (_error, _publicationId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          executionDetailQueryKey(executionId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: executionDetailQueryKey(executionId),
      });
      void queryClient.invalidateQueries({ queryKey: executionQueryKey });
    },
  });
}

export function useRetryExecution(executionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => retryExecution(executionId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: executionDetailQueryKey(executionId),
      });
      const previous = queryClient.getQueryData<ExecutionDetail>(
        executionDetailQueryKey(executionId),
      );
      if (previous) {
        queryClient.setQueryData<ExecutionDetail>(
          executionDetailQueryKey(executionId),
          {
            ...previous,
            status: "RUNNING",
            publications: previous.publications.map((publication) =>
              publication.retryable
                ? queuePublication(publication)
                : publication,
            ),
          },
        );
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          executionDetailQueryKey(executionId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: executionDetailQueryKey(executionId),
      });
      void queryClient.invalidateQueries({ queryKey: executionQueryKey });
    },
  });
}
