import Link from "next/link";
import { Button } from "@/components/ui/button";
import { routes } from "@/routes";

export function ModulePending({ title }: { title: string }) {
  return (
    <section className="rounded-lg bg-card p-6 shadow-card">
      <p className="eyebrow mb-3">Next implementation slice</p>
      <h1 className="text-display-lg">{title}</h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">
        This module is not available yet. Authentication and the dashboard
        overview are implemented; each remaining API module will be added and
        verified separately.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href={routes.dashboard}>Back to dashboard</Link>
      </Button>
    </section>
  );
}
