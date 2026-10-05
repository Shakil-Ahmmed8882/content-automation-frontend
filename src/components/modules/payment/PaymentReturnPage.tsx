"use client";

import { Ban, Crown, Loader2, SearchX, XCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { usePaymentReturn } from "@/hooks/payment.hook";
import { routes } from "@/routes";
import type { Payment } from "@/types/payment.type";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { formatMoney } from "./payment.utils";

function ResultShell({
  icon,
  title,
  children,
  actions,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section
      className="mx-auto w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-card"
      aria-live="polite"
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <h1 className="mt-4 text-display-sm tracking-[-0.04em]">{title}</h1>
      {children ? (
        <div className="mt-2 text-sm text-muted-foreground">{children}</div>
      ) : null}
      {actions ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {actions}
        </div>
      ) : null}
    </section>
  );
}

function PaymentSummary({ payment }: { payment: Payment }) {
  return (
    <dl className="mt-4 space-y-1 rounded-sm bg-canvas-soft p-3 text-left text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Amount</dt>
        <dd>{formatMoney(payment)}</dd>
      </div>
      {payment.providerTransactionId ? (
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Transaction</dt>
          <dd className="truncate font-mono text-xs">
            {payment.providerTransactionId}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

const tryAgain = (
  <>
    <Button asChild>
      <Link href={routes.payment}>Try again</Link>
    </Button>
    <Button asChild variant="outline">
      <Link href={routes.paymentHistory}>View history</Link>
    </Button>
  </>
);

function PaymentResult({
  payment,
  recheck,
}: {
  payment: Payment;
  recheck: () => void;
}) {
  if (payment.status === "SUCCESS") {
    return (
      <ResultShell
        icon={<Crown className="size-6 text-warning" aria-hidden="true" />}
        title="Payment successful. Welcome to Premium."
        actions={
          <>
            <Button asChild>
              <Link href={routes.upcomingFeatures}>
                Explore upcoming features
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={routes.paymentHistoryDetail(payment.id)}>
                View receipt
              </Link>
            </Button>
          </>
        }
      >
        <PaymentSummary payment={payment} />
      </ResultShell>
    );
  }
  if (payment.status === "CANCELLED") {
    return (
      <ResultShell
        icon={<Ban className="size-6 text-muted-foreground" aria-hidden="true" />}
        title="Payment cancelled"
        actions={tryAgain}
      >
        You cancelled the payment. You haven&apos;t been charged.
      </ResultShell>
    );
  }
  if (payment.status === "FAILED") {
    return (
      <ResultShell
        icon={<XCircle className="size-6 text-destructive" aria-hidden="true" />}
        title="Payment failed"
        actions={tryAgain}
      >
        We couldn&apos;t complete your payment. Please try again. Your payment
        history shows the latest status.
      </ResultShell>
    );
  }
  return (
    <ResultShell
      icon={<Loader2 className="size-6 text-warning" aria-hidden="true" />}
      title="Still processing"
      actions={
        <>
          <Button type="button" onClick={recheck}>
            Check again
          </Button>
          <Button asChild variant="outline">
            <Link href={routes.paymentHistory}>View history</Link>
          </Button>
        </>
      }
    >
      <PaymentStatusBadge status="PENDING" />
      <p className="mt-3">
        Your payment hasn&apos;t been confirmed yet. This can take a moment.
      </p>
    </ResultShell>
  );
}

export function PaymentReturnPage({ mode }: { mode: "success" | "failure" }) {
  const { state, recheck } = usePaymentReturn(mode);

  if (state.phase === "loading") {
    return (
      <ResultShell
        icon={
          <Loader2
            className="size-6 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        }
        title={
          mode === "success"
            ? "Confirming your payment..."
            : "Checking your payment..."
        }
      >
        Please wait, this only takes a moment.
      </ResultShell>
    );
  }
  if (state.phase === "unknown") {
    return (
      <ResultShell
        icon={<SearchX className="size-6 text-muted-foreground" aria-hidden="true" />}
        title="We couldn't find a recent payment."
        actions={
          <Button asChild>
            <Link href={routes.payment}>Go to Premium page</Link>
          </Button>
        }
      >
        Nothing to confirm right now. Your payment history lists every payment.
      </ResultShell>
    );
  }
  if (state.phase === "error") {
    return (
      <ResultShell
        icon={<XCircle className="size-6 text-destructive" aria-hidden="true" />}
        title="We couldn't confirm your payment yet."
        actions={
          <>
            <Button type="button" onClick={recheck}>
              Check again
            </Button>
            <Button asChild variant="outline">
              <Link href={routes.paymentHistory}>View history</Link>
            </Button>
          </>
        }
      >
        {state.message} If you were charged, it will appear in your history
        shortly.
      </ResultShell>
    );
  }
  return <PaymentResult payment={state.payment} recheck={recheck} />;
}
