/* eslint-disable @typescript-eslint/no-unused-vars */
import { cn } from "@/lib/utils";
import { BaseSkeleton } from "./BaseSkeleton";

// Comment Skeleton Component
export function CommentSkeleton({ isReply = false }: { isReply?: boolean }) {
  return (
    <div className={cn("flex gap-3", isReply && "ml-8 md:ml-12")}>
      <BaseSkeleton className="h-8 w-8 md:h-10 md:w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="bg-muted rounded-2xl p-3 space-y-2">
          <BaseSkeleton className="h-3 w-24 md:w-32" />
          <BaseSkeleton className="h-3 w-full" />
          <BaseSkeleton className="h-3 w-4/5" />
        </div>
        <div className="flex items-center gap-4 px-3">
          <BaseSkeleton className="h-3 w-12" />
          <BaseSkeleton className="h-3 w-12" />
          <BaseSkeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

interface CommentSkeletonListProps {
  count?: number;
  isReply?: boolean;
}

export const CommentSkeletonList = ({
  count = 2,
  isReply = false,
}: CommentSkeletonListProps) => {
  return (
    <div className="space-y-8 py-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`${index}-div`} className="space-y-4">
          <CommentSkeleton key={index} />
        </div>
      ))}
    </div>
  );
};
