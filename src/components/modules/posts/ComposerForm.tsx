"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { AttachmentField } from "@/components/reusable-ui-blocks/attachment/AttachmentField";
import {
  GenericForm,
  type GenericFormRef,
  SubmitButton,
  TextareaField,
  TextField,
} from "@/components/reusable-ui-blocks/form";
import { Button } from "@/components/ui/button";
import { useConnections } from "@/hooks/connection.hook";
import { useCreatePost } from "@/hooks/post.hook";
import { toApiError } from "@/lib/api-error";
import { routes } from "@/routes";
import {
  type CreatePostInput,
  createPostSchema,
  POST_IMAGE_MAX_KB,
  publishTargetSchema,
} from "@/validation/post.validation";
import { PostNotice } from "./PostNotice";
import { PostPreview, type PreviewPlatform } from "./PostPreview";
import { TargetPlatforms } from "./TargetPlatforms";

type SubmitIntent = "draft" | "publish";

const initialValues: CreatePostInput = {
  title: "",
  content: "",
  image: undefined,
  platformKeys: [],
};

function useOnlineStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

function useUnsavedChangesWarning(shouldWarn: boolean) {
  useEffect(() => {
    if (!shouldWarn) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [shouldWarn]);

  useEffect(() => {
    if (!shouldWarn) return;
    const confirmLeave = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !target ||
        target.target === "_blank" ||
        target.hasAttribute("download")
      )
        return;
      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const next = `${destination.pathname}${destination.search}${destination.hash}`;
      if (current === next) return;
      if (!window.confirm("Discard this post?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", confirmLeave, true);
    return () => document.removeEventListener("click", confirmLeave, true);
  }, [shouldWarn]);
}

function ComposerStateBridge({
  imageFile,
  onDirtyChange,
  onPreviewChange,
}: {
  imageFile: File | null;
  onDirtyChange: (dirty: boolean) => void;
  onPreviewChange: (value: { title: string; content: string }) => void;
}) {
  const { control } = useFormContext<CreatePostInput>();
  const [title, content] = useWatch({
    control,
    name: ["title", "content"],
  });
  const contentLength = content?.length ?? 0;
  const announcedCount = Math.floor(contentLength / 100) * 100;

  useEffect(() => {
    onDirtyChange(
      Boolean(title?.trim()) || Boolean(content?.trim()) || imageFile !== null,
    );
  }, [content, imageFile, onDirtyChange, title]);

  useEffect(() => {
    onPreviewChange({ title: title ?? "", content: content ?? "" });
  }, [content, onPreviewChange, title]);

  return (
    <p className="-mt-3 text-right text-xs leading-5 text-muted-foreground">
      <span aria-hidden="true">{contentLength} characters</span>
      <span className="sr-only" aria-live="polite">
        {announcedCount} characters entered
      </span>
    </p>
  );
}

export function ComposerForm() {
  const router = useRouter();
  const mutation = useCreatePost();
  const connections = useConnections();
  const formRef = useRef<GenericFormRef<CreatePostInput>>(null);
  const intentRef = useRef<SubmitIntent>("draft");
  const inFlightRef = useRef(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [hasConnectedPlatforms, setHasConnectedPlatforms] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageRejected, setImageRejected] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const [previewDraft, setPreviewDraft] = useState({ title: "", content: "" });
  const [submitted, setSubmitted] = useState(false);
  const online = useOnlineStatus();

  useUnsavedChangesWarning(formDirty && !submitted);

  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : undefined),
    [imageFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const selectedPreviewPlatforms = useMemo<PreviewPlatform[]>(() => {
    const selected = new Set(selectedKeys);
    return (connections.data ?? [])
      .filter(
        (connection) =>
          connection.status === "CONNECTED" &&
          selected.has(connection.platform.key),
      )
      .map((connection) => ({
        key: connection.platform.key,
        name: connection.platform.name,
        accountName: connection.platformAccountName,
      }));
  }, [connections.data, selectedKeys]);

  const handleAvailabilityChange = useCallback(
    (available: boolean) => setHasConnectedPlatforms(available),
    [],
  );

  const handleDirtyChange = useCallback(
    (dirty: boolean) => setFormDirty(dirty),
    [],
  );
  const handlePreviewChange = useCallback(
    (value: { title: string; content: string }) => setPreviewDraft(value),
    [],
  );

  async function submit(values: CreatePostInput) {
    if (mutation.isPending || inFlightRef.current || !online) return;
    inFlightRef.current = true;
    setServerError(null);
    setImageError(null);
    setPlatformError(null);

    const intent = intentRef.current;
    const parsed = createPostSchema.safeParse({
      ...values,
      image: imageFile ?? undefined,
      platformKeys: selectedKeys,
    });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "content") {
          formRef.current?.form.setError("content", {
            type: "manual",
            message: issue.message,
          });
        }
        if (field === "image") setImageError(issue.message);
      }
      inFlightRef.current = false;
      return;
    }

    if (intent === "publish") {
      const publishTargets = publishTargetSchema.safeParse({
        platformKeys: selectedKeys,
      });
      if (!publishTargets.success) {
        setPlatformError(
          publishTargets.error.issues[0]?.message ??
            "Select at least one platform to publish to",
        );
        inFlightRef.current = false;
        return;
      }
    }

    try {
      const post = await mutation.mutateAsync(parsed.data);
      setSubmitted(true);
      if (intent === "publish") {
        toast.success("Post saved. Review and publish.");
        const publish = selectedKeys.map(encodeURIComponent).join(",");
        router.push(`${routes.postDetail(post.id)}?publish=${publish}`);
      } else {
        toast.success("Post saved.");
        router.push(routes.postDetail(post.id));
      }
    } catch (error) {
      const failure = toApiError(error);
      setServerError(failure.userMessage);
      inFlightRef.current = false;
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(280px,2fr)]">
      <section aria-labelledby="create-post-heading" className="min-w-0">
        <div className="mb-6">
          <p className="eyebrow mb-3">Composer</p>
          <h1
            id="create-post-heading"
            className="text-display-lg tracking-[-0.04em]"
          >
            Create post
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Write once, save it, then hand it to publishing when you are ready.
          </p>
        </div>
        <GenericForm
          ref={formRef}
          schema={createPostSchema}
          initialValues={initialValues}
          onSubmit={submit}
          className="space-y-8"
        >
          <fieldset disabled={mutation.isPending} className="space-y-6">
            <TextField
              name="title"
              label="Title"
              placeholder="Optional headline"
              autoComplete="off"
            />
            <TextareaField
              name="content"
              label="Content"
              placeholder="What do you want to publish?"
              required
              rows={8}
              inputClassName="min-h-44"
            />
            <ComposerStateBridge
              imageFile={imageFile}
              onDirtyChange={handleDirtyChange}
              onPreviewChange={handlePreviewChange}
            />
          </fieldset>
          <div className="space-y-3">
            <div>
              <p className="text-sm leading-5 font-medium">Image</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Optional. One image, image type only, up to 5 MB after
                preparation.
              </p>
            </div>
            <AttachmentField
              files={imageFile ? [imageFile] : []}
              accept="image/*"
              maxSizeKb={POST_IMAGE_MAX_KB}
              onRejectedChange={setImageRejected}
              onAdd={(files) => {
                setImageError(null);
                setImageFile(files.at(-1) ?? null);
              }}
              onRemove={() => {
                setImageError(null);
                setImageFile(null);
              }}
            />
            {imageError ? (
              <p
                role="alert"
                className="text-xs leading-5 text-destructive-text"
              >
                {imageError}
              </p>
            ) : null}
          </div>
          <TargetPlatforms
            value={selectedKeys}
            onChange={(keys) => {
              setSelectedKeys(keys);
              setPlatformError(null);
            }}
            onAvailabilityChange={handleAvailabilityChange}
            disabled={mutation.isPending}
            error={platformError}
          />
          {!online ? (
            <PostNotice tone="error">
              You are offline. Reconnect before saving this post.
            </PostNotice>
          ) : null}
          {serverError ? (
            <PostNotice tone="error">{serverError}</PostNotice>
          ) : null}
          <PostNotice>
            Posts cannot be edited after saving. You can delete a saved post and
            create a new one if the content needs to change.
          </PostNotice>
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
            <Button asChild variant="ghost" size="xl">
              <Link href={routes.dashboard}>Cancel</Link>
            </Button>
            <SubmitButton
              label="Save draft"
              loadingLabel="Saving..."
              width="auto"
              disabled={imageRejected || !online || mutation.isPending}
              isLoading={mutation.isPending && intentRef.current === "draft"}
              onClick={() => {
                intentRef.current = "draft";
              }}
              className="w-full sm:w-auto"
            />
            <Button
              type="submit"
              size="xl"
              disabled={
                imageRejected ||
                !online ||
                mutation.isPending ||
                !hasConnectedPlatforms
              }
              aria-busy={mutation.isPending && intentRef.current === "publish"}
              onClick={() => {
                intentRef.current = "publish";
              }}
              className="w-full sm:w-auto"
            >
              {mutation.isPending && intentRef.current === "publish"
                ? "Saving..."
                : "Save & publish"}
            </Button>
          </div>
        </GenericForm>
      </section>
      <PostPreview
        platforms={selectedPreviewPlatforms}
        title={previewDraft.title}
        content={previewDraft.content}
        imageUrl={previewUrl}
      />
    </div>
  );
}
