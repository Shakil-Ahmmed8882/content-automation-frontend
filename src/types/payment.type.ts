import type { PageMeta } from "@/types/execution.type";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
];

export interface Payment {
  id: string;
  provider: string;
  purpose: string;
  /** Prisma Decimal: serialised as a string, accepted as a number too. */
  amount: string | number;
  currency: string;
  status: PaymentStatus;
  merchantInvoiceNumber: string;
  providerTransactionId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  redirectUrl: string;
}

export interface PaymentListParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
}

export interface PaymentsPage {
  data: Payment[];
  meta: PageMeta;
}
