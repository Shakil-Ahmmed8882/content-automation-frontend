import type { ExecutionStatus } from "@/types/execution.type";

export const executionStatus: Record<
  ExecutionStatus,
  { label: string; tone: string }
> = {
  PENDING: { label: "Queued", tone: "bg-muted text-muted-foreground" },
  RUNNING: { label: "Publishing", tone: "bg-link-bg-soft text-link" },
  COMPLETED: { label: "Published", tone: "bg-success/10 text-success" },
  PARTIALLY_COMPLETED: { label: "Partial", tone: "bg-warning/10 text-warning" },
  FAILED: { label: "Failed", tone: "bg-destructive/10 text-destructive" },
};
