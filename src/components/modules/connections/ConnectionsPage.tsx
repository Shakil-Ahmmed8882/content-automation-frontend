"use client";

import { AlertCircle, Link2, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BaseButton } from "@/components/reusable-ui-blocks/buttons/BaseButton";
import { NoResultFoundWrapper } from "@/components/reusable-ui-blocks/placeholder/no-results-found-wrapper/NoResultFoundWrapper";
import { CardSkeletonV2 } from "@/components/reusable-ui-blocks/placeholder/skeletons/CardSkeletons";
import {
  useConnections,
  useDisconnectConnection,
  usePlatforms,
  useStartConnection,
} from "@/hooks/connection.hook";
import { routes } from "@/routes";
import type { Connection } from "@/types/connection.type";
import type { Platform } from "@/types/platform.type";
import { apiMessage } from "./connection-ui.helpers";
import { FacebookPagePicker } from "./FacebookPagePicker";
import { normalizeOAuthError, OAuthErrorBanner } from "./OAuthErrorBanner";
import { PlatformCard } from "./PlatformCard";

function ConnectionsLoading() {
  return (
    <output
      aria-label="Loading platforms"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2"
    >
      {[0, 1].map((item) => (
        <CardSkeletonV2 key={item} />
      ))}
    </output>
  );
}

function EmptyPlatforms() {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Link2 aria-hidden="true" className="size-5" />
      </div>
      <h2 className="text-lg font-semibold tracking-[-0.02em]">
        No platforms available yet.
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Platforms will appear here when the backend marks them active.
      </p>
    </div>
  );
}

function ConnectionsError({
  error,
  retry,
  pending,
}: {
  error: unknown;
  retry: () => void;
  pending: boolean;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 shadow-card"
    >
      <div className="flex gap-3">
        <AlertCircle
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-destructive"
        />
        <div className="min-w-0">
          <h2 className="font-medium">Couldn't load connections.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {apiMessage(error)}
          </p>
          <BaseButton
            type="button"
            disabled={pending}
            onClick={retry}
            className="mt-4 h-10 rounded-sm border border-border bg-background px-4 text-sm text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            {pending ? "Retrying..." : "Try again"}
          </BaseButton>
        </div>
      </div>
    </div>
  );
}

function byPlatformKey(connections: Connection[]) {
  return new Map(
    connections.map((connection) => [connection.platform.key, connection]),
  );
}

function sortPlatforms(platforms: Platform[]) {
  return [...platforms]
    .filter((platform) => platform.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export default function ConnectionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const platforms = usePlatforms();
  const connections = useConnections();
  const startConnect = useStartConnection();
  const disconnect = useDisconnectConnection();
  const [pendingConnectKey, setPendingConnectKey] = useState<string | null>(
    null,
  );
  const [pendingDisconnectKey, setPendingDisconnectKey] = useState<
    string | null
  >(null);

  const sortedPlatforms = useMemo(
    () => sortPlatforms(platforms.data ?? []),
    [platforms.data],
  );
  const connectionByKey = useMemo(
    () => byPlatformKey(connections.data ?? []),
    [connections.data],
  );
  const error = platforms.error ?? connections.error;
  const loading = platforms.isPending || connections.isPending;
  const selectFacebook = searchParams.get("select") === "facebook";
  const oauthError = normalizeOAuthError(searchParams.get("error"));
  const hasNoConnectedAccounts = (connections.data ?? []).length === 0;

  async function connect(platformKey: string) {
    if (startConnect.isPending) return;
    setPendingConnectKey(platformKey);
    try {
      const result = await startConnect.mutateAsync(platformKey);
      window.location.assign(result.authUrl);
    } catch (failure) {
      toast.error(apiMessage(failure));
      setPendingConnectKey(null);
    }
  }

  async function disconnectPlatform(platformKey: string) {
    setPendingDisconnectKey(platformKey);
    try {
      await disconnect.mutateAsync(platformKey);
      const platformName =
        sortedPlatforms.find((platform) => platform.key === platformKey)
          ?.name ?? "Platform";
      toast.success(`${platformName} disconnected.`);
    } finally {
      setPendingDisconnectKey(null);
    }
  }

  function retry() {
    void platforms.refetch();
    void connections.refetch();
  }

  function closeQueryState() {
    router.replace(routes.connections, { scroll: false });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="eyebrow">Publishing setup</p>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Connections
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Link LinkedIn and Facebook Page accounts before publishing. Access
            tokens stay encrypted on the backend and are never exposed here.
          </p>
        </div>
      </header>

      {oauthError ? (
        <OAuthErrorBanner code={oauthError} onDismiss={closeQueryState} />
      ) : null}

      {!loading && !error && hasNoConnectedAccounts ? (
        <output className="block rounded-lg border border-border bg-muted p-4 text-sm">
          Connect LinkedIn or Facebook to start publishing.
        </output>
      ) : null}

      {error ? (
        <ConnectionsError
          error={error}
          pending={platforms.isFetching || connections.isFetching}
          retry={retry}
        />
      ) : loading ? (
        <ConnectionsLoading />
      ) : (
        <NoResultFoundWrapper
          data={sortedPlatforms}
          fallback={<EmptyPlatforms />}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {sortedPlatforms.map((platform) => (
              <PlatformCard
                key={platform.key}
                platform={platform}
                connection={connectionByKey.get(platform.key)}
                pendingConnect={pendingConnectKey === platform.key}
                pendingDisconnect={pendingDisconnectKey === platform.key}
                onConnect={connect}
                onDisconnect={disconnectPlatform}
              />
            ))}
          </div>
        </NoResultFoundWrapper>
      )}

      <FacebookPagePicker
        open={selectFacebook}
        onClose={closeQueryState}
        onRestart={() => connect("facebook")}
      />
    </div>
  );
}
