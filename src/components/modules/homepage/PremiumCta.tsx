import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const perks = [
  "Early access to upcoming features",
  "Premium badge on your profile",
  "Priority on the roadmap",
] as const;

export default function PremiumCta() {
  return (
    <section id="premium" className="scroll-mt-16 border-t border-border">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow">Premium</p>
          <h2 className="mt-3 text-3xl tracking-[-0.04em] sm:text-display-lg">
            Get a look at what&apos;s next.
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Upgrade once and see the roadmap before everyone else — and help
            decide what ships first.
          </p>
        </div>

        <div className="rounded-lg bg-card p-8 shadow-float">
          <ul className="space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-sm">
                <Check className="size-4 text-success" />
                {perk}
              </li>
            ))}
          </ul>
          <Button asChild size="pill" className="mt-8 w-full">
            <Link href="/register">Create your account</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
