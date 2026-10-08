"use client";

import { Check, Crown } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreatePayment } from "@/hooks/payment.hook";
import { useProfile } from "@/hooks/user.hook";
import { routes } from "@/routes";
import { PaymentCardSkeleton, PaymentErrorState } from "./PaymentStateBlocks";
import {
  formatPaymentDate,
  isSecureRedirect,
  paymentErrorMessage,
  storePendingPaymentId,
} from "./payment.utils";

const BENEFITS = [
  "Early access to upcoming features",
  "Premium badge on your profile",
  "Priority on the roadmap",
] as const;

export function UpgradePage() {
  const profile = useProfile();
  const create = useCreatePayment();
  const [redirecting, setRedirecting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const submitting = useRef(false);

  function startPayment() {
    if (submitting.current) return;
    submitting.current = true;
    setStartError(null);
    create.mutate(undefined, {
      onSuccess: (result) => {
        if (!isSecureRedirect(result.redirectUrl)) {
          submitting.current = false;
          setStartError("We couldn't start the payment. Please try again.");
          return;
        }
        storePendingPaymentId(result.paymentId);
        setRedirecting(true);
        window.location.assign(result.redirectUrl);
      },
      onError: (error) => {
        submitting.current = false;
        setStartError(paymentErrorMessage(error));
      },
    });
  }

  if (profile.isPending) return <PaymentCardSkeleton label="Loading" />;
  if (profile.isError) {
    return (
      <PaymentErrorState
        title="Couldn't load your account"
        message={paymentErrorMessage(profile.error)}
        retry={() => void profile.refetch()}
      />
    );
  }

  const busy = create.isPending || redirecting;

  return (
    <section className="space-y-6" aria-labelledby="upgrade-title">
      <h1 id="upgrade-title" className="text-display-lg tracking-[-0.04em]">
        Go Premium
      </h1>
      <div className="mx-auto w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 text-warning">
          <Crown className="size-5" aria-hidden="true" />
          <span className="eyebrow">Premium</span>
        </div>

        {profile.data.isPremium ? (
          <div className="mt-4 space-y-4">
            <h2 className="text-display-sm tracking-[-0.04em]">
              You&apos;re Premium
            </h2>
            <p className="text-sm text-muted-foreground">
              Premium since {formatPaymentDate(profile.data.premiumSince)}.
            </p>
            <Button asChild className="w-full">
              <Link href={routes.upcomingFeatures}>See upcoming features</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            <ul className="space-y-2.5">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  {benefit}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              One-time payment with bKash. You&apos;ll see the amount on bKash
              before you confirm.
            </p>
            {startError ? (
              <p
                role="alert"
                className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive"
              >
                {startError}
              </p>
            ) : null}
            <Button
              type="button"
              className="w-full"
              disabled={busy}
              aria-busy={busy}
              onClick={startPayment}
            >
              {busy
                ? "Redirecting to bKash..."
                : startError
                  ? "Try again"
                  : "Upgrade to Premium"}
            </Button>
          </div>
        )}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        <Link href={routes.paymentHistory} className="text-link">
          Payment history
        </Link>
      </p>
    </section>
  );
}
