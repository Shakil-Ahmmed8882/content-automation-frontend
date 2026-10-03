"use client";

import {
  type QueryClient,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ActionResult } from "@/lib/errors";

export type QuerySnapshot<TData> = Array<[QueryKey, TData | undefined]>;

type UseOptimisticListMutationOptions<TPayload, TData, TResult> = {
  /** Prefix passed to cancelQueries/getQueriesData — matches every cached variant of a list. */
  queryKeyPrefix: QueryKey;
  /** Server action. Must return the shared ActionResult<T> discriminated union. */
  mutationFn: (payload: TPayload) => Promise<ActionResult<TResult>>;
  /**
   * Pure transform applied to every cached query matching queryKeyPrefix that
   * currently has data. Owns 100% of the feature-specific shape knowledge
   * (field names, counters, filter-driven removal, etc.) — this hook never
   * inspects TData itself.
   */
  updateCachedData: (
    data: TData,
    context: { queryKey: QueryKey; payload: TPayload },
  ) => TData;
};

async function snapshotQueries<TData>(
  queryClient: QueryClient,
  queryKeyPrefix: QueryKey,
): Promise<QuerySnapshot<TData>> {
  await queryClient.cancelQueries({ queryKey: queryKeyPrefix });
  return queryClient.getQueriesData<TData>({ queryKey: queryKeyPrefix });
}

function restoreQueries<TData>(
  queryClient: QueryClient,
  snapshot: QuerySnapshot<TData>,
) {
  for (const [queryKey, data] of snapshot) {
    queryClient.setQueryData(queryKey, data);
  }
}

/**
 * Generic "click -> optimistic mutation across every cached list variant ->
 * rollback on error" hook. Data-shape-agnostic: callers supply queryKeyPrefix,
 * the server action, and a pure transform (updateCachedData).
 */
export function useOptimisticListMutation<TPayload, TData, TResult = void>(
  options: UseOptimisticListMutationOptions<TPayload, TData, TResult>,
) {
  const { queryKeyPrefix, mutationFn, updateCachedData } = options;
  const queryClient = useQueryClient();

  return useMutation<
    TResult,
    Error,
    TPayload,
    { snapshot: QuerySnapshot<TData> }
  >({
    mutationFn: async (payload) => {
      const result = await mutationFn(payload);
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    onMutate: async (payload) => {
      const snapshot = await snapshotQueries<TData>(
        queryClient,
        queryKeyPrefix,
      );
      for (const [queryKey, data] of snapshot) {
        if (!data) continue;
        queryClient.setQueryData<TData>(
          queryKey,
          updateCachedData(data, { queryKey, payload }),
        );
      }
      return { snapshot };
    },
    onError: (_error, _payload, context) => {
      if (context?.snapshot) restoreQueries(queryClient, context.snapshot);
    },
  });
}
