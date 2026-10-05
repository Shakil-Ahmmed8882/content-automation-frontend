"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import DashboardLoading from "@/components/modules/shared/DashboardLoading";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/auth.hook";
import { toApiError } from "@/lib/api-error";
import { loginUrl, routes } from "@/routes";
import { AdminErrorState } from "./AdminShared";
import { AdminTabs } from "./AdminTabs";

function AdminForbidden() {
  return (
    <section className="mx-auto w-full max-w-lg space-y-4 py-16">
      <h1 className="text-display-md tracking-[-0.04em]">
        You don&apos;t have access to this page.
      </h1>
      <p className="text-sm text-muted-foreground">
        This area is for administrators.
      </p>
      <Button asChild>
        <Link href={routes.dashboard}>Back to dashboard</Link>
      </Button>
    </section>
  );
}

/**
 * UX gate only. The backend `auth("ADMIN","SUPER_ADMIN")` check is authoritative;
 * children (and so every admin request) mount only for admin sessions.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const user = session.data;

  useEffect(() => {
    if (session.isSuccess && !user) router.replace(loginUrl(pathname));
  }, [session.isSuccess, user, router, pathname]);

  if (session.isError) {
    return (
      <AdminErrorState
        message={toApiError(session.error).userMessage}
        onRetry={() => void session.refetch()}
        retrying={session.isFetching}
      />
    );
  }
  if (session.isPending || !user) return <DashboardLoading />;
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")
    return <AdminForbidden />;

  return (
    <div className="space-y-6">
      <AdminTabs />
      {children}
    </div>
  );
}
