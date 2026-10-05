"use client";

import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createPayment,
  getPayment,
  getPayments,
  verifyPayment,
} from "@/api/payment.api";
import {
  claimWelcomeToast,
  clearPendingPaymentId,
  isNotFound,
  paymentErrorMessage,
  readPendingPaymentId,
} from "@/components/modules/payment/payment.utils";
import { sessionQueryKey } from "@/lib/session-cache";
import { routes } from "@/routes";
import type { Payment, PaymentListParams } from "@/types/payment.type";
import { useAuthCooldown } from "./auth.hook";
import { profileQueryKey } from "./user.hook";

export const paymentsQueryKey = ["payments"] as const;
export const paymentQueryKey = (id: string) => ["payment", id] as const;

const RECENT_WINDOW_MS = 30 * 60_000;
const AUTO_RETRIES = 2;
const AUTO_RETRY_DELAY_MS = 2000;

export function useCreatePayment() {
  return useMutation({ mutationFn: createPayment });
}

export function useVerifyPayment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: verifyPayment,
    onSuccess: (payment) =>
      client.setQueryData(paymentQueryKey(payment.id), payment),
  });
}

export function usePayment(id: string) {
  const cooldown = useAuthCooldown();
  return useQuery({
    queryKey: paymentQueryKey(id),
    queryFn: ({ signal }) => getPayment(id, signal),
    enabled: cooldown === 0 && id.trim().length > 0,
    retry: false,
  });
}

export function usePaymentHistory(params: PaymentListParams) {
  const cooldown = useAuthCooldown();
  return useQuery({
    queryKey: [...paymentsQueryKey, params],
    queryFn: ({ signal }) => getPayments(params, signal),
    enabled: cooldown === 0,
  });
}

export type PaymentReturnState =
  | { phase: "loading" }
  | { phase: "unknown" }
  | { phase: "error"; message: string }
  | { phase: "result"; payment: Payment };

const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

async function resolvePaymentId(client: QueryClient) {
  const stored = readPendingPaymentId();
  if (stored) return stored;
  const params = { page: 1, limit: 1 };
  const page = await client.fetchQuery({
    queryKey: [...paymentsQueryKey, params],
    queryFn: ({ signal }) => getPayments(params, signal),
    staleTime: 0,
  });
  const newest = page.data[0];
  if (!newest) return null;
  const age = Date.now() - Date.parse(newest.createdAt);
  return age <= RECENT_WINDOW_MS ? newest.id : null;
}

/**
 * Return-page resolution. The gateway redirect carries no params, so the
 * payment is resolved from the stored id (or the newest recent payment) and the
 * real status always comes from the backend. `verify` is only ever called from
 * the success page, and only while the payment is still PENDING.
 */
export function usePaymentReturn(mode: "success" | "failure") {
  const client = useQueryClient();
  const router = useRouter();
  const [state, setState] = useState<PaymentReturnState>({ phase: "loading" });
  const runId = useRef(0);

  const run = useCallback(
    async (auto: boolean) => {
      const current = ++runId.current;
      const stale = () => runId.current !== current;
      setState({ phase: "loading" });
      try {
        const id = await resolvePaymentId(client);
        if (stale()) return;
        if (!id) {
          setState({ phase: "unknown" });
          return;
        }
        let payment = await client.fetchQuery({
          queryKey: paymentQueryKey(id),
          queryFn: ({ signal }) => getPayment(id, signal),
          staleTime: 0,
        });
        if (mode === "success" && payment.status === "PENDING") {
          payment = await verifyPayment(id);
          for (
            let attempt = 0;
            auto && attempt < AUTO_RETRIES && payment.status === "PENDING";
            attempt++
          ) {
            await wait(AUTO_RETRY_DELAY_MS);
            if (stale()) return;
            payment = await getPayment(id);
          }
        }
        if (stale()) return;
        client.setQueryData(paymentQueryKey(id), payment);

        if (payment.status === "SUCCESS") {
          if (mode === "failure") {
            router.replace(routes.paymentSuccess);
            return;
          }
          clearPendingPaymentId();
          void client.invalidateQueries({ queryKey: sessionQueryKey });
          void client.invalidateQueries({ queryKey: profileQueryKey });
          void client.invalidateQueries({ queryKey: paymentsQueryKey });
          if (claimWelcomeToast(payment.id)) {
            toast.success("Payment successful. Welcome to Premium.");
          }
        } else if (payment.status !== "PENDING") {
          clearPendingPaymentId();
          void client.invalidateQueries({ queryKey: paymentsQueryKey });
        }
        setState({ phase: "result", payment });
      } catch (error) {
        if (stale()) return;
        if (isNotFound(error)) {
          clearPendingPaymentId();
          setState({ phase: "unknown" });
          return;
        }
        setState({ phase: "error", message: paymentErrorMessage(error) });
      }
    },
    [client, mode, router],
  );

  useEffect(() => {
    void run(true);
    return () => {
      runId.current++;
    };
  }, [run]);

  const recheck = useCallback(() => void run(false), [run]);
  return { state, recheck };
}
