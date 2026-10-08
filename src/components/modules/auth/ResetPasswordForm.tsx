"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  GenericForm,
  type GenericFormRef,
  SubmitButton,
  TextField,
} from "@/components/reusable-ui-blocks/form";
import { useAuthCooldown, useResetPassword } from "@/hooks/auth.hook";
import { type ApiError, toApiError } from "@/lib/api-error";
import { routes } from "@/routes";
import type { ResetPasswordInput } from "@/types/auth.type";
import { resetPasswordSchema } from "@/validation/auth.validation";
import { AuthError } from "./AuthAlert";
import AuthCard from "./AuthCard";
import { applyServerFieldErrors, OtpField, PasswordField } from "./AuthFields";

export default function ResetPasswordForm() {
  const mutation = useResetPassword();
  const router = useRouter();
  const params = useSearchParams();
  const cooldown = useAuthCooldown();
  const ref = useRef<GenericFormRef<ResetPasswordInput>>(null);
  const [error, setError] = useState<ApiError | null>(null);
  async function submit(values: ResetPasswordInput) {
    if (mutation.isPending || cooldown) return;
    setError(null);
    try {
      await mutation.mutateAsync(values);
      toast.success("Password reset. Log in with your new password.");
      router.replace(routes.login);
    } catch (failure) {
      const result = toApiError(failure);
      setError(result);
      applyServerFieldErrors(ref.current?.form, result.fieldErrors, [
        "email",
        "otp",
        "newPassword",
      ]);
      if (result.message === "Invalid or expired reset code")
        ref.current?.form.setError(
          "otp",
          { type: "server", message: result.userMessage },
          { shouldFocus: true },
        );
    }
  }
  return (
    <AuthCard
      title="Reset your password"
      description="Enter the code from your email and choose a new password."
      footer={
        <Link href={routes.login} className="text-foreground hover:underline">
          Back to log in
        </Link>
      }
    >
      <GenericForm
        ref={ref}
        schema={resetPasswordSchema}
        initialValues={{
          email: params.get("email") ?? "",
          otp: "",
          newPassword: "",
        }}
        onSubmit={submit}
      >
        <fieldset disabled={mutation.isPending} className="space-y-6">
          <TextField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
          />
          <OtpField description="Codes expire in 5 minutes." />
          <PasswordField
            name="newPassword"
            label="New password"
            newPassword
            description="At least 8 characters."
          />
        </fieldset>
        <AuthError error={error} cooldown={cooldown} />
        <SubmitButton
          label="Reset password"
          loadingLabel="Resetting..."
          disabled={cooldown > 0}
        />
      </GenericForm>
      <p className="mt-5 text-sm leading-6 text-muted-foreground">
        Didn't get a code? Check your spam folder or{" "}
        <Link
          href={routes.forgotPassword}
          className="text-foreground hover:underline"
        >
          request a new one
        </Link>
        .
      </p>
    </AuthCard>
  );
}
