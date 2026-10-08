// ============================================
// BASE SKELETON COMPONENT

import { cn } from "@/lib/utils";

// ============================================
export function BaseSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}
