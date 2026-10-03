"use client";

import { CalendarClock, Link2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { platformIcons } from "@/components/brand/PlatformIcons";
import { BaseButton } from "@/components/reusable-ui-blocks/buttons/BaseButton";
import { BaseImage } from "@/components/reusable-ui-blocks/images/BaseImage";
import { DeleteConfirmModal } from "@/components/reusable-ui-blocks/modal/veriations/DeleteConfirmModal";
import { cn } from "@/lib/utils";
import type { Connection } from "@/types/connection.type";
import type { Platform } from "@/types/platform.type";
import {
  type ConnectionCardStatus,
  ConnectionStatusBadge,
} from "./ConnectionStatusBadge";
import { apiMessage, formatDate } from "./connection-ui.helpers";

function deriveStatus(platform: Platform, connection?: Connection) {
  if (platform.status === "COMING_SOON") return "COMING_SOON";
  return connection?.status ?? "NOT_CONNECTED";
}

function PlatformLogo({ platform }: { platform: Platform }) {
  const Icon = platformIcons[platform.key as keyof typeof platformIcons];

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground outline outline-1 outline-border">
      {platform.logoUrl ? (
        <BaseImage
          src={platform.logoUrl}
          alt=""
          aria-hidden="true"
          className="size-12 rounded-md"
          imgClass="object-contain p-2"
          sizes="48px"
        />
      ) : Icon ? (
        <Icon aria-hidden="true" className="size-6" />
      ) : (
        <Link2 aria-hidden="true" className="size-5" />
      )}
    </div>
  );
}

export function PlatformCard({
  platform,
  connection,
  pendingConnect,
  pendingDisconnect,
  onConnect,
  onDisconnect,
}: {
  platform: Platform;
  connection?: Connection;
  pendingConnect: boolean;
  pendingDisconnect: boolean;
  onConnect: (platformKey: string) => Promise<void>;
  onDisconnect: (platformKey: string) => Promise<void>;
}) {
  const titleId = useId();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const status = deriveStatus(platform, connection) as ConnectionCardStatus;
  const disabled = status === "COMING_SOON" || pendingConnect;
  const connectLabel = status === "EXPIRED" ? "Reconnect" : "Connect";

  async function confirmDisconnect() {
    try {
      await onDisconnect(platform.key);
      setConfirmOpen(false);
    } catch (error) {
      toast.error(apiMessage(error));
    }
  }

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex min-w-0 flex-col gap-5 rounded-lg bg-card p-5 shadow-card sm:p-6",
        status === "COMING_SOON" && "opacity-70",
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <PlatformLogo platform={platform} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h2
              id={titleId}
              className="truncate text-lg font-semibold tracking-[-0.02em]"
            >
              {platform.name}
            </h2>
            <ConnectionStatusBadge status={status} />
          </div>
          {connection?.platformAccountName ? (
            <p className="text-sm text-muted-foreground">
              {status === "EXPIRED" ? "Expired account" : "Connected"} as{" "}
              <span className="text-foreground">
                {connection.platformAccountName}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {status === "COMING_SOON"
                ? "This platform is not available to connect yet."
                : "Link an account to publish to this platform."}
            </p>
          )}
        </div>
      </div>

      <div className="min-h-12 space-y-2 text-sm text-muted-foreground">
        {connection?.createdAt ? (
          <p>
            Connected{" "}
            <time dateTime={connection.createdAt}>
              {formatDate(connection.createdAt)}
            </time>
          </p>
        ) : null}
        {connection?.expiresAt ? (
          <p className="flex items-center gap-2">
            <CalendarClock aria-hidden="true" className="size-4" />
            Expires{" "}
            <time dateTime={connection.expiresAt}>
              {formatDate(connection.expiresAt)}
            </time>
          </p>
        ) : null}
      </div>

      <div aria-live="polite" className="flex flex-col gap-2 sm:flex-row">
        {status === "COMING_SOON" ? (
          <BaseButton
            type="button"
            disabled
            className="h-10 w-full rounded-sm border border-border bg-muted px-4 text-sm text-muted-foreground sm:w-auto"
          >
            Coming soon
          </BaseButton>
        ) : status === "CONNECTED" || status === "EXPIRED" ? (
          <>
            {status === "EXPIRED" ? (
              <BaseButton
                type="button"
                disabled={disabled}
                isLoading={pendingConnect}
                aria-busy={pendingConnect}
                onClick={() => onConnect(platform.key)}
                className="h-10 w-full rounded-sm bg-primary px-4 text-sm text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-ring sm:w-auto"
              >
                {pendingConnect ? "Redirecting..." : connectLabel}
              </BaseButton>
            ) : null}
            <BaseButton
              type="button"
              disabled={pendingDisconnect}
              onClick={() => setConfirmOpen(true)}
              className="h-10 w-full rounded-sm border border-border bg-background px-4 text-sm text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring sm:w-auto"
            >
              Disconnect
            </BaseButton>
          </>
        ) : (
          <BaseButton
            type="button"
            disabled={disabled}
            isLoading={pendingConnect}
            aria-busy={pendingConnect}
            onClick={() => onConnect(platform.key)}
            className="h-10 w-full rounded-sm bg-primary px-4 text-sm text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-ring sm:w-auto"
          >
            {pendingConnect ? "Redirecting..." : connectLabel}
          </BaseButton>
        )}
      </div>

      {confirmOpen ? (
        <DeleteConfirmModal
          open={confirmOpen}
          loading={pendingDisconnect}
          title={`Disconnect ${platform.name}?`}
          message={`You won't be able to publish to ${platform.name} until you reconnect. Existing posts and history are kept.`}
          confirmLabel="Disconnect"
          cancelLabel="Keep connection"
          onClose={() => setConfirmOpen(false)}
          onConfirm={confirmDisconnect}
        />
      ) : null}
    </section>
  );
}
