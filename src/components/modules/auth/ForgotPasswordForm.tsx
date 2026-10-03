"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  GenericForm,
  type GenericFormRef,
  SubmitButton,
  TextField,
} from "@/components/reusable-ui-blocks/form";
import { Button } from "@/components/ui/button";
import { useAuthCooldown, useForgotPassword } from "@/hooks/auth.hook";
import { type ApiError, toApiError } from "@/lib/api-error";
import { routes } from "@/routes";
import type { ForgotPasswordInput } from "@/types/auth.type";
import { forgotPasswordSchema } from "@/validation/auth.validation";
import { AuthAlert, AuthError } from "./AuthAlert";
import AuthCard from "./AuthCard";
import { applyServerFieldErrors } from "./AuthFields";

export default function ForgotPasswordForm() {
  const mutation = useForgotPassword();
  const cooldown = useAuthCooldown();
  const ref = useRef<GenericFormRef<ForgotPasswordInput>>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  async function submit(values: ForgotPasswordInput) {
    if (mutation.isPending || cooldown) return;
    setError(null);
    try {
      await mutation.mutateAsync(values);
      setSentTo(values.email.toLowerCase());
    } catch (failure) {
      const result = toApiError(failure);
      setError(result);
      applyServerFieldErrors(ref.current?.form, result.fieldErrors, ["email"]);
    }
  }
  return (
    <AuthCard
      title={sentTo ? "Check your email" : "Forgot your password?"}
      description="Enter your email and we'll send a 6-digit reset code."
      footer={
        <Link href={routes.login} className="text-foreground hover:underline">
          Back to log in
        </Link>
      }
    >
      {sentTo ? (
        <div className="space-y-5">
          <AuthAlert variant="info">
            If an account exists for that email, a password reset code has been
            sent.
          </AuthAlert>
          <Button asChild className="w-full" autoFocus>
            <Link
              href={`${routes.resetPassword}?${new URLSearchParams({ email: sentTo })}`}
            >
              Enter code
            </Link>
          </Button>
        </div>
      ) : (
        <GenericForm
          ref={ref}
          schema={forgotPasswordSchema}
          initialValues={{ email: "" }}
          onSubmit={submit}
        >
          <fieldset disabled={mutation.isPending}>
            <TextField
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              required
            />
          </fieldset>
          <AuthError error={error} cooldown={cooldown} />
          <SubmitButton
            label="Send code"
            loadingLabel="Sending code..."
            disabled={cooldown > 0}
          />
        </GenericForm>
      )}
    </AuthCard>
  );
}
