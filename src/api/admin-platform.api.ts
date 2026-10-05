import apiClient from "@/lib/apiClient";
import type {
  CreatePlatformBody,
  Platform,
  UpdatePlatformBody,
} from "@/types/admin.type";

export async function listAdminPlatforms(signal?: AbortSignal) {
  return (await apiClient<Platform[]>("/admin/platforms", { signal })).data;
}

export async function createAdminPlatform(body: CreatePlatformBody) {
  return (
    await apiClient<Platform>("/admin/platforms", { method: "POST", body })
  ).data;
}

export async function updateAdminPlatform(
  id: string,
  body: UpdatePlatformBody,
) {
  return (
    await apiClient<Platform>(`/admin/platforms/${id}`, {
      method: "PATCH",
      body,
    })
  ).data;
}

export async function setAdminPlatformLogo(id: string, file: File) {
  const formData = new FormData();
  formData.append("logo", file);
  return (
    await apiClient<Platform>(`/admin/platforms/${id}/logo`, {
      method: "PATCH",
      body: formData,
    })
  ).data;
}
