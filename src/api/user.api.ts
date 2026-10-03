import apiClient from "@/lib/apiClient";
import type {
  ChangePasswordRequest,
  UpdateProfileInput,
  UserProfile,
} from "@/types/user.type";

export async function getMe(signal?: AbortSignal) {
  return (await apiClient<UserProfile>("/users/me", { signal })).data;
}

export async function updateMe(input: UpdateProfileInput) {
  return (
    await apiClient<UserProfile>("/users/me", {
      method: "PATCH",
      body: { name: input.name },
    })
  ).data;
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("avatar", file);
  return (
    await apiClient<UserProfile>("/users/me/avatar", {
      method: "PATCH",
      body: formData,
    })
  ).data;
}

export async function removeAvatar() {
  return (
    await apiClient<UserProfile>("/users/me/avatar", { method: "DELETE" })
  ).data;
}

export async function changePassword(input: ChangePasswordRequest) {
  await apiClient<null>("/users/me/password", {
    method: "PATCH",
    body: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    },
    skipAuthRefresh: true,
  });
}

export async function deleteMe() {
  await apiClient<null>("/users/me", { method: "DELETE" });
}
