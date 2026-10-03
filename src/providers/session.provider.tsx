"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { sessionQueryKey } from "@/hooks/auth.hook";
import { clearSessionCache } from "@/lib/session-cache";
import { sessionEvents } from "@/lib/session-events";
import { loginUrl } from "@/routes";
import type { User } from "@/types/auth.type";

export default function SessionProvider() {
  const client = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    let hadSession = Boolean(client.getQueryData<User | null>(sessionQueryKey));
    let expiring = false;
    function expire() {
      if (expiring || !client.getQueryData<User | null>(sessionQueryKey))
        return;
      expiring = true;
      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      void client.cancelQueries().then(() => {
        clearSessionCache(client);
        toast.error("Your session expired. Please sign in again.");
        router.replace(loginUrl(returnTo, true));
      });
    }
    const unsubscribe = sessionEvents.subscribe(expire);
    const unsubscribeCache = client.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.query.queryKey[0] === "session" &&
        event.action.type === "success"
      ) {
        if (event.action.data !== null) {
          hadSession = true;
          expiring = false;
          return;
        }
        const expired = hadSession && event.action.manual !== true;
        hadSession = false;
        if (!expired) return;
        const path = window.location.pathname;
        if (
          ![
            "/",
            "/login",
            "/register",
            "/forgot-password",
            "/reset-password",
          ].includes(path)
        ) {
          toast.error("Your session expired. Please sign in again.");
          client.removeQueries({
            predicate: (query) => query.queryKey[0] !== "session",
          });
          router.replace(loginUrl(`${path}${window.location.search}`, true));
        }
      }
    });
    return () => {
      unsubscribe();
      unsubscribeCache();
    };
  }, [client, router]);
  return null;
}
