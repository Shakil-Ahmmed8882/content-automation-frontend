// Public types for the DonutBreakdownChart.
// Kept intentionally flat and simple so any dataset can be plugged in.

import type { ReactNode } from "react";

// A single slice of the donut. Generic id keeps consumer types intact.
export type DonutSlice<TId extends string = string> = {
  id: TId;
  label: string;
  value: number;
};

// Optional gradient definition — when present, the slice is filled with
// a linear gradient instead of a flat color.
export type SliceGradient = {
  from: string;
  to: string;
  // 0-360. Defaults to 0 (left → right) when omitted.
  angleDegrees?: number;
};

// Per-slice visual configuration, keyed by slice id.
// Either `color` (flat) or `gradient` is required — gradient wins if both set.
export type SliceStyle = {
  color?: string;
  gradient?: SliceGradient;
};

export type SliceStyleMap<TId extends string = string> = Record<
  TId,
  SliceStyle
>;

// How to render a slice value in the right column.
// Default formatter handles the "$52k" style shown in the design.
export type ValueFormatter = (value: number, slice: DonutSlice) => ReactNode;

// Which columns to render alongside the chart.
// "values" without "labels" still shows labels-then-values together — matches design.
// Note: chart is always required; this only toggles the side columns.
export type DonutChartColumns = {
  showLabels?: boolean;
  showValues?: boolean;
};

// Overall sizing/thickness controls. All optional with sensible defaults.
export type DonutChartDimensions = {
  // Diameter of the chart in px. Default: 232.
  size?: number;
  // Ring thickness in px (outerRadius - innerRadius). Default: 38.
  thickness?: number;
  // How much bigger a hovered slice grows in px. Default: 6.
  hoverGrowth?: number;
};

export type DonutBreakdownChartProps<TId extends string = string> = {
  data: DonutSlice<TId>[];
  styles: SliceStyleMap<TId>;
  columns?: DonutChartColumns;
  dimensions?: DonutChartDimensions;
  formatValue?: ValueFormatter;
  isLoading?: boolean;
  // Stable id used to scope <linearGradient> defs so multiple charts on
  // the same page don't collide. Default: auto-generated per instance.
  chartId?: string;
  className?: string;
};
