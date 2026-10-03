import apiClient from "@/lib/apiClient";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  User,
  VerifyEmailInput,
} from "@/types/auth.type";

export async function register(input: RegisterInput) {
  const result = await apiClient<{ email: string }>("/auth/register", {
    method: "POST",
    body: input,
  });
  return { email: result.data.email };
}

export async function verifyEmail(input: VerifyEmailInput) {
  return (
    await apiClient<User>("/auth/verify-email", { method: "POST", body: input })
  ).data;
}

export async function login(input: LoginInput) {
  return (await apiClient<User>("/auth/login", { method: "POST", body: input }))
    .data;
}

export async function logout() {
  await apiClient<null>("/auth/logout", { method: "POST" });
}

export async function refreshToken() {
  await apiClient<null>("/auth/refresh-token", { method: "POST" });
}

export async function me(signal?: AbortSignal) {
  return (
    await apiClient<User>("/auth/me", { signal, suppressSessionExpiry: true })
  ).data;
}

export async function forgotPassword(input: ForgotPasswordInput) {
  await apiClient<unknown>("/auth/forgot-password", {
    method: "POST",
    body: input,
  });
}

export async function resetPassword(input: ResetPasswordInput) {
  await apiClient<null>("/auth/reset-password", {
    method: "POST",
    body: input,
  });
}
