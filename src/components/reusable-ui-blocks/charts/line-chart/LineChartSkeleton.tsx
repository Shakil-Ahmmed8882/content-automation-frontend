"use client";

// Loading state — a faint placeholder that mirrors the final chart's footprint
// so there is no layout shift when data resolves.

import { BaseSkeleton } from "../../placeholder/skeletons/BaseSkeleton";

type Props = {
  height: number;
  showXAxis: boolean;
  showYAxis: boolean;
  className?: string;
};

export function LineChartSkeleton(props: Props) {
  const { height, showXAxis, showYAxis, className } = props;

  return (
    <div
      className={`w-full ${className ?? ""}`}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex gap-3" style={{ height }}>
        {showYAxis && (
          <div className="flex flex-col justify-between py-1">
            {Array.from({ length: 5 }).map((_, idx) => (
              <BaseSkeleton key={idx} className="h-3 w-8 rounded" />
            ))}
          </div>
        )}
        <div className="flex-1 relative">
          <BaseSkeleton className="absolute inset-0 rounded-xl" />
        </div>
      </div>
      {showXAxis && (
        <div className="flex items-center justify-between mt-3 gap-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <BaseSkeleton key={idx} className="h-3 w-10 rounded" />
          ))}
        </div>
      )}
    </div>
  );
}
