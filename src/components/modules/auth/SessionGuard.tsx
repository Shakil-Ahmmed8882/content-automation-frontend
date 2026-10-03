"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import DashboardLoading from "@/components/modules/shared/DashboardLoading";
import { Button } from "@/components/ui/button";
import { useAuthRedirect } from "@/hooks/auth.hook";
import { useHydrated } from "@/hooks/hydrated.hook";
import { toApiError } from "@/lib/api-error";
import { safeNext } from "@/routes";
import { AuthAlert } from "./AuthAlert";
import AuthLoading from "./AuthLoading";

function SessionGuard({
  mode,
  children,
}: {
  mode: "guest" | "protected";
  children: ReactNode;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const session = useAuthRedirect(
    mode,
    mode === "guest"
      ? safeNext(params.get("next"))
      : `${pathname}${query ? `?${query}` : ""}`,
  );
  const hydrated = useHydrated();
  if (!hydrated)
    return mode === "protected" ? <DashboardLoading /> : <AuthLoading />;
  if (session.isError) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <AuthAlert>{toApiError(session.error).userMessage}</AuthAlert>
        <Button
          onClick={() => void session.refetch()}
          disabled={session.isFetching}
          className="w-full"
        >
          {session.isFetching ? "Checking..." : "Try again"}
        </Button>
      </div>
    );
  }
  if (
    session.isPending ||
    (mode === "guest" && session.data) ||
    (mode === "protected" && !session.data)
  )
    return mode === "protected" ? <DashboardLoading /> : <AuthLoading />;
  return children;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  return <SessionGuard mode="guest">{children}</SessionGuard>;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  return <SessionGuard mode="protected">{children}</SessionGuard>;
}
