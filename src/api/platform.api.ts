import apiClient from "@/lib/apiClient";
import type { Platform } from "@/types/platform.type";

export async function getPlatforms(signal?: AbortSignal) {
  return (await apiClient<Platform[]>("/platforms", { signal })).data;
}
