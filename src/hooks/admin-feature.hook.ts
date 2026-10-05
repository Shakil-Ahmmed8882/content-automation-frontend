"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as adminFeatureApi from "@/api/admin-feature.api";
import { toApiError } from "@/lib/api-error";
import type { FeatureBody } from "@/types/admin.type";

export const adminFeaturesKey = ["admin", "features"] as const;

function useInvalidateFeatures() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: adminFeaturesKey }),
      client.invalidateQueries({ queryKey: ["upcoming-features"] }),
      client.invalidateQueries({ queryKey: ["upcoming-feature"] }),
    ]);
}

export function useAdminFeatures() {
  return useQuery({
    queryKey: adminFeaturesKey,
    queryFn: ({ signal }) => adminFeatureApi.listAdminFeatures(signal),
    retry: false,
  });
}

export function useCreateAdminFeature() {
  const invalidate = useInvalidateFeatures();
  return useMutation({
    mutationFn: adminFeatureApi.createAdminFeature,
    onSuccess: () => {
      void invalidate();
      toast.success("Feature created.");
    },
  });
}

export function useUpdateAdminFeature() {
  const invalidate = useInvalidateFeatures();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<FeatureBody> }) =>
      adminFeatureApi.updateAdminFeature(id, body),
    onSuccess: () => {
      void invalidate();
      toast.success("Feature updated.");
    },
  });
}

export function useSetAdminFeatureImage() {
  const invalidate = useInvalidateFeatures();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      adminFeatureApi.setAdminFeatureImage(id, file),
    onSuccess: () => {
      void invalidate();
      toast.success("Image updated.");
    },
  });
}

export function useDeleteAdminFeature() {
  const invalidate = useInvalidateFeatures();
  return useMutation({
    mutationFn: adminFeatureApi.deleteAdminFeature,
    onSuccess: () => {
      void invalidate();
      toast.success("Feature deleted.");
    },
    onError: (error) => toast.error(toApiError(error).userMessage),
  });
}
