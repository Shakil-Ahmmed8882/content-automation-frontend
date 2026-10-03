"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CustomErrorBoundary } from "@/components/reusable-ui-blocks/layouts/wrapper/error/CustomErrorBoundary";
import { Button } from "@/components/ui/button";
import { routes } from "@/routes";

export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Route rendering failed", error);
  }, [error]);
  return (
    <CustomErrorBoundary
      isError
      fallback={
        <section className="mx-auto w-full max-w-lg space-y-4 px-4 py-16">
          <h1 className="text-display-md">Something went wrong.</h1>
          <p role="alert" className="text-sm text-muted-foreground">
            We couldn't load this page. Try again, or return home.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={retry}>Try again</Button>
            <Button asChild variant="outline">
              <Link href={routes.home}>Home</Link>
            </Button>
          </div>
        </section>
      }
    >
      {null}
    </CustomErrorBoundary>
  );
}
