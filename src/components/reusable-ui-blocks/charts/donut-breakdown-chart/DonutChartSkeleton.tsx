// Skeleton — mirrors the final layout so loading→loaded swaps don't shift.
// Reacts to the same `columns` config: only renders the placeholders for
// columns that will actually appear once data arrives.

import { BaseSkeleton } from "../../placeholder/skeletons/BaseSkeleton";
import type { DonutChartColumns, DonutChartDimensions } from "./types";

type DonutChartSkeletonProps = {
  rowCount?: number;
  columns: Required<DonutChartColumns>;
  dimensions: Required<DonutChartDimensions>;
  className?: string;
};

export function DonutChartSkeleton(props: DonutChartSkeletonProps) {
  const { rowCount = 5, columns, dimensions, className } = props;

  return (
    <div
      className={`flex items-center justify-center gap-10 w-full ${className ?? ""}`}
      aria-busy
      aria-live="polite"
    >
      {/* Donut placeholder — sized identically to the real chart */}
      <BaseSkeleton
        className="rounded-full  shrink-0"
        style={{ width: dimensions.size, height: dimensions.size }}
      />

      {/* Labels column placeholder */}
      {columns.showLabels && (
        <ul className="flex flex-col gap-4 min-w-0 flex-1">
          {Array.from({ length: rowCount }).map((_, index) => (
            <li key={index} className="flex items-center gap-2">
              <BaseSkeleton className="size-4 rounded-full shrink-0" />
              <BaseSkeleton className="h-5 w-28 rounded" />
            </li>
          ))}
        </ul>
      )}

      {/* Values column placeholder */}
      {columns.showValues && (
        <ul className="flex flex-col gap-4 items-end shrink-0">
          {Array.from({ length: rowCount }).map((_, index) => (
            <BaseSkeleton key={index} className="h-5 w-12 rounded" />
          ))}
        </ul>
      )}
    </div>
  );
}
