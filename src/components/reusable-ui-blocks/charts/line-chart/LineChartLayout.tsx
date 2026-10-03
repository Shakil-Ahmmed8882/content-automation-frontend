"use client";

// LineChart — top-level orchestrator.
// Merges consumer config with sane defaults, handles loading/empty/error
// states, and delegates the actual drawing to LineChartPlot.

import { useId } from "react";
import {
  defaultTooltipValueFormatter,
  defaultXFormatter,
  defaultYFormatter,
} from "./defaultFormatters";
import { LineChartBoundary } from "./LineChartBoundary";
import { LineChartError } from "./LineChartError";
import { LineChartPlot } from "./LineChartPlot";
import { LineChartSkeleton } from "./LineChartSkeleton";
import type { LineChartProps } from "./types";

const DEFAULT_DIMENSIONS = {
  height: 280,
  marginTop: 16,
  marginRight: 16,
  marginBottom: 8,
  marginLeft: 0,
} as const;

const DEFAULT_GRID = {
  show: true,
  color: "#F0F0F0",
  strokeDasharray: "4 4",
} as const;

export function LineChartLayout<
  TId extends string = string,
  TX extends string | number = string | number,
>(props: LineChartProps<TId, TX>) {
  const {
    series,
    styles,
    xAxis,
    yAxis,
    grid,
    tooltip,
    dimensions,
    isLoading = false,
    chartId,
    className,
    animate = true,
  } = props;

  const mergedDimensions = { ...DEFAULT_DIMENSIONS, ...dimensions };

  const mergedXAxis = {
    show: xAxis?.show ?? true,
    tickFormatter:
      xAxis?.tickFormatter ?? (defaultXFormatter as (v: TX) => string),
    domain:
      xAxis?.domain ?? (["auto", "auto"] as [number | "auto", number | "auto"]),
    ticks: xAxis?.ticks ?? 6,
    hideLine: xAxis?.hideLine ?? true,
  };

  const mergedYAxis = {
    show: yAxis?.show ?? true,
    tickFormatter: yAxis?.tickFormatter ?? defaultYFormatter,
    domain:
      yAxis?.domain ?? (["auto", "auto"] as [number | "auto", number | "auto"]),
    ticks: yAxis?.ticks ?? 5,
    hideLine: yAxis?.hideLine ?? true,
  };

  const mergedGrid = { ...DEFAULT_GRID, ...grid };

  const mergedTooltip = {
    show: tooltip?.show ?? true,
    formatLabel:
      tooltip?.formatLabel ?? (defaultXFormatter as (v: TX) => string),
    formatValue: tooltip?.formatValue ?? defaultTooltipValueFormatter,
  };

  const generatedId = useId().replace(/:/g, "");
  const resolvedChartId = chartId ?? `line-${generatedId}`;

  if (isLoading) {
    return (
      <LineChartSkeleton
        height={mergedDimensions.height}
        showXAxis={mergedXAxis.show}
        showYAxis={mergedYAxis.show}
        className={className}
      />
    );
  }

  const hasData =
    Array.isArray(series) &&
    series.length > 0 &&
    series.some((s) => Array.isArray(s.data) && s.data.length > 0);

  if (!hasData) {
    return (
      <LineChartError
        title="No data to display"
        message="There are no values to chart yet."
        height={mergedDimensions.height}
        className={className}
      />
    );
  }

  return (
    <LineChartBoundary
      fallback={
        <LineChartError
          height={mergedDimensions.height}
          className={className}
        />
      }
    >
      <div className={`w-full ${className ?? ""}`}>
        <LineChartPlot
          series={series}
          styles={styles}
          xAxis={mergedXAxis}
          yAxis={mergedYAxis}
          grid={mergedGrid}
          tooltip={mergedTooltip}
          dimensions={mergedDimensions}
          chartId={resolvedChartId}
          animate={animate}
        />
      </div>
    </LineChartBoundary>
  );
}

