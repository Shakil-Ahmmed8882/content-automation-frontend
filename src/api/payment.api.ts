import apiClient from "@/lib/apiClient";
import type {
  CreatePaymentResult,
  Payment,
  PaymentListParams,
  PaymentsPage,
} from "@/types/payment.type";
import { verifyPaymentSchema } from "@/validation/payment.validation";

export async function createPayment() {
  return (
    await apiClient<CreatePaymentResult>("/payments/create", {
      method: "POST",
    })
  ).data;
}

export async function verifyPayment(paymentId: string) {
  const body = verifyPaymentSchema.parse({ paymentId });
  return (
    await apiClient<Payment>("/payments/verify", { method: "POST", body })
  ).data;
}

export async function getPayment(id: string, signal?: AbortSignal) {
  return (await apiClient<Payment>(`/payments/${id}`, { signal })).data;
}

export async function getPayments(
  params: PaymentListParams = {},
  signal?: AbortSignal,
): Promise<PaymentsPage> {
  const result = await apiClient<Payment[]>("/payments", {
    query: params,
    signal,
  });
  return {
    data: result.data,
    meta: result.meta ?? {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      total: result.data.length,
      totalPages: 1,
    },
  };
}
