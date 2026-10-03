import { executionStatus, publicationStatus } from "@/lib/status";
import { cn } from "@/lib/utils";
import type {
  ExecutionStatus,
  PublicationStatus,
} from "@/types/execution.type";

type BadgeProps = {
  className?: string;
};

export function ExecutionStatusBadge({
  status,
  className,
}: BadgeProps & { status: ExecutionStatus }) {
  const state = executionStatus[status];
  const Icon = state.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium",
        state.tone,
        className,
      )}
    >
      <Icon
        className={cn("size-3.5", status === "RUNNING" && "animate-spin")}
        aria-hidden="true"
      />
      {state.label}
    </span>
  );
}

export function PublicationStatusBadge({
  status,
  className,
}: BadgeProps & { status: PublicationStatus }) {
  const state = publicationStatus[status];
  const Icon = state.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium",
        state.tone,
        className,
      )}
    >
      <Icon
        className={cn("size-3.5", status === "RUNNING" && "animate-spin")}
        aria-hidden="true"
      />
      {state.label}
    </span>
  );
}
