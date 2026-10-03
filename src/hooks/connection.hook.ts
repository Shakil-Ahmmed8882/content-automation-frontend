"use client";

import {
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  completeConnectionCallback,
  disconnectConnection,
  listConnections,
  listFacebookPages,
  selectFacebookPage,
  startConnection,
} from "@/api/connection.api";
import { getPlatforms } from "@/api/platform.api";
import type {
  ConnectedPlatformKey,
  Connection,
  FacebookPage,
} from "@/types/connection.type";
import type { Platform } from "@/types/platform.type";
import { useAuthCooldown } from "./auth.hook";

export const connectionQueryKey = ["connections"] as const;
export const platformQueryKey = ["platforms"] as const;
export const facebookPagesQueryKey = ["fb-pages"] as const;

export function useConnections(): UseQueryResult<Connection[]> {
  const cooldown = useAuthCooldown();
  return useQuery({
    queryKey: connectionQueryKey,
    queryFn: ({ signal }) => listConnections(signal),
    enabled: cooldown === 0,
  });
}

export function usePlatforms(): UseQueryResult<Platform[]> {
  const cooldown = useAuthCooldown();
  return useQuery({
    queryKey: platformQueryKey,
    queryFn: ({ signal }) => getPlatforms(signal),
    enabled: cooldown === 0,
  });
}

export function useConnectedPlatformKeys(): ConnectedPlatformKey[] {
  const connections = useConnections();
  const platforms = usePlatforms();
  const livePlatformByKey = new Map(
    (platforms.data ?? [])
      .filter((platform) => platform.isActive && platform.status === "LIVE")
      .map((platform) => [platform.key, platform]),
  );

  return (connections.data ?? []).flatMap((connection) => {
    const platform = livePlatformByKey.get(connection.platform.key);
    if (!platform) return [];
    return [
      {
        key: platform.key,
        name: platform.name,
        status: connection.status,
        accountName: connection.platformAccountName,
      },
    ];
  });
}

export function useStartConnection() {
  return useMutation({ mutationFn: startConnection });
}

export function useConnectionCallback() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: completeConnectionCallback,
    onSuccess: (result) => {
      if (result.kind === "select-page") {
        client.setQueryData<FacebookPage[]>(
          facebookPagesQueryKey,
          result.pages,
        );
        return;
      }
      client.setQueryData<Connection[]>(connectionQueryKey, (current) => {
        if (!current) return [result.connection];
        const next = current.filter(
          (connection) =>
            connection.platform.key !== result.connection.platform.key,
        );
        return [...next, result.connection];
      });
      void client.invalidateQueries({ queryKey: connectionQueryKey });
    },
  });
}

export function useFacebookPages(enabled: boolean) {
  const cooldown = useAuthCooldown();
  return useQuery({
    queryKey: facebookPagesQueryKey,
    queryFn: ({ signal }) => listFacebookPages(signal),
    enabled: enabled && cooldown === 0,
    retry: false,
  });
}

export function useSelectFacebookPage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: selectFacebookPage,
    onSuccess: (connection) => {
      client.setQueryData<Connection[]>(connectionQueryKey, (current) => {
        if (!current) return [connection];
        const next = current.filter(
          (item) => item.platform.key !== connection.platform.key,
        );
        return [...next, connection];
      });
      client.removeQueries({ queryKey: facebookPagesQueryKey });
      void client.invalidateQueries({ queryKey: connectionQueryKey });
    },
  });
}

export function useDisconnectConnection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: disconnectConnection,
    onSuccess: (_result, platform) => {
      client.setQueryData<Connection[]>(connectionQueryKey, (current) =>
        current?.filter((connection) => connection.platform.key !== platform),
      );
      client.removeQueries({ queryKey: facebookPagesQueryKey });
      void client.invalidateQueries({ queryKey: connectionQueryKey });
    },
  });
}
