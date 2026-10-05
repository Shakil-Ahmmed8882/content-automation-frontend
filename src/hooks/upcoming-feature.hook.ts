"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUpcomingFeatureBySlug,
  getUpcomingFeatures,
} from "@/api/upcoming-feature.api";
import { toApiError } from "@/lib/api-error";
import type { UpcomingFeature } from "@/types/upcoming-feature.type";
import { useSession } from "./auth.hook";

export const upcomingFeaturesQueryKey = ["upcoming-features"] as const;
export const upcomingFeatureQueryKey = (slug: string) =>
  ["upcoming-feature", slug] as const;

function retryUnlessClientError(count: number, error: unknown) {
  const status = toApiError(error).status;
  if (status >= 400 && status < 500) return false;
  return count < 1;
}

/** Premium flag from the session; `known` is false until the session resolves. */
function usePremiumAccess() {
  const session = useSession();
  return {
    known: !session.isPending,
    isPremium: session.data?.isPremium === true,
  };
}

export function useUpcomingFeatures() {
  const access = usePremiumAccess();
  const query = useQuery({
    queryKey: upcomingFeaturesQueryKey,
    queryFn: ({ signal }) => getUpcomingFeatures(signal),
    enabled: access.known && access.isPremium,
    retry: retryUnlessClientError,
  });
  const forbidden =
    (access.known && !access.isPremium) ||
    (query.error ? toApiError(query.error).status === 403 : false);
  return { ...query, forbidden, accessKnown: access.known };
}

export function useUpcomingFeature(slug: string) {
  const client = useQueryClient();
  const access = usePremiumAccess();
  const query = useQuery({
    queryKey: upcomingFeatureQueryKey(slug),
    queryFn: ({ signal }) => getUpcomingFeatureBySlug(slug, signal),
    enabled: access.known && access.isPremium,
    retry: retryUnlessClientError,
    initialData: () =>
      client
        .getQueryData<UpcomingFeature[]>(upcomingFeaturesQueryKey)
        ?.find((feature) => feature.slug === slug),
    initialDataUpdatedAt: () =>
      client.getQueryState(upcomingFeaturesQueryKey)?.dataUpdatedAt,
  });
  const status = query.error ? toApiError(query.error).status : 0;
  return {
    ...query,
    forbidden: (access.known && !access.isPremium) || status === 403,
    notFound: status === 404,
    accessKnown: access.known,
  };
}
