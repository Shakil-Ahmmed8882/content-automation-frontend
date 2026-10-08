import { AlertCircle, Info } from "lucide-react";
import type { ReactNode } from "react";
import type { ApiError } from "@/lib/api-error";

export function AuthAlert({
  children,
  variant = "error",
}: {
  children: ReactNode;
  variant?: "error" | "info";
}) {
  const Icon = variant === "error" ? AlertCircle : Info;
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-sm border p-3 text-sm leading-5 ${
        variant === "error"
          ? "border-destructive/30 bg-destructive/5 text-foreground"
          : "border-border bg-muted text-foreground"
      }`}
    >
      <Icon
        aria-hidden="true"
        className={`mt-0.5 size-4 shrink-0 ${variant === "error" ? "text-destructive-text" : "text-muted-foreground"}`}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function AuthError({
  error,
  cooldown,
}: {
  error: ApiError | null;
  cooldown: number;
}) {
  if (!error && !cooldown) return null;
  return (
    <AuthAlert>
      <p>
        {cooldown
          ? "Too many attempts. Please try again later."
          : error?.userMessage}
      </p>
      {cooldown > 0 && (
        <p className="mt-1 text-muted-foreground" aria-live="polite">
          Try again in {cooldown}s.
        </p>
      )}
      {error?.status === 403 && /blocked/i.test(error.message) && (
        <p className="mt-1 text-muted-foreground">
          Contact support if you think this is a mistake.
        </p>
      )}
    </AuthAlert>
  );
}
