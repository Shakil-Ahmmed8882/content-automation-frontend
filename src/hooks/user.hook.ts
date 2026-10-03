"use client";

import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as userApi from "@/api/user.api";
import { toApiError } from "@/lib/api-error";
import { clearSessionCache, sessionQueryKey } from "@/lib/session-cache";
import { routes } from "@/routes";
import type { User } from "@/types/auth.type";
import type { UserProfile } from "@/types/user.type";

export const profileQueryKey = ["profile"] as const;

function toSessionUser(profile: UserProfile): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    emailVerified: profile.emailVerified,
    avatarUrl: profile.avatarUrl,
    avatarPublicId: profile.avatarPublicId,
    role: profile.role,
    isPremium: profile.isPremium,
    premiumSince: profile.premiumSince,
    status: profile.status,
    isDeleted: profile.isDeleted,
    deletedAt: profile.deletedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function syncProfileCache(client: QueryClient, profile: UserProfile) {
  client.setQueryData(profileQueryKey, profile);
  client.setQueryData<User | null>(sessionQueryKey, (current) => {
    const next = toSessionUser(profile);
    return current ? { ...current, ...next } : next;
  });
}

function toastMutationError(error: unknown) {
  toast.error(toApiError(error).userMessage);
}

export function useProfile() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: ({ signal }) => userApi.getMe(signal),
    staleTime: 60_000,
    retry: false,
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: userApi.updateMe,
    onSuccess: (profile) => {
      syncProfileCache(client, profile);
      toast.success("Profile updated.");
    },
    onError: toastMutationError,
  });
}

export function useUploadAvatar() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: userApi.uploadAvatar,
    onSuccess: (profile) => {
      syncProfileCache(client, profile);
      toast.success("Photo updated.");
    },
    onError: toastMutationError,
  });
}

export function useRemoveAvatar() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: userApi.removeAvatar,
    onSuccess: (profile) => {
      syncProfileCache(client, profile);
      toast.success("Photo removed.");
    },
    onError: toastMutationError,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: () => toast.success("Password updated."),
    onError: toastMutationError,
  });
}

export function useDeleteAccount(options?: { redirectDelayMs?: number }) {
  const client = useQueryClient();
  const router = useRouter();
  const redirectDelayMs = options?.redirectDelayMs ?? 0;
  return useMutation({
    mutationFn: userApi.deleteMe,
    onMutate: () => client.cancelQueries(),
    onSuccess: async () => {
      toast.success("Account deleted.");
      if (redirectDelayMs > 0) {
        window.setTimeout(() => {
          void client.cancelQueries().then(() => {
            clearSessionCache(client);
            router.replace(routes.home);
          });
        }, redirectDelayMs);
        return;
      }
      await client.cancelQueries();
      clearSessionCache(client);
      router.replace(routes.home);
    },
    onError: toastMutationError,
  });
}
