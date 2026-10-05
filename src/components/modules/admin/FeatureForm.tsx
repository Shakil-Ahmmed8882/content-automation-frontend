"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  GenericForm,
  type GenericFormRef,
  SelectField,
  SubmitButton,
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/reusable-ui-blocks/form";
import { Button } from "@/components/ui/button";
import {
  useCreateAdminFeature,
  useSetAdminFeatureImage,
  useUpdateAdminFeature,
} from "@/hooks/admin-feature.hook";
import { toApiError } from "@/lib/api-error";
import type { AdminFeature, FeatureBody } from "@/types/admin.type";
import {
  type FeatureValues,
  featureSchema,
} from "@/validation/admin.validation";
import { AdminImageField } from "./AdminImageField";

const statusOptions = [
  { value: "COMING_SOON", text: "Coming soon" },
  { value: "IN_DEVELOPMENT", text: "In development" },
  { value: "PLANNED", text: "Planned" },
];

export function FeatureForm({
  feature,
  onClose,
  onUploadFailed,
}: {
  feature?: AdminFeature;
  onClose: () => void;
  onUploadFailed: (id: string, file: File) => void;
}) {
  const formRef = useRef<GenericFormRef<FeatureValues>>(null);
  const create = useCreateAdminFeature();
  const update = useUpdateAdminFeature();
  const setImage = useSetAdminFeatureImage();
  const [file, setFile] = useState<File | null>(null);
  const [imageRejected, setImageRejected] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const pending = create.isPending || update.isPending || setImage.isPending;

  async function submit(values: FeatureValues) {
    if (pending) return;
    setFormError(null);
    const body: FeatureBody = {
      slug: values.slug,
      title: values.title,
      shortDescription: values.shortDescription,
      description: values.description,
      status: values.status,
      sortOrder: Number(values.sortOrder),
      isPremiumVisible: values.isPremiumVisible,
    };
    try {
      const saved = feature
        ? await update.mutateAsync({ id: feature.id, body })
        : await create.mutateAsync(body);
      if (file) {
        try {
          await setImage.mutateAsync({ id: saved.id, file });
        } catch {
          toast.error("Saved, but the image couldn't be uploaded.");
          onUploadFailed(saved.id, file);
        }
      }
      onClose();
    } catch (failure) {
      const error = toApiError(failure);
      if (error.status === 409) {
        formRef.current?.form.setError("slug", {
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
      schema={featureSchema}
      initialValues={{
        slug: feature?.slug ?? "",
        title: feature?.title ?? "",
        shortDescription: feature?.shortDescription ?? "",
        description: feature?.description ?? "",
        status: feature?.status ?? "COMING_SOON",
        sortOrder: String(feature?.sortOrder ?? 0),
        isPremiumVisible: feature?.isPremiumVisible ?? true,
      }}
      mode="onTouched"
      onSubmit={submit}
    >
      <fieldset disabled={pending} className="grid gap-4" aria-busy={pending}>
        <TextField<FeatureValues> name="title" label="Title" required />
        <TextField<FeatureValues>
          name="slug"
          label="Slug"
          required
          description="Lowercase letters, numbers and hyphens."
        />
        <TextField<FeatureValues>
          name="shortDescription"
          label="Short description"
          required
        />
        <TextareaField<FeatureValues>
          name="description"
          label="Description"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField<FeatureValues>
            name="status"
            label="Status"
            options={statusOptions}
            contentClassName="z-1000000"
          />
          <TextField<FeatureValues>
            name="sortOrder"
            label="Order"
            type="number"
          />
        </div>
        <SwitchField<FeatureValues>
          name="isPremiumVisible"
          label="Visible to Premium"
        />
        <AdminImageField
          label="Image"
          currentUrl={feature?.imageUrl}
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
          label={feature ? "Save changes" : "Create feature"}
          loadingLabel="Saving..."
          isLoading={pending}
          disabled={imageRejected}
          width="auto"
        />
      </div>
    </GenericForm>
  );
}
