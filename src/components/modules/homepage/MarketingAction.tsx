"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/auth.hook";
import { useHydrated } from "@/hooks/hydrated.hook";
import { routes } from "@/routes";

export function MarketingAction({
  premium = false,
  className,
}: {
  premium?: boolean;
  className?: string;
}) {
  const session = useSession();
  const hydrated = useHydrated();
  if (!hydrated || session.isPending)
    return (
      <Button size="pill" className={className} disabled>
        Checking session...
      </Button>
    );
  if (session.isError)
    return (
      <Button
        size="pill"
        className={className}
        onClick={() => void session.refetch()}
        disabled={session.isFetching}
      >
        Retry session
      </Button>
    );
  const href = !session.data
    ? routes.register
    : premium
      ? routes.payment
      : routes.dashboard;
  const label = !session.data
    ? premium
      ? "Create your account"
      : "Start publishing"
    : premium
      ? session.data.isPremium
        ? "View your membership"
        : "Explore Premium"
      : "Open dashboard";
  return (
    <Button asChild size="pill" className={className}>
      <Link href={href}>
        {label}
        <ArrowRight aria-hidden="true" />
      </Link>
    </Button>
  );
}
