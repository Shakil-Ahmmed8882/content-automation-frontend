"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/auth.hook";
import { useHydrated } from "@/hooks/hydrated.hook";
import { routes } from "@/routes";

export default function RouteNotFound() {
  const session = useSession();
  const hydrated = useHydrated();
  const signedIn = hydrated && !!session.data;
  return (
    <section className="mx-auto w-full max-w-lg space-y-4 px-4 py-16">
      <p className="eyebrow">404</p>
      <h1 className="text-display-lg">Page not found.</h1>
      <p className="text-sm text-muted-foreground">
        This page doesn't exist, or the link is no longer available.
      </p>
      <Button asChild>
        <Link href={signedIn ? routes.dashboard : routes.home}>
          {signedIn ? "Back to dashboard" : "Back to home"}
        </Link>
      </Button>
    </section>
  );
}
