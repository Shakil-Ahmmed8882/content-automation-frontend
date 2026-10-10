"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import * as auth from "@/api/auth.api";
import { ApiError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import { clearSessionCache, sessionQueryKey } from "@/lib/session-cache";
import { createWakeRetry } from "@/lib/wake-retry";
import { loginUrl, routes } from "@/routes";

export { sessionQueryKey };

// Shared by every useSession observer (TanStack runs one fetch for all of them).
const sessionWake = createWakeRetry();

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: async ({ signal }) => {
      try {
        const user = await auth.me(signal);
        sessionWake.reset();
        return user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          sessionWake.reset();
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60_000,
    // Only transient failures (sleeping/booting backend) are retried; a 401
    // already resolved to guest above and 403/500 surface as errors.
    retry: sessionWake.retry,
    retryDelay: sessionWake.retryDelay,
    refetchOnWindowFocus: true,
  });
}

export function useRegister() {
  return useMutation({ mutationFn: auth.register });
}

export function useVerifyEmail() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: auth.verifyEmail,
    onSuccess: (user) => client.setQueryData(sessionQueryKey, user),
  });
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: auth.login,
    onSuccess: (user) => client.setQueryData(sessionQueryKey, user),
  });
}

export function useLogout() {
  const client = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: auth.logout,
    onMutate: () => client.cancelQueries(),
    onSuccess: async () => {
      await client.cancelQueries();
      clearSessionCache(client);
      toast.success("Logged out");
      router.replace(routes.home);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.userMessage : "Couldn't log out.",
      );
    },
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: auth.forgotPassword });
}

export function useResetPassword() {
  return useMutation({ mutationFn: auth.resetPassword });
}

export function useAuthRedirect(
  mode: "guest" | "protected",
  returnTo = routes.dashboard as string,
) {
  const session = useSession();
  const router = useRouter();
  const hadSession = useRef(false);
  useEffect(() => {
    if (session.isPending || session.isError) return;
    if (session.data) hadSession.current = true;
    if (mode === "guest" && session.data) router.replace(returnTo);
    if (mode === "protected" && session.data === null && !hadSession.current)
      router.replace(loginUrl(returnTo));
  }, [
    mode,
    returnTo,
    router,
    session.data,
    session.isError,
    session.isPending,
  ]);
  return session;
}

export function useAuthCooldown() {
  const until = useSyncExternalStore(
    rateLimit.subscribe,
    rateLimit.getSnapshot,
    rateLimit.getServerSnapshot,
  );
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    setNow(Date.now());
    return () => clearInterval(timer);
  }, [until]);
  return Math.max(0, Math.ceil((until - (now || Date.now())) / 1000));
}
