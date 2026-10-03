"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BaseButton } from "@/components/reusable-ui-blocks/buttons/BaseButton";
import { BaseSkeleton } from "@/components/reusable-ui-blocks/placeholder/skeletons/BaseSkeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useConnections } from "@/hooks/connection.hook";
import { usePublishPost } from "@/hooks/execution.hook";
import { usePost } from "@/hooks/post.hook";
import { cn } from "@/lib/utils";
import { routes } from "@/routes/app.routes";
import type { Connection } from "@/types/connection.type";
import {
  getErrorMessage,
  needsConnectionAction,
  platformNameFromKey,
} from "./utils";

type ConnectionOption = {
  key: string;
  name: string;
  status: Connection["status"];
  accountName: string | null;
};

function parsePublishParam(value: string | null) {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(",")
        .map((key) => key.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function connectionMessage(option: ConnectionOption) {
  if (option.status === "EXPIRED") {
    return `${option.name} connection has expired. Please reconnect.`;
  }
  return null;
}

export function PublishPanel({ postId }: { postId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedKeys = useMemo(
    () => parsePublishParam(searchParams.get("publish")),
    [searchParams],
  );
  const requestedKeySignature = requestedKeys.join(",");
  const appliedPublishParam = useRef<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const connections = useConnections();
  const post = usePost(postId);
  const publish = usePublishPost();

  const options = useMemo<ConnectionOption[]>(
    () =>
      (connections.data ?? []).map((connection) => ({
        key: connection.platform.key,
        name: connection.platform.name,
        status: connection.status,
        accountName: connection.platformAccountName,
      })),
    [connections.data],
  );

  const connectedKeys = useMemo(
    () =>
      new Set(
        options
          .filter((option) => option.status === "CONNECTED")
          .map((option) => option.key),
      ),
    [options],
  );

  useEffect(() => {
    if (
      requestedKeySignature === appliedPublishParam.current ||
      options.length === 0
    ) {
      return;
    }
    appliedPublishParam.current = requestedKeySignature;
    setSelectedKeys(
      requestedKeys.filter((key) =>
        options.some(
          (option) => option.key === key && option.status === "CONNECTED",
        ),
      ),
    );
  }, [options, requestedKeySignature, requestedKeys]);

  const missingRequestedKeys = requestedKeys.filter(
    (key) => !options.some((option) => option.key === key),
  );
  const expiredRequestedOptions = options.filter(
    (option) =>
      requestedKeys.includes(option.key) && option.status === "EXPIRED",
  );
  const hasPostContent = Boolean(post.data?.content.trim());
  const disabledReason = !hasPostContent
    ? "This post has no content to publish."
    : selectedKeys.length === 0
      ? "Select at least one platform"
      : null;
  const canPublish =
    selectedKeys.length > 0 &&
    hasPostContent &&
    !publish.isPending &&
    !connections.isPending &&
    !post.isPending;

  function togglePlatform(key: string, checked: boolean) {
    setSelectedKeys((current) => {
      if (checked) return Array.from(new Set([...current, key]));
      return current.filter((item) => item !== key);
    });
  }

  function clearPublishParam() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("publish");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function handlePublish() {
    if (!canPublish) return;
    publish.mutate(
      { postId, platforms: selectedKeys },
      {
        onSuccess: (result) => {
          clearPublishParam();
          toast.success("Publishing started. You can leave this page.");
          router.push(routes.executionDetail(result.executionId));
        },
        onError: (error) => {
          const message = getErrorMessage(error);
          toast.error(message, {
            action: needsConnectionAction(message)
              ? {
                  label: "Connections",
                  onClick: () => router.push(routes.connections),
                }
              : undefined,
          });
        },
      },
    );
  }

  if (connections.isPending || post.isPending) {
    return (
      <section className="rounded-lg border border-border bg-card p-6 shadow-card">
        <BaseSkeleton className="h-6 w-40" />
        <BaseSkeleton className="mt-4 h-20 w-full" />
        <BaseSkeleton className="mt-3 h-10 w-36" />
      </section>
    );
  }

  if (connections.isError || post.isError) {
    const message = getErrorMessage(connections.error ?? post.error);
    return (
      <section className="rounded-lg border border-border bg-card p-6 shadow-card">
        <h2 className="text-display-sm tracking-[-0.04em]">Publish now</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <BaseButton
          type="button"
          className="mt-5 bg-primary text-primary-foreground hover:bg-primary-hover"
          onClick={() => {
            void connections.refetch();
            void post.refetch();
          }}
        >
          Try again
        </BaseButton>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-border bg-card p-6 shadow-card"
      aria-labelledby="publish-panel-title"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Publish</p>
          <h2
            id="publish-panel-title"
            className="mt-2 text-display-sm tracking-[-0.04em]"
          >
            Publish now
          </h2>
        </div>
        <Link
          href={routes.connections}
          className="text-sm font-medium text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          Manage connections
        </Link>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Choose where this saved post should be published. Nothing starts until
        you press Publish now.
      </p>

      <fieldset className="mt-5 space-y-3">
        <legend className="sr-only">Platforms</legend>
        {options.length === 0 ? (
          <div className="rounded-md border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium">
              Connect LinkedIn before publishing.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a live LinkedIn or Facebook connection to publish this post.
            </p>
          </div>
        ) : (
          options.map((option) => {
            const disabled = !connectedKeys.has(option.key);
            const message = connectionMessage(option);
            const checkboxId = `publish-${option.key}`;
            return (
              <div
                key={option.key}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background p-4 transition-[border-color,background-color] duration-150",
                  "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40",
                  disabled && "cursor-not-allowed opacity-70",
                )}
              >
                <Checkbox
                  id={checkboxId}
                  checked={selectedKeys.includes(option.key)}
                  disabled={disabled}
                  aria-label={`Publish to ${option.name}`}
                  onCheckedChange={(checked) =>
                    togglePlatform(option.key, checked === true)
                  }
                />
                <label htmlFor={checkboxId} className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {option.name}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {option.accountName ?? "Linked account"}
                  </span>
                  {message ? (
                    <span className="mt-2 block text-xs text-warning">
                      {message}
                    </span>
                  ) : null}
                </label>
              </div>
            );
          })
        )}
      </fieldset>

      {[
        ...missingRequestedKeys,
        ...expiredRequestedOptions.map((item) => item.key),
      ].length > 0 ? (
        <div className="mt-4 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          {missingRequestedKeys.map((key) => (
            <p key={key}>
              Connect {platformNameFromKey(key)} before publishing.
            </p>
          ))}
          {expiredRequestedOptions.map((option) => (
            <p key={option.key}>
              {option.name} connection has expired. Please reconnect.
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <BaseButton
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary-hover active:scale-[0.96]"
          isLoading={publish.isPending}
          disabled={!canPublish}
          onClick={handlePublish}
        >
          Publish now
        </BaseButton>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {disabledReason ?? "Publishing creates a server-side execution."}
        </p>
      </div>
    </section>
  );
}
