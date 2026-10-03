import { AlertCircle, Info } from "lucide-react";
import type { ReactNode } from "react";

export function PostNotice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "error" | "info";
}) {
  const Icon = tone === "error" ? AlertCircle : Info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-sm border p-3 text-sm leading-5 ${
        tone === "error"
          ? "border-destructive/30 bg-destructive/5"
          : "border-border bg-muted"
      }`}
    >
      <Icon
        aria-hidden="true"
        className={`mt-0.5 size-4 shrink-0 ${
          tone === "error" ? "text-destructive" : "text-muted-foreground"
        }`}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
