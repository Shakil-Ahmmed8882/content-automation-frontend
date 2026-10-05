import apiClient from "@/lib/apiClient";
import type {
  AdminRole,
  AdminUser,
  AdminUserStatus,
  ListAdminUsersParams,
  Paged,
} from "@/types/admin.type";

export async function listAdminUsers(
  params: ListAdminUsersParams = {},
  signal?: AbortSignal,
): Promise<Paged<AdminUser>> {
  const result = await apiClient<AdminUser[]>("/admin/users", {
    query: params,
    signal,
  });
  return {
    data: result.data,
    meta: result.meta ?? {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      total: result.data.length,
      totalPages: 1,
    },
  };
}

export async function getAdminUser(id: string, signal?: AbortSignal) {
  return (await apiClient<AdminUser>(`/admin/users/${id}`, { signal })).data;
}

export async function setAdminUserStatus(id: string, status: AdminUserStatus) {
  return (
    await apiClient<AdminUser>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: { status },
    })
  ).data;
}

export async function setAdminUserRole(id: string, role: AdminRole) {
  return (
    await apiClient<AdminUser>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: { role },
    })
  ).data;
}

export async function setAdminUserPremium(id: string, isPremium: boolean) {
  return (
    await apiClient<AdminUser>(`/admin/users/${id}/premium`, {
      method: "PATCH",
      body: { isPremium },
    })
  ).data;
}
