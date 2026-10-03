"use client";

import { useQuery } from "@tanstack/react-query";
import { listExecutions } from "@/api/execution.api";
import { useAuthCooldown } from "./auth.hook";

export const executionQueryKey = ["executions"] as const;

export function useRecentExecutions() {
  const cooldown = useAuthCooldown();
  const params = { limit: 5, sort: "-createdAt" };
  return useQuery({
    queryKey: [...executionQueryKey, params],
    queryFn: ({ signal }) => listExecutions(params, signal),
    enabled: cooldown === 0,
  });
}
