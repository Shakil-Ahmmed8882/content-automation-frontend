"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useConnectionCallback } from "@/hooks/connection.hook";
import { toApiError } from "@/lib/api-error";
import { routes } from "@/routes";
import { apiMessage, isPlatformKey } from "./connection-ui.helpers";

function callbackErrorCode(error: unknown) {
  const normalized = toApiError(error);
  if (normalized.status === 400) return "invalid-state";
  return "failed";
}

export function OAuthCallbackHandler({ platform }: { platform: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = useConnectionCallback();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const providerError = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!isPlatformKey(platform)) {
      toast.error("Unknown platform.");
      router.replace(`${routes.connections}?error=failed`);
      return;
    }

    if (providerError) {
      toast.error("Connection cancelled.");
      router.replace(`${routes.connections}?error=cancelled`);
      return;
    }

    if (!code && !state) {
      router.replace(routes.connections);
      return;
    }

    if (!code || !state) {
      toast.error("Missing authorization code.");
      router.replace(`${routes.connections}?error=invalid-state`);
      return;
    }

    callback.mutate(
      { platform, code, state },
      {
        onSuccess: (result) => {
          if (result.kind === "connected") {
            toast.success(`${result.connection.platform.name} connected.`);
            router.replace(routes.connections);
            return;
          }
          toast.success("Choose a Facebook Page to finish connecting.");
          router.replace(`${routes.connections}?select=facebook`);
        },
        onError: (error) => {
          toast.error(apiMessage(error));
          router.replace(
            `${routes.connections}?error=${callbackErrorCode(error)}`,
          );
        },
      },
    );
  }, [callback, platform, router, searchParams]);

  return (
    <div className="mx-auto flex min-h-96 w-full max-w-xl items-center justify-center px-4">
      <output
        aria-live="polite"
        className="block rounded-lg bg-card p-6 text-center shadow-card"
      >
        <Loader2
          aria-hidden="true"
          className="mx-auto mb-4 size-8 animate-spin text-muted-foreground"
        />
        <h1 className="text-2xl font-semibold tracking-[-0.04em]">
          Finishing connection...
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep this page open while we confirm the provider response.
        </p>
      </output>
    </div>
  );
}
