"use client";

import Link from "next/link";
import { UserMenu } from "@/components/layout/dashboard/UserMenu";
import { BaseSkeleton } from "@/components/reusable-ui-blocks/placeholder/skeletons/BaseSkeleton";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/auth.hook";
import { useHydrated } from "@/hooks/hydrated.hook";
import { routes } from "@/routes";

export function SessionNav({ onNavigate }: { onNavigate?: () => void }) {
  const session = useSession();
  const hydrated = useHydrated();
  if (!hydrated || session.isPending)
    return (
      <BaseSkeleton
        role="status"
        aria-label="Checking session"
        className="h-10 w-40"
      />
    );
  if (session.isError)
    return (
      <Button
        variant="outline"
        onClick={() => void session.refetch()}
        disabled={session.isFetching}
      >
        Retry session
      </Button>
    );
  if (session.data)
    return (
      <div className="flex items-center gap-3">
        <Button asChild size="pill">
          <Link href={routes.dashboard} onClick={onNavigate}>
            Dashboard
          </Link>
        </Button>
        <UserMenu user={session.data} />
      </div>
    );
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="pill">
        <Link href={routes.login} onClick={onNavigate}>
          Log in
        </Link>
      </Button>
      <Button asChild size="pill">
        <Link href={routes.register} onClick={onNavigate}>
          Get started
        </Link>
      </Button>
    </div>
  );
}
