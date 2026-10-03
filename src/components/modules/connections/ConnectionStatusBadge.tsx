import { AlertTriangle, CheckCircle2, Clock3, Link2Off } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConnectionCardStatus =
  | "CONNECTED"
  | "EXPIRED"
  | "NOT_CONNECTED"
  | "COMING_SOON";

const statusCopy = {
  CONNECTED: "Connected",
  EXPIRED: "Connection expired",
  NOT_CONNECTED: "Not connected",
  COMING_SOON: "Coming soon",
} satisfies Record<ConnectionCardStatus, string>;

export function ConnectionStatusBadge({
  status,
}: {
  status: ConnectionCardStatus;
}) {
  const Icon =
    status === "CONNECTED"
      ? CheckCircle2
      : status === "EXPIRED"
        ? AlertTriangle
        : status === "COMING_SOON"
          ? Clock3
          : Link2Off;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-medium",
        status === "CONNECTED" &&
          "border-success/30 bg-success/10 text-success",
        status === "EXPIRED" && "border-warning/30 bg-warning/10 text-warning",
        status === "NOT_CONNECTED" &&
          "border-border bg-muted text-muted-foreground",
        status === "COMING_SOON" &&
          "border-border bg-muted text-muted-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {statusCopy[status]}
    </span>
  );
}
