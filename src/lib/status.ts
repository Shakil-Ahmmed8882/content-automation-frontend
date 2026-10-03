import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import type {
  ExecutionStatus,
  PublicationStatus,
} from "@/types/execution.type";

export const executionStatus: Record<
  ExecutionStatus,
  { label: string; tone: string; icon: LucideIcon }
> = {
  PENDING: {
    label: "Queued",
    tone: "bg-muted text-muted-foreground",
    icon: Clock3,
  },
  RUNNING: {
    label: "Publishing",
    tone: "bg-link-bg-soft text-link",
    icon: Loader2,
  },
  COMPLETED: {
    label: "Published",
    tone: "bg-success/10 text-success",
    icon: CheckCircle2,
  },
  PARTIALLY_COMPLETED: {
    label: "Partial",
    tone: "bg-warning/10 text-warning",
    icon: AlertCircle,
  },
  FAILED: {
    label: "Failed",
    tone: "bg-destructive/10 text-destructive",
    icon: AlertCircle,
  },
};

export const publicationStatus: Record<
  PublicationStatus,
  { label: string; tone: string; icon: LucideIcon }
> = {
  PENDING: executionStatus.PENDING,
  RUNNING: executionStatus.RUNNING,
  SUCCESS: executionStatus.COMPLETED,
  FAILED: executionStatus.FAILED,
};

export function isActiveExecution(status: ExecutionStatus) {
  return status === "PENDING" || status === "RUNNING";
}

export function isTerminalExecution(status: ExecutionStatus) {
  return !isActiveExecution(status);
}

export function isActivePublication(status: PublicationStatus) {
  return status === "PENDING" || status === "RUNNING";
}
