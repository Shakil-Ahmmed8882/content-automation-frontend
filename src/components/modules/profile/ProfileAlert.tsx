import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ProfileAlert({
  children,
  variant = "error",
}: {
  children: ReactNode;
  variant?: "error" | "info" | "success";
}) {
  const Icon = variant === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-sm border p-3 text-sm leading-5",
        variant === "error" &&
          "border-destructive/30 bg-destructive/5 text-foreground",
        variant === "info" && "border-border bg-muted text-foreground",
        variant === "success" &&
          "border-success/30 bg-success/10 text-foreground",
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "mt-0.5 size-4 shrink-0",
          variant === "error" && "text-destructive",
          variant === "info" && "text-muted-foreground",
          variant === "success" && "text-success",
        )}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
