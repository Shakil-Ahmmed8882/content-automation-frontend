"use client";

import { AttachmentField } from "@/components/reusable-ui-blocks/attachment/AttachmentField";
import { BaseImage } from "@/components/reusable-ui-blocks/images/BaseImage";

const MAX_IMAGE_KB = 5 * 1024;

/**
 * Single-image picker for the second-step multipart upload (field `logo` /
 * `image`). Holds nothing itself: the parent keeps the picked File and uploads
 * it after the JSON save succeeds.
 */
export function AdminImageField({
  label,
  currentUrl,
  file,
  onChange,
  onRejectedChange,
}: {
  label: string;
  currentUrl?: string | null;
  file: File | null;
  onChange: (file: File | null) => void;
  onRejectedChange?: (hasRejected: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {currentUrl && !file ? (
        <div className="flex items-center gap-3">
          <BaseImage
            src={currentUrl}
            alt={`Current ${label.toLowerCase()}`}
            className="size-16 shrink-0 rounded-md bg-muted outline outline-1 outline-border"
            imgClass="object-contain p-1"
            sizes="64px"
          />
          <p className="text-xs text-muted-foreground">
            Current image. Choose a new one to replace it.
          </p>
        </div>
      ) : null}
      <AttachmentField
        files={file ? [file] : []}
        onAdd={(added) => onChange(added[added.length - 1] ?? null)}
        onRemove={() => onChange(null)}
        accept="image/*"
        maxSizeKb={MAX_IMAGE_KB}
        onRejectedChange={onRejectedChange}
      />
    </div>
  );
}