/*

==================================================================
LineChart — Developer Notes
==================================================================

A reusable, type-safe line chart built on recharts + framer-motion.
Designed to be drop-in for any reporting card: pass series + styles,
optionally override axes / grid / tooltip / dimensions.

------------------------------------------------------------------
DATA STRUCTURE
------------------------------------------------------------------

You provide TWO things: `series` (the data) and `styles` (the look).
Their keys are linked by a string-union `TId` so TypeScript will
yell at you if a series has no style or vice-versa.

  type SeriesId = "completed" | "assigned";

  const series: LineSeries<SeriesId>[] = [
    {
      id: "completed",
      label: "Completed",
      data: [
        { x: "Mon", y: 12 },
        { x: "Tue", y: 18 },
        { x: "Wed", y: 9  },
        ...
      ],
    },
    {
      id: "assigned",
      label: "Assigned",
      data: [
        { x: "Mon", y: 20 },
        { x: "Tue", y: 22 },
        ...
      ],
    },
  ];

  const styles: LineSeriesStyleMap<SeriesId> = {
    completed: { color: "#FF124B", fillUnder: true, strokeWidth: 2 },
    assigned:  { color: "#099EFA", curveType: "monotone" },
  };

  <LineChart series={series} styles={styles} />

X values can be strings ("Mon", "Jan", "2025-01-01") or numbers.
Series may have different X coverage — missing points render as gaps.

------------------------------------------------------------------
EVERY KEY YOU CAN CONTROL
------------------------------------------------------------------

PROPS (top-level)
  series          LineSeries[]                 required — the data
  styles          LineSeriesStyleMap           required — per-series visuals
  isLoading       boolean                      show skeleton (default false)
  animate         boolean                      framer entry anim (default true)
  chartId         string                       stable id for SVG gradient scope
  className       string                       wrapper class
  xAxis           LineChartAxisConfig          see below
  yAxis           LineChartAxisConfig          see below
  grid            LineChartGridConfig          see below
  tooltip         LineChartTooltipConfig       see below
  dimensions      LineChartDimensions          see below

PER-SERIES STYLE (LineSeriesStyle)
  color           string                       flat stroke color
  gradient        { from, to, angleDegrees }   gradient stroke (overrides color)
  strokeWidth     number                       default 2
  curveType       "monotone"|"linear"|"natural"|"step"
  showDots        boolean                      always-on dots (default false)
  fillUnder       boolean                      area fill under the line
  fillOpacity     0–1                          area fill opacity (default 0.18)

DIMENSIONS
  height          number  (default 280)
  marginTop/Right/Bottom/Left  numbers

X / Y AXIS CONFIG
  show            boolean                      default true
  tickFormatter   (value) => string            label formatting
  domain          ["auto"|number, "auto"|number]   y-axis range
  ticks           number                       approximate tick count
  hideLine        boolean                      hide axis line, keep ticks

GRID CONFIG
  show            boolean                      default true
  color           string                       default #F0F0F0
  strokeDasharray string                       default "4 4"

TOOLTIP CONFIG
  show            boolean                      default true
  formatLabel     (x) => string
  formatValue     (y) => string

------------------------------------------------------------------
COMMON RECIPES
------------------------------------------------------------------

1) Simple single line, area fill, currency tooltip:

  <LineChart
    series={[{ id: "rev", label: "Revenue", data: monthly }]}
    styles={{ rev: { color: "#FF124B", fillUnder: true } }}
    yAxis={{ tickFormatter: (v) => `$${(v / 1000).toFixed(0)}k` }}
    tooltip={{ formatValue: (v) => `$${v.toLocaleString()}` }}
  />

2) Multi-line, gradient strokes, no grid, fixed Y range:

  <LineChart
    series={[seriesA, seriesB]}
    styles={{
      a: { gradient: { from: "#FF124B", to: "#FF7A9C", angleDegrees: 90 } },
      b: { gradient: { from: "#099EFA", to: "#5BC0FF", angleDegrees: 90 } },
    }}
    grid={{ show: false }}
    yAxis={{ domain: [0, 100] }}
  />

3) Loading skeleton:

  <LineChart isLoading series={[]} styles={{} as any} />

------------------------------------------------------------------
NOTES
------------------------------------------------------------------

- Width is always 100% of the parent — set the height via `dimensions.height`.
- Gradient SVG ids are scoped per chart instance, safe to render many.
- Empty data → graceful "No data" placeholder; render crashes → error fallback.
- Loading skeleton matches the final layout's footprint (no shift on resolve).

*/
