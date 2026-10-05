import { CalendarClock, Hammer, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UpcomingFeatureStatus } from "@/types/upcoming-feature.type";

const statusMeta: Record<
  UpcomingFeatureStatus,
  { label: string; Icon: typeof Sparkles; className: string }
> = {
  COMING_SOON: {
    label: "Coming soon",
    Icon: Sparkles,
    className: "border-success/30 bg-success/10 text-success",
  },
  IN_DEVELOPMENT: {
    label: "In development",
    Icon: Hammer,
    className: "border-warning/30 bg-warning/10 text-warning",
  },
  PLANNED: {
    label: "Planned",
    Icon: CalendarClock,
    className: "border-border bg-muted text-muted-foreground",
  },
};

export function FeatureStatusBadge({ status }: { status: string }) {
  const { label, Icon, className } = statusMeta[
    status as UpcomingFeatureStatus
  ] ?? {
    label: status.replaceAll("_", " ").toLowerCase(),
    Icon: CalendarClock,
    className: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}
