"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  GenericForm,
  type GenericFormRef,
  SubmitButton,
  TextField,
} from "@/components/reusable-ui-blocks/form";
import { useAuthCooldown, useLogin } from "@/hooks/auth.hook";
import { type ApiError, toApiError } from "@/lib/api-error";
import { getDemoLogin } from "@/lib/demo-login";
import { routes, safeNext } from "@/routes";
import type { LoginInput } from "@/types/auth.type";
import { loginSchema } from "@/validation/auth.validation";
import { AuthAlert, AuthError } from "./AuthAlert";
import AuthCard from "./AuthCard";
import { applyServerFieldErrors, PasswordField } from "./AuthFields";

export default function LoginForm() {
  const demo = getDemoLogin();
  const mutation = useLogin();
  const router = useRouter();
  const params = useSearchParams();
  const cooldown = useAuthCooldown();
  const ref = useRef<GenericFormRef<LoginInput>>(null);
  const [error, setError] = useState<ApiError | null>(null);
  async function submit(values: LoginInput) {
    if (mutation.isPending || cooldown) return;
    setError(null);
    try {
      await mutation.mutateAsync(values);
      router.replace(safeNext(params.get("next")));
    } catch (failure) {
      const result = toApiError(failure);
      setError(result);
      applyServerFieldErrors(ref.current?.form, result.fieldErrors, [
        "email",
        "password",
      ]);
      if (result.status === 401) {
        ref.current?.form.setValue("password", "");
        ref.current?.form.setFocus("password");
      }
    }
  }
  return (
    <AuthCard
      title="Log in"
      description="Welcome back. Your next post starts here."
      footer={
        <>
          New here?{" "}
          <Link
            href={routes.register}
            className="text-foreground hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <GenericForm
        ref={ref}
        schema={loginSchema}
        initialValues={{ email: demo.email, password: demo.password }}
        onSubmit={submit}
      >
        {params.get("reason") === "session-expired" && (
          <AuthAlert variant="info">
            Your session expired. Please sign in again.
          </AuthAlert>
        )}
        {demo.enabled && (
          <AuthAlert variant="info">
            Demo account is prefilled. Log in to explore, or replace the details
            with your own account.
          </AuthAlert>
        )}
        <fieldset disabled={mutation.isPending} className="space-y-6">
          <TextField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
          />
          <PasswordField />
        </fieldset>
        <div className="-mt-3 flex justify-end">
          <Link
            href={routes.forgotPassword}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <AuthError error={error} cooldown={cooldown} />
        <SubmitButton
          label="Log in"
          loadingLabel="Logging in..."
          disabled={cooldown > 0}
        />
      </GenericForm>
    </AuthCard>
  );
}
