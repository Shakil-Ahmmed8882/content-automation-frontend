import { Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { routes } from "@/routes";

export function UpgradeGate() {
  return (
    <section className="rounded-lg border border-border bg-card p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-warning/10 text-warning">
        <Crown aria-hidden="true" className="size-5" />
      </div>
      <h2 className="text-lg font-semibold tracking-[-0.02em]">
        This area is for premium members
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Upgrade to Premium to preview the features we are planning next.
      </p>
      <Button asChild className="mt-5">
        <Link href={routes.payment}>Upgrade to Premium</Link>
      </Button>
    </section>
  );
}
