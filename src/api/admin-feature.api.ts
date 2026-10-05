import apiClient from "@/lib/apiClient";
import type { AdminFeature, FeatureBody } from "@/types/admin.type";

export async function listAdminFeatures(signal?: AbortSignal) {
  return (
    await apiClient<AdminFeature[]>("/admin/upcoming-features", { signal })
  ).data;
}

export async function createAdminFeature(body: FeatureBody) {
  return (
    await apiClient<AdminFeature>("/admin/upcoming-features", {
      method: "POST",
      body,
    })
  ).data;
}

export async function updateAdminFeature(
  id: string,
  body: Partial<FeatureBody>,
) {
  return (
    await apiClient<AdminFeature>(`/admin/upcoming-features/${id}`, {
      method: "PATCH",
      body,
    })
  ).data;
}

export async function setAdminFeatureImage(id: string, file: File) {
  const formData = new FormData();
  formData.append("image", file);
  return (
    await apiClient<AdminFeature>(`/admin/upcoming-features/${id}/image`, {
      method: "PATCH",
      body: formData,
    })
  ).data;
}

export async function deleteAdminFeature(id: string) {
  await apiClient<null>(`/admin/upcoming-features/${id}`, {
    method: "DELETE",
  });
}
