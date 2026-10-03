"use client";

import { Camera, Trash2, UploadCloud } from "lucide-react";
import { type ChangeEvent, useEffect, useId, useRef, useState } from "react";
import { BaseAvatar } from "@/components/reusable-ui-blocks/images/variations/avatar/BaseAvatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRemoveAvatar, useUploadAvatar } from "@/hooks/user.hook";
import { toApiError } from "@/lib/api-error";
import type { UserProfile } from "@/types/user.type";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function AvatarUploader({ profile }: { profile: UserProfile }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = upload.isPending || remove.isPending;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const [file] = event.target.files ?? [];
    event.target.value = "";
    if (!file || busy) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Image must be 5 MB or smaller.");
      return;
    }
    const nextPreview = URL.createObjectURL(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return nextPreview;
    });
    setError(null);
    try {
      await upload.mutateAsync(file);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    } catch (failure) {
      const result = toApiError(failure);
      setError(
        result.status >= 500
          ? "Couldn't upload your photo. Please try again."
          : result.userMessage,
      );
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    }
  }

  async function handleRemove() {
    if (busy) return;
    setError(null);
    try {
      await remove.mutateAsync();
    } catch (failure) {
      setError(toApiError(failure).userMessage);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 shrink-0">
          <BaseAvatar
            src={previewUrl ?? profile.avatarUrl}
            name={profile.name}
            alt={`${profile.name}'s profile photo`}
            size="xl"
            initialsCount={2}
            className="size-24 shadow-ring"
          />
          {upload.isPending ? (
            <span
              className="absolute inset-0 grid place-items-center rounded-full bg-background/70 text-muted-foreground"
              aria-live="polite"
            >
              <UploadCloud
                className="size-5 animate-pulse"
                aria-hidden="true"
              />
              <span className="sr-only">Uploading profile photo</span>
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
          <Label htmlFor={inputId} className="sr-only">
            Change profile photo
          </Label>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
            disabled={busy}
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            aria-busy={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Camera aria-hidden="true" />
            Change photo
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || (!profile.avatarUrl && !previewUrl)}
            aria-busy={remove.isPending}
            onClick={() => void handleRemove()}
          >
            <Trash2 aria-hidden="true" />
            Remove
          </Button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Use an image file up to 5 MB. Your initials show when no photo is set.
        </p>
      )}
    </div>
  );
}
