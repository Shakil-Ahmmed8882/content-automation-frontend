import { Crown } from "lucide-react";

export function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
      <Crown className="size-3.5" aria-hidden="true" />
      Premium
    </span>
  );
}
