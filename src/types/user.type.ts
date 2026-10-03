import type { User } from "@/types/auth.type";

export type AuthProvider = "CREDENTIALS" | "GOOGLE";

export interface UserProfile extends User {
  providers: AuthProvider[];
}

export interface UpdateProfileInput {
  name: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
