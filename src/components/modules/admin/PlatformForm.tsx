"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  GenericForm,
  type GenericFormRef,
  SelectField,
  SubmitButton,
  SwitchField,
  TextField,
} from "@/components/reusable-ui-blocks/form";
import { Button } from "@/components/ui/button";
import {
  useCreateAdminPlatform,
  useSetAdminPlatformLogo,
  useUpdateAdminPlatform,
} from "@/hooks/admin-platform.hook";
import { toApiError } from "@/lib/api-error";
import type { Platform } from "@/types/admin.type";
import {
  type PlatformCreateValues,
  platformCreateSchema,
} from "@/validation/admin.validation";
import { AdminImageField } from "./AdminImageField";

const statusOptions = [
  { value: "LIVE", text: "Live" },
  { value: "COMING_SOON", text: "Coming soon" },
];

export function PlatformForm({
  platform,
  onClose,
  onUploadFailed,
}: {
  platform?: Platform;
  onClose: () => void;
  onUploadFailed: (id: string, file: File) => void;
}) {
  const formRef = useRef<GenericFormRef<PlatformCreateValues>>(null);
  const create = useCreateAdminPlatform();
  const update = useUpdateAdminPlatform();
  const setLogo = useSetAdminPlatformLogo();
  const [file, setFile] = useState<File | null>(null);
  const [imageRejected, setImageRejected] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const pending = create.isPending || update.isPending || setLogo.isPending;

  async function submit(values: PlatformCreateValues) {
    if (pending) return;
    setFormError(null);
    const sortOrder = Number(values.sortOrder);
    try {
      const saved = platform
        ? await update.mutateAsync({
            id: platform.id,
            body: {
              name: values.name,
              status: values.status,
              sortOrder,
              isActive: values.isActive,
            },
          })
        : await create.mutateAsync({
            key: values.key,
            name: values.name,
            status: values.status,
            sortOrder,
            isActive: values.isActive,
          });
      if (file) {
        try {
          await setLogo.mutateAsync({ id: saved.id, file });
        } catch {
          toast.error("Saved, but the logo couldn't be uploaded.");
          onUploadFailed(saved.id, file);
        }
      }
      onClose();
    } catch (failure) {
      const error = toApiError(failure);
      if (error.status === 409) {
        formRef.current?.form.setError("key", {
          type: "server",
          message: error.message,
        });
        return;
      }
      setFormError(error.userMessage);
      toast.error(error.userMessage);
    }
  }

  return (
    <GenericForm
      ref={formRef}
      schema={platformCreateSchema}
      initialValues={{
        key: platform?.key ?? "",
        name: platform?.name ?? "",
        status: platform?.status ?? "COMING_SOON",
        sortOrder: String(platform?.sortOrder ?? 0),
        isActive: platform?.isActive ?? true,
      }}
      mode="onTouched"
      onSubmit={submit}
    >
      <fieldset disabled={pending} className="grid gap-4" aria-busy={pending}>
        <TextField<PlatformCreateValues>
          name="key"
          label="Key"
          required
          readOnly={!!platform}
          disabled={!!platform}
          description={
            platform
              ? "The key can't be changed after creation."
              : "Lowercase letters, numbers and hyphens, e.g. linkedin."
          }
        />
        <TextField<PlatformCreateValues> name="name" label="Name" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField<PlatformCreateValues>
            name="status"
            label="Status"
            options={statusOptions}
            contentClassName="z-1000000"
            description="Live needs a connector in the backend; otherwise connect returns 'No integration is wired for this platform yet'."
          />
          <TextField<PlatformCreateValues>
            name="sortOrder"
            label="Order"
            type="number"
          />
        </div>
        <SwitchField<PlatformCreateValues> name="isActive" label="Active" />
        <AdminImageField
          label="Logo"
          currentUrl={platform?.logoUrl}
          file={file}
          onChange={setFile}
          onRejectedChange={setImageRejected}
        />
      </fieldset>
      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <SubmitButton
          label={platform ? "Save changes" : "Create platform"}
          loadingLabel="Saving..."
          isLoading={pending}
          disabled={imageRejected}
          width="auto"
        />
      </div>
    </GenericForm>
  );
}
