import apiClient from "@/lib/apiClient";
import type { Connection, Platform } from "@/types/connection.type";

export async function listConnections(signal?: AbortSignal) {
  return (await apiClient<Connection[]>("/connections", { signal })).data;
}

export async function listPlatforms(signal?: AbortSignal) {
  return (await apiClient<Platform[]>("/platforms", { signal })).data;
}
