"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as adminPlatformApi from "@/api/admin-platform.api";
import type { UpdatePlatformBody } from "@/types/admin.type";

export const adminPlatformsKey = ["admin", "platforms"] as const;

function useInvalidatePlatforms() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: adminPlatformsKey }),
      client.invalidateQueries({ queryKey: ["platforms"] }),
    ]);
}

export function useAdminPlatforms() {
  return useQuery({
    queryKey: adminPlatformsKey,
    queryFn: ({ signal }) => adminPlatformApi.listAdminPlatforms(signal),
    retry: false,
  });
}

export function useCreateAdminPlatform() {
  const invalidate = useInvalidatePlatforms();
  return useMutation({
    mutationFn: adminPlatformApi.createAdminPlatform,
    onSuccess: () => {
      void invalidate();
      toast.success("Platform created.");
    },
  });
}

export function useUpdateAdminPlatform() {
  const invalidate = useInvalidatePlatforms();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePlatformBody }) =>
      adminPlatformApi.updateAdminPlatform(id, body),
    onSuccess: () => {
      void invalidate();
      toast.success("Platform updated.");
    },
  });
}

export function useSetAdminPlatformLogo() {
  const invalidate = useInvalidatePlatforms();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      adminPlatformApi.setAdminPlatformLogo(id, file),
    onSuccess: () => {
      void invalidate();
      toast.success("Logo updated.");
    },
  });
}
