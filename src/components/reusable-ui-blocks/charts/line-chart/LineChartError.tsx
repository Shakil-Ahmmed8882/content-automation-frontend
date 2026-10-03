"use client";

// Fallback shown when there is no data to render or recharts crashes.

import { AlertCircle } from "lucide-react";

type Props = {
  title?: string;
  message?: string;
  height?: number;
  className?: string;
};

export function LineChartError(props: Props) {
  const {
    title = "Chart unavailable",
    message = "Something went wrong while drawing this chart.",
    height = 240,
    className,
  } = props;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 w-full rounded-2xl border border-dashed border-[#F0F0F0] bg-[#FAFAFA] text-center px-6 ${className ?? ""}`}
      style={{ minHeight: height }}
      role="alert"
    >
      <AlertCircle className="size-6 text-[#999]" />
      <p className="font-proxima-nova text-[#141414] text-sm font-semibold">
        {title}
      </p>
      <p className="font-proxima-nova text-[#666] text-xs">{message}</p>
    </div>
  );
}
