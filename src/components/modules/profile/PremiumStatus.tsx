import { Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { routes } from "@/routes";
import type { UserProfile } from "@/types/user.type";
import { formatDate } from "./profile.utils";

export function PremiumStatus({ profile }: { profile: UserProfile }) {
  if (profile.isPremium) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
          <Crown className="size-3.5" aria-hidden="true" />
          Premium
        </span>
        <span className="text-sm text-muted-foreground">
          Since {formatDate(profile.premiumSince)}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground">Free account</span>
      <Button asChild size="sm">
        <Link href={routes.payment}>
          <Crown aria-hidden="true" />
          Upgrade
        </Link>
      </Button>
    </div>
  );
}
