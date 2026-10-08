"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PasswordField } from "@/components/modules/auth/AuthFields";
import {
  GenericForm,
  type GenericFormRef,
  SubmitButton,
} from "@/components/reusable-ui-blocks/form";
import { useAuthCooldown } from "@/hooks/auth.hook";
import { useChangePassword } from "@/hooks/user.hook";
import { type ApiError, toApiError } from "@/lib/api-error";
import { routes } from "@/routes";
import type { ChangePasswordInput, UserProfile } from "@/types/user.type";
import { changePasswordSchema } from "@/validation/user.validation";
import { ProfileAlert } from "./ProfileAlert";
import { ProfileSection } from "./ProfileSection";

const emptyPasswordValues: ChangePasswordInput = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function PasswordSubmitButton({
  pending,
  cooldown,
}: {
  pending: boolean;
  cooldown: number;
}) {
  return (
    <SubmitButton
      label="Update password"
      loadingLabel="Updating..."
      isLoading={pending}
      disabled={cooldown > 0}
      width="auto"
      className="w-full sm:w-auto"
    />
  );
}

export function ChangePasswordCard({ profile }: { profile: UserProfile }) {
  const mutation = useChangePassword();
  const cooldown = useAuthCooldown();
  const formRef = useRef<GenericFormRef<ChangePasswordInput>>(null);
  const [error, setError] = useState<ApiError | null>(null);

  if (!profile.providers.includes("CREDENTIALS")) {
    return (
      <ProfileSection
        title="Security"
        description="This account does not currently use a password sign-in method."
      >
        <ProfileAlert variant="info">
          <p>
            You signed in with Google. To set a password, use Forgot password.
          </p>
          <Link
            href={routes.forgotPassword}
            className="mt-2 inline-flex rounded-sm text-link hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Go to Forgot password
          </Link>
        </ProfileAlert>
      </ProfileSection>
    );
  }

  async function submit(input: ChangePasswordInput) {
    if (mutation.isPending || cooldown) return;
    setError(null);
    try {
      await mutation.mutateAsync({
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      });
      formRef.current?.reset(emptyPasswordValues);
    } catch (failure) {
      const result = toApiError(failure);
      if (
        result.status === 401 ||
        /current password is incorrect/i.test(result.message)
      ) {
        formRef.current?.form.setError("currentPassword", {
          type: "server",
          message: "Current password is incorrect",
        });
        formRef.current?.form.setValue("currentPassword", "");
        formRef.current?.form.setFocus("currentPassword");
        return;
      }
      setError(result);
    }
  }

  return (
    <ProfileSection
      title="Security"
      description="Change your password. We'll email you a confirmation."
    >
      <GenericForm
        ref={formRef}
        schema={changePasswordSchema}
        initialValues={emptyPasswordValues}
        onSubmit={submit}
      >
        <fieldset
          disabled={mutation.isPending}
          className="grid gap-6"
          aria-busy={mutation.isPending}
        >
          <PasswordField name="currentPassword" label="Current password" />
          <div className="grid gap-6 sm:grid-cols-2">
            <PasswordField
              name="newPassword"
              label="New password"
              newPassword
            />
            <PasswordField
              name="confirmPassword"
              label="Confirm new password"
              newPassword
            />
          </div>
        </fieldset>
        {error ? <ProfileAlert>{error.userMessage}</ProfileAlert> : null}
        <PasswordSubmitButton
          pending={mutation.isPending}
          cooldown={cooldown}
        />
      </GenericForm>
    </ProfileSection>
  );
}
