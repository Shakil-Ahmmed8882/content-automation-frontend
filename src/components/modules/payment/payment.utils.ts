import {
  Ban,
  CheckCircle2,
  Clock3,
  type LucideIcon,
  XCircle,
} from "lucide-react";
import { toApiError } from "@/lib/api-error";
import type { Payment, PaymentStatus } from "@/types/payment.type";

const PENDING_ID_KEY = "ca.pendingPaymentId";
const TOAST_KEY = "ca.paymentWelcomeToast";

export const paymentStatusMeta: Record<
  PaymentStatus,
  { label: string; tone: string; icon: LucideIcon }
> = {
  PENDING: {
    label: "Confirming",
    tone: "bg-warning/10 text-warning",
    icon: Clock3,
  },
  SUCCESS: {
    label: "Success",
    tone: "bg-success/10 text-success",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "Failed",
    tone: "bg-destructive/10 text-destructive",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "bg-muted text-muted-foreground",
    icon: Ban,
  },
};

function withStorage<T>(action: (storage: Storage) => T, fallback: T): T {
  try {
    return action(window.sessionStorage);
  } catch {
    return fallback;
  }
}

export function storePendingPaymentId(id: string) {
  withStorage((s) => s.setItem(PENDING_ID_KEY, id), undefined);
}

export function readPendingPaymentId() {
  return withStorage((s) => s.getItem(PENDING_ID_KEY), null);
}

export function clearPendingPaymentId() {
  withStorage((s) => s.removeItem(PENDING_ID_KEY), undefined);
}

/** True only the first time a given payment's welcome toast is claimed. */
export function claimWelcomeToast(paymentId: string) {
  return withStorage((s) => {
    if (s.getItem(TOAST_KEY) === paymentId) return false;
    s.setItem(TOAST_KEY, paymentId);
    return true;
  }, true);
}

export function isSecureRedirect(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function formatMoney(payment: Pick<Payment, "amount" | "currency">) {
  const amount = Number(payment.amount);
  if (!Number.isFinite(amount)) return `${payment.amount} ${payment.currency}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: payment.currency,
    }).format(amount);
  } catch {
    return `${payment.amount} ${payment.currency}`;
  }
}

export function formatPaymentDate(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatPurpose(purpose: string) {
  return purpose === "PREMIUM_UPGRADE" ? "Premium upgrade" : purpose;
}

export function formatProvider(provider: string) {
  return provider === "BKASH" ? "bKash" : provider;
}

export function paymentErrorMessage(error: unknown) {
  return toApiError(error).userMessage;
}

export function isNotFound(error: unknown) {
  return toApiError(error).status === 404;
}
