import { z } from "zod";

const email = z.email("Invalid email address");
const otp = z
  .string()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d{6}$/, "OTP must contain only digits");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email,
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const verifyEmailSchema = z.object({ email, otp });
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({
  email,
  otp,
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long"),
});
