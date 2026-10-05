import apiClient from "@/lib/apiClient";
import type { UpcomingFeature } from "@/types/upcoming-feature.type";

export async function getUpcomingFeatures(signal?: AbortSignal) {
  return (await apiClient<UpcomingFeature[]>("/upcoming-features", { signal }))
    .data;
}

export async function getUpcomingFeatureBySlug(
  slug: string,
  signal?: AbortSignal,
) {
  return (
    await apiClient<UpcomingFeature>(
      `/upcoming-features/${encodeURIComponent(slug)}`,
      { signal },
    )
  ).data;
}
