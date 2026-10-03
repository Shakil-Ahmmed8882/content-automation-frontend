import { cn } from "@/lib/utils";
import { BaseSkeleton } from "./BaseSkeleton";

// ============================================
// PARAGRAPH SKELETON (Multiple Lines)
// ============================================
export function ParagraphSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <BaseSkeleton
          key={i}
          className={cn(" h-3 md:h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
