"use client";

// Fallback shown when the chart cannot render — empty data, malformed config,
// or a runtime crash caught by the ErrorBoundary inside DonutBreakdownChart.

import { AlertCircle } from "lucide-react";

type DonutChartErrorProps = {
  title?: string;
  message?: string;
  className?: string;
};

export function DonutChartError(props: DonutChartErrorProps) {
  const {
    title = "Chart unavailable",
    message = "We couldn't render this chart right now.",
    className,
  } = props;

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-2 py-8 px-4 text-center font-proxima-nova ${className ?? ""}`}
    >
      <div className="flex items-center justify-center size-10 rounded-full bg-[#FEF4F6]">
        <AlertCircle className="size-5 text-[#FF124B]" />
      </div>
      <p className="text-[#141414] text-base font-semibold">{title}</p>
      <p className="text-[#666] text-sm max-w-xs">{message}</p>
    </div>
  );
}
