import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shown while the session check retries a sleeping/booting backend, so a cold
 * start reads as "starting up" instead of a failed session.
 */
export function ServerWaking({ fullPage = false }: { fullPage?: boolean }) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center px-4 py-10",
        fullPage ? "min-h-dvh" : "min-h-60",
      )}
    >
      <output
        aria-live="polite"
        className="block w-full max-w-sm rounded-lg bg-card p-6 text-center shadow-card"
      >
        <Loader2
          aria-hidden="true"
          className="mx-auto mb-4 size-8 animate-spin text-muted-foreground motion-reduce:animate-none"
        />
        <p className="text-xl font-semibold tracking-[-0.04em]">
          Waking up the server
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This can take up to a minute after a period of inactivity. Keep this
          page open.
        </p>
      </output>
    </div>
  );
}
