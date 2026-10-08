"use client";

import { Copy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePayment } from "@/hooks/payment.hook";
import { routes } from "@/routes";
import { PaymentCardSkeleton, PaymentErrorState } from "./PaymentStateBlocks";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import {
  formatMoney,
  formatPaymentDate,
  formatProvider,
  formatPurpose,
  isNotFound,
  paymentErrorMessage,
} from "./payment.utils";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-all text-sm">{children}</dd>
    </div>
  );
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied.");
  } catch {
    toast.error("Couldn't copy to the clipboard.");
  }
}

const backAction = (
  <Button asChild variant="outline">
    <Link href={routes.paymentHistory}>Back to history</Link>
  </Button>
);

export function PaymentDetailPage({ paymentId }: { paymentId: string }) {
  const query = usePayment(paymentId);

  if (query.isPending) return <PaymentCardSkeleton label="Loading payment" />;
  if (query.isError) {
    if (isNotFound(query.error)) {
      return (
        <PaymentErrorState
          title="Payment not found"
          message="This payment is unavailable or you do not have access to it."
          action={backAction}
        />
      );
    }
    return (
      <PaymentErrorState
        title="Couldn't load this payment"
        message={paymentErrorMessage(query.error)}
        retry={() => void query.refetch()}
        action={backAction}
      />
    );
  }

  const payment = query.data;
  return (
    <section className="space-y-6" aria-labelledby="payment-detail-title">
      <div className="mx-auto w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1
            id="payment-detail-title"
            className="text-display-md tracking-[-0.04em]"
          >
            {formatMoney(payment)}
          </h1>
          <PaymentStatusBadge status={payment.status} />
        </div>
        <dl className="mt-4 divide-y divide-border">
          <Row label="Provider">{formatProvider(payment.provider)}</Row>
          <Row label="Purpose">{formatPurpose(payment.purpose)}</Row>
          <Row label="Invoice number">
            <span className="font-mono text-xs">
              {payment.merchantInvoiceNumber}
            </span>
          </Row>
          <Row label="Transaction ID">
            {payment.providerTransactionId ? (
              <span className="inline-flex items-center gap-2">
                <span className="font-mono text-xs">
                  {payment.providerTransactionId}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Copy transaction ID"
                  onClick={() =>
                    void copyText(payment.providerTransactionId ?? "")
                  }
                >
                  <Copy aria-hidden="true" />
                </Button>
              </span>
            ) : (
              "Not available"
            )}
          </Row>
          <Row label="Created">{formatPaymentDate(payment.createdAt)}</Row>
          <Row label="Paid at">{formatPaymentDate(payment.paidAt)}</Row>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          {payment.status === "PENDING" ? (
            <Button
              type="button"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Check status
            </Button>
          ) : null}
          {backAction}
        </div>
      </div>
    </section>
  );
}
