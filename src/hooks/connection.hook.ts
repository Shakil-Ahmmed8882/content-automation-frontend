"use client";

import { useQuery } from "@tanstack/react-query";
import { listConnections, listPlatforms } from "@/api/connection.api";
import { useAuthCooldown } from "./auth.hook";

export const connectionQueryKey = ["connections"] as const;
export const platformQueryKey = ["platforms"] as const;

export function useConnections() {
  const cooldown = useAuthCooldown();
  return useQuery({
    queryKey: connectionQueryKey,
    queryFn: ({ signal }) => listConnections(signal),
    enabled: cooldown === 0,
  });
}

export function usePlatforms() {
  const cooldown = useAuthCooldown();
  return useQuery({
    queryKey: platformQueryKey,
    queryFn: ({ signal }) => listPlatforms(signal),
    enabled: cooldown === 0,
  });
}
