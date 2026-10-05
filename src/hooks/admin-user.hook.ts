"use client";

import {
  keepPreviousData,
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as adminUserApi from "@/api/admin-user.api";
import { toApiError } from "@/lib/api-error";
import type {
  AdminRole,
  AdminUser,
  AdminUserStatus,
  ListAdminUsersParams,
} from "@/types/admin.type";

export const adminUsersKey = ["admin", "users"] as const;
export const adminUserKey = (id: string) => ["admin", "user", id] as const;

function applyUser(client: QueryClient, user: AdminUser) {
  client.setQueryData(adminUserKey(user.id), user);
  void client.invalidateQueries({ queryKey: adminUsersKey });
  // Admin actions write audit rows server-side.
  void client.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
}

function onActionError(error: unknown) {
  toast.error(toApiError(error).userMessage);
}

export function useAdminUsers(params: ListAdminUsersParams) {
  return useQuery({
    queryKey: [...adminUsersKey, params],
    queryFn: ({ signal }) => adminUserApi.listAdminUsers(params, signal),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useAdminUser(id: string | null, initialData?: AdminUser) {
  return useQuery({
    queryKey: adminUserKey(id ?? ""),
    queryFn: ({ signal }) => adminUserApi.getAdminUser(id as string, signal),
    enabled: !!id,
    initialData,
    retry: false,
  });
}

export function useSetAdminUserStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminUserStatus }) =>
      adminUserApi.setAdminUserStatus(id, status),
    onSuccess: (user) => {
      applyUser(client, user);
      toast.success(
        user.status === "BLOCKED" ? "User blocked." : "User unblocked.",
      );
    },
    onError: onActionError,
  });
}

export function useSetAdminUserPremium() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPremium }: { id: string; isPremium: boolean }) =>
      adminUserApi.setAdminUserPremium(id, isPremium),
    onSuccess: (user) => {
      applyUser(client, user);
      toast.success(user.isPremium ? "Premium granted." : "Premium revoked.");
    },
    onError: onActionError,
  });
}

export function useSetAdminUserRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminRole }) =>
      adminUserApi.setAdminUserRole(id, role),
    onSuccess: (user) => {
      applyUser(client, user);
      toast.success("Role updated.");
    },
    onError: onActionError,
  });
}
