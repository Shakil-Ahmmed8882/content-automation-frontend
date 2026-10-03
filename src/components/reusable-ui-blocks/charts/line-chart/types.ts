// Public types for the LineChart module.
// All shapes are exported from the barrel; nothing else here should be imported directly.

export type LineDataPoint<TX = string | number> = {
  x: TX;
  y: number;
};

export type LineGradient = {
  from: string;
  to: string;
  // 0 = left→right, 90 = top→bottom, etc. Defaults to 0.
  angleDegrees?: number;
};

export type LineCurveType = "linear" | "monotone" | "natural" | "step";

export type LineSeriesStyle = {
  // Flat stroke color. Use this OR `gradient`, not both.
  color?: string;
  // Gradient stroke. Takes precedence over `color`.
  gradient?: LineGradient;
  // Stroke thickness in px. Default: 2.
  strokeWidth?: number;
  // Curve interpolation. Default: "monotone".
  curveType?: LineCurveType;
  // Show dots at every data point. Default: false (only on hover).
  showDots?: boolean;
  // Render a soft area fill under the line.
  fillUnder?: boolean;
  // 0–1 opacity of the fill at the top of the area. Default: 0.18.
  fillOpacity?: number;
};

export type LineSeries<TId extends string = string, TX = string | number> = {
  id: TId;
  label: string;
  data: LineDataPoint<TX>[];
};

export type LineSeriesStyleMap<TId extends string> = Record<
  TId,
  LineSeriesStyle
>;

export type LineChartDimensions = {
  // Total chart height in px. Width is always 100% of the parent.
  height?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
};

export type LineChartAxisConfig<TX = string | number> = {
  show?: boolean;
  tickFormatter?: (value: TX) => string;
  // Y-axis only: ["auto", "auto"] | [0, 100] | [0, "auto"] etc.
  domain?: [number | "auto", number | "auto"];
  // Approximate tick count.
  ticks?: number;
  // Hide the axis line itself but keep the ticks/labels.
  hideLine?: boolean;
};

export type LineChartGridConfig = {
  show?: boolean;
  color?: string;
  strokeDasharray?: string;
};

export type LineChartTooltipConfig<TX = string | number> = {
  show?: boolean;
  formatLabel?: (x: TX) => string;
  formatValue?: (y: number) => string;
};

export type LineChartProps<
  TId extends string = string,
  TX extends string | number = string | number,
> = {
  // One entry per line. Each series carries its own data array.
  series: LineSeries<TId, TX>[];
  // Per-series visual config keyed by series id. Type-safe — must cover every id.
  styles: LineSeriesStyleMap<TId>;
  xAxis?: LineChartAxisConfig<TX>;
  yAxis?: LineChartAxisConfig<number>;
  grid?: LineChartGridConfig;
  tooltip?: LineChartTooltipConfig<TX>;
  dimensions?: LineChartDimensions;
  isLoading?: boolean;
  // Stable id used to scope SVG gradient ids so multiple charts don't collide.
  chartId?: string;
  className?: string;
  // Toggle entry framer-motion animation. Default: true.
  animate?: boolean;
};
