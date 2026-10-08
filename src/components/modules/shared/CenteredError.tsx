import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one error panel for page-level failures: centered horizontally and
 * vertically in the space it is given, with the actions under the message.
 * `fullPage` is for places that render without the app shell (session
 * bootstrap, route error boundaries); otherwise it centers inside the page.
 */
export function CenteredError({
  title = "Something went wrong",
  message,
  children,
  fullPage = false,
  compact = false,
  className,
}: {
  title?: string;
  message: ReactNode;
  /** Actions, usually a retry button. */
  children?: ReactNode;
  fullPage?: boolean;
  /** For a failed section inside a longer page rather than the whole page. */
  compact?: boolean;
  className?: string;
}) {
  const Heading = fullPage ? "h1" : "h2";
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center px-4 py-10",
        fullPage ? "min-h-dvh" : compact ? "min-h-60" : "min-h-[50vh]",
        className,
      )}
    >
      <section
        role="alert"
        className="flex w-full max-w-md flex-col items-center gap-5 rounded-lg border border-border bg-card p-8 text-center shadow-card"
      >
        <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <Heading className="text-xl font-semibold tracking-[-0.04em]">
            {title}
          </Heading>
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
        {children ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {children}
          </div>
        ) : null}
      </section>
    </div>
  );
}
