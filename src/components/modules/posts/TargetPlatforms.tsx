"use client";

import { Link2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { BaseSkeleton } from "@/components/reusable-ui-blocks/placeholder/skeletons/BaseSkeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useConnections, usePlatforms } from "@/hooks/connection.hook";
import { toApiError } from "@/lib/api-error";
import { routes } from "@/routes";
import type { Connection, Platform } from "@/types/connection.type";
import { PostNotice } from "./PostNotice";

type TargetPlatform = {
  key: string;
  name: string;
  status: "CONNECTED" | "EXPIRED" | "COMING_SOON" | "NOT_CONNECTED";
  accountName: string | null;
  platform: Platform;
};

function buildTargets(platforms: Platform[], connections: Connection[]) {
  const connectionByKey = new Map(
    connections.map((connection) => [connection.platform.key, connection]),
  );
  return platforms
    .filter((platform) => platform.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map<TargetPlatform>((platform) => {
      const connection = connectionByKey.get(platform.key);
      if (platform.status === "COMING_SOON") {
        return {
          key: platform.key,
          name: platform.name,
          status: "COMING_SOON",
          accountName: null,
          platform,
        };
      }
      if (!connection) {
        return {
          key: platform.key,
          name: platform.name,
          status: "NOT_CONNECTED",
          accountName: null,
          platform,
        };
      }
      return {
        key: platform.key,
        name: platform.name,
        status: connection.status,
        accountName: connection.platformAccountName,
        platform,
      };
    });
}

function TargetSkeleton() {
  return (
    <output aria-label="Loading publish targets" className="block space-y-3">
      {[0, 1].map((key) => (
        <BaseSkeleton key={key} className="h-16 w-full" />
      ))}
    </output>
  );
}

function targetReason(target: TargetPlatform) {
  if (target.status === "CONNECTED") return "Connected";
  if (target.status === "EXPIRED") return "Connection expired";
  if (target.status === "COMING_SOON") return "Coming soon";
  return "Connect first";
}

export function TargetPlatforms({
  value,
  onChange,
  onAvailabilityChange,
  disabled = false,
  error,
}: {
  value: string[];
  onChange: (keys: string[]) => void;
  onAvailabilityChange?: (hasConnectedPlatforms: boolean) => void;
  disabled?: boolean;
  error?: string | null;
}) {
  const platforms = usePlatforms();
  const connections = useConnections();
  const targets = useMemo(
    () => buildTargets(platforms.data ?? [], connections.data ?? []),
    [connections.data, platforms.data],
  );
  const connectedKeys = useMemo(
    () =>
      targets
        .filter((target) => target.status === "CONNECTED")
        .map((target) => target.key),
    [targets],
  );
  const connectedKeySet = useMemo(
    () => new Set(connectedKeys),
    [connectedKeys],
  );
  const hasConnectedPlatforms = connectedKeys.length > 0;

  useEffect(() => {
    onAvailabilityChange?.(hasConnectedPlatforms);
  }, [hasConnectedPlatforms, onAvailabilityChange]);

  useEffect(() => {
    const next = value.filter((key) => connectedKeySet.has(key));
    if (next.length !== value.length) onChange(next);
  }, [connectedKeySet, onChange, value]);

  function toggle(key: string, checked: boolean) {
    if (checked) {
      onChange(Array.from(new Set([...value, key])));
      return;
    }
    onChange(value.filter((selected) => selected !== key));
  }

  const loadError = platforms.error ?? connections.error;

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <div className="space-y-1">
        <legend className="text-sm font-medium">Publish to</legend>
        <p className="text-xs text-muted-foreground">
          Targets are chosen for publishing only. Saved posts stay immutable.
        </p>
      </div>
      {loadError ? (
        <PostNotice tone="error">
          <p>{toApiError(loadError).userMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              void platforms.refetch();
              void connections.refetch();
            }}
            disabled={platforms.isFetching || connections.isFetching}
          >
            Try again
          </Button>
        </PostNotice>
      ) : platforms.isPending || connections.isPending ? (
        <TargetSkeleton />
      ) : (
        <>
          {!hasConnectedPlatforms ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex gap-3">
                <span className="rounded-md bg-muted p-2 text-muted-foreground">
                  <Link2 className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 space-y-2">
                  <p className="text-sm font-medium">
                    Connect LinkedIn or Facebook to publish.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can still save a draft and publish it after connecting a
                    platform.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={routes.connections}>Go to connections</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            {targets.map((target) => {
              const inputId = `target-${target.key}`;
              const reasonId = `${inputId}-reason`;
              const connected = target.status === "CONNECTED";
              return (
                <div
                  key={target.key}
                  className={`rounded-lg border p-3 ${
                    connected
                      ? "border-border bg-card"
                      : "border-border bg-muted/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={inputId}
                      checked={value.includes(target.key)}
                      disabled={!connected || disabled}
                      aria-describedby={reasonId}
                      onCheckedChange={(checked) =>
                        toggle(target.key, checked === true)
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={inputId}
                        className="block cursor-pointer text-sm font-medium"
                      >
                        {target.name}
                      </label>
                      <p
                        id={reasonId}
                        className="mt-1 text-xs text-muted-foreground"
                      >
                        {target.accountName
                          ? `${targetReason(target)} as ${target.accountName}`
                          : targetReason(target)}
                      </p>
                      {target.status === "EXPIRED" ? (
                        <Link
                          href={routes.connections}
                          className="mt-2 inline-flex rounded-sm text-xs text-link hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          Reconnect
                        </Link>
                      ) : null}
                      {target.status === "NOT_CONNECTED" ? (
                        <Link
                          href={routes.connections}
                          className="mt-2 inline-flex rounded-sm text-xs text-link hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          Connect first
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </>
      )}
    </fieldset>
  );
}
