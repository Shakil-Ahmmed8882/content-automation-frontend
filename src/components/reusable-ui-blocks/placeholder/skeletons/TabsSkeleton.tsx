// ============================================
// TABS SKELETON

import { HorizontalScroller } from "../../../ui/HorizontalScroller";
import { BaseSkeleton } from "./BaseSkeleton";
import { ParagraphSkeleton } from "./ParagraphSkeleton";

// ============================================
export function TabsSkeleton({
  count = 4,
  paragraph = true,
  className = "",
}: {
  count?: number;
  paragraph?: boolean;
  className?: string;
}) {
  return (
    <HorizontalScroller>
      {/* <Frame className="space-y-4 w-full !py-0 !pb-2 !border-none rounded-lg"> */}
      <div className="flex items-center  gap-3  overflow-x-hidden ">
        {Array.from({ length: count }).map((_, i) => (
          <BaseSkeleton
            key={i}
            className={`${className}  h-8 md:h-10 w-32 rounded-t-md`}
          />
        ))}
      </div>

      {/* Tab Content */}
      {paragraph && <ParagraphSkeleton lines={3} />}
      {/* </Frame> */}
    </HorizontalScroller>
  );
}
