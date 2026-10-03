import { getPlatforms } from "@/api/platform.api";
import apiClient from "@/lib/apiClient";
import type {
  Connection,
  ConnectionAuthUrl,
  ConnectionCallbackResult,
  FacebookPage,
} from "@/types/connection.type";

export { getPlatforms as listPlatforms };

export async function listConnections(signal?: AbortSignal) {
  return (await apiClient<Connection[]>("/connections", { signal })).data;
}

export async function startConnection(platform: string) {
  return (
    await apiClient<ConnectionAuthUrl>(
      `/connections/${encodeURIComponent(platform)}/connect`,
    )
  ).data;
}

export async function completeConnectionCallback({
  platform,
  code,
  state,
}: {
  platform: string;
  code: string;
  state: string;
}) {
  return (
    await apiClient<ConnectionCallbackResult>(
      `/connections/${encodeURIComponent(platform)}/callback`,
      {
        query: { code, state },
        skipAuthRefresh: true,
        suppressSessionExpiry: true,
      },
    )
  ).data;
}

export async function listFacebookPages(signal?: AbortSignal) {
  return (
    await apiClient<FacebookPage[]>("/connections/facebook/pages", { signal })
  ).data;
}

export async function selectFacebookPage(pageId: string) {
  return (
    await apiClient<Connection>("/connections/facebook/select-page", {
      method: "POST",
      body: { pageId },
    })
  ).data;
}

export async function disconnectConnection(platform: string) {
  await apiClient<null>(`/connections/${encodeURIComponent(platform)}`, {
    method: "DELETE",
  });
}
