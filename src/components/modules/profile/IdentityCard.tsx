"use client";

import { useRef, useState } from "react";
import { useFormState } from "react-hook-form";
import {
  GenericForm,
  type GenericFormRef,
  SubmitButton,
  TextField,
} from "@/components/reusable-ui-blocks/form";
import { useAuthCooldown } from "@/hooks/auth.hook";
import { useUpdateProfile } from "@/hooks/user.hook";
import { type ApiError, toApiError } from "@/lib/api-error";
import type { UpdateProfileInput, UserProfile } from "@/types/user.type";
import { updateProfileSchema } from "@/validation/user.validation";
import { AvatarUploader } from "./AvatarUploader";
import { ProfileAlert } from "./ProfileAlert";
import { ProfileSection } from "./ProfileSection";

function NameSubmitButton({
  pending,
  cooldown,
}: {
  pending: boolean;
  cooldown: number;
}) {
  const { isDirty } = useFormState();
  return (
    <SubmitButton
      label="Save"
      loadingLabel="Saving..."
      width="auto"
      isLoading={pending}
      disabled={!isDirty || cooldown > 0}
      className="w-full sm:w-auto"
    />
  );
}

export function IdentityCard({ profile }: { profile: UserProfile }) {
  const mutation = useUpdateProfile();
  const cooldown = useAuthCooldown();
  const formRef = useRef<GenericFormRef<UpdateProfileInput>>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const values = { name: profile.name };

  async function submit(input: UpdateProfileInput) {
    if (mutation.isPending || cooldown) return;
    setError(null);
    try {
      const next = await mutation.mutateAsync({ name: input.name });
      formRef.current?.reset({ name: next.name });
    } catch (failure) {
      const result = toApiError(failure);
      setError(result);
      if (result.fieldErrors.name) {
        formRef.current?.form.setError("name", {
          type: "server",
          message: result.fieldErrors.name,
        });
      }
    }
  }

  return (
    <ProfileSection
      title="Identity"
      description="Update the name and photo shown across your workspace."
    >
      <div className="space-y-5">
        <AvatarUploader profile={profile} />
        <GenericForm
          ref={formRef}
          schema={updateProfileSchema}
          initialValues={values}
          values={values}
          onSubmit={submit}
        >
          <fieldset
            disabled={mutation.isPending}
            className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
          >
            <TextField name="name" label="Name" autoComplete="name" required />
            <NameSubmitButton
              pending={mutation.isPending}
              cooldown={cooldown}
            />
          </fieldset>
          {error ? <ProfileAlert>{error.userMessage}</ProfileAlert> : null}
        </GenericForm>
      </div>
    </ProfileSection>
  );
}
