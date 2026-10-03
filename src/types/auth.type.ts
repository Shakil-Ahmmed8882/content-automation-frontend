export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatarUrl: string | null;
  avatarPublicId: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isPremium: boolean;
  premiumSince: string | null;
  status: "ACTIVE" | "BLOCKED";
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailInput {
  email: string;
  otp: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput extends VerifyEmailInput {
  newPassword: string;
}
