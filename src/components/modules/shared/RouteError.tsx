"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CustomErrorBoundary } from "@/components/reusable-ui-blocks/layouts/wrapper/error/CustomErrorBoundary";
import { Button } from "@/components/ui/button";
import { routes } from "@/routes";
import { CenteredError } from "./CenteredError";

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
        <CenteredError
          fullPage
          message="We couldn't load this page. Try again, or return home."
        >
          <Button onClick={retry}>Try again</Button>
          <Button asChild variant="outline">
            <Link href={routes.home}>Home</Link>
          </Button>
        </CenteredError>
      }
    >
      {null}
    </CustomErrorBoundary>
  );
}
