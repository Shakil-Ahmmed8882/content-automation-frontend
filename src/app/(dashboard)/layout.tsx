import { Suspense } from "react";
import { AppShell } from "@/components/layout/dashboard/AppShell";
import { AuthGuard } from "@/components/modules/auth/SessionGuard";
import DashboardLoading from "@/components/modules/shared/DashboardLoading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AuthGuard>
        <AppShell>{children}</AppShell>
      </AuthGuard>
    </Suspense>
  );
}
