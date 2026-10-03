"use client";

// LineChartPlot — the actual line visualisation built on recharts.
// Supports flat or gradient strokes, optional area fill, multi-series, and a
// framer-motion entry animation. Side-effects are scoped via `chartId` so
// multiple charts on the same page don't collide on SVG gradient ids.

import { motion } from "framer-motion";
import { Fragment, useId, useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  LineChartAxisConfig,
  LineChartDimensions,
  LineChartGridConfig,
  LineChartTooltipConfig,
  LineSeries,
  LineSeriesStyleMap,
} from "./types";

type Props<TId extends string, TX extends string | number> = {
  series: LineSeries<TId, TX>[];
  styles: LineSeriesStyleMap<TId>;
  xAxis: Required<LineChartAxisConfig<TX>>;
  yAxis: Required<LineChartAxisConfig<number>>;
  grid: Required<LineChartGridConfig>;
  tooltip: Required<LineChartTooltipConfig<TX>>;
  dimensions: Required<LineChartDimensions>;
  chartId: string;
  animate: boolean;
};

export function LineChartPlot<TId extends string, TX extends string | number>(
  props: Props<TId, TX>,
) {
  // Merge per-series points into a single rows[] keyed by series id, the
  // shape recharts wants. Preserves first-seen X order across all series.
  const rows = useMemo(() => {
    const xValues: TX[] = [];
    const seen = new Set<TX>();
    for (const s of props.series) {
      for (const point of s.data) {
        if (!seen.has(point.x)) {
          seen.add(point.x);
          xValues.push(point.x);
        }
      }
    }
    return xValues.map((x) => {
      const row: Record<string, unknown> = { x };
      for (const s of props.series) {
        const point = s.data.find((p) => p.x === x);
        row[s.id] = point?.y ?? null;
      }
      return row;
    });
  }, [props.series]);

  const reactInstanceId = useId().replace(/:/g, "");
  const scopedId = `${props.chartId}-${reactInstanceId}`;

  return (
    <motion.div
      initial={props.animate ? { opacity: 0, y: 8 } : false}
      animate={props.animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{ width: "100%", height: props.dimensions.height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={rows}
          margin={{
            top: props.dimensions.marginTop,
            right: props.dimensions.marginRight,
            bottom: props.dimensions.marginBottom,
            left: props.dimensions.marginLeft,
          }}
        >
          <defs>
            {props.series.map((s) => {
              const style = props.styles[s.id];
              const nodes: React.ReactNode[] = [];

              // Stroke gradient — only when consumer asked for one.
              if (style?.gradient) {
                const angle = style.gradient.angleDegrees ?? 0;
                const rad = (angle * Math.PI) / 180;
                const x2 = 0.5 + Math.cos(rad) * 0.5;
                const y2 = 0.5 + Math.sin(rad) * 0.5;
                const x1 = 1 - x2;
                const y1 = 1 - y2;
                nodes.push(
                  <linearGradient
                    key={`stroke-${s.id}`}
                    id={`${scopedId}-stroke-${s.id}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                  >
                    <stop offset="0%" stopColor={style.gradient.from} />
                    <stop offset="100%" stopColor={style.gradient.to} />
                  </linearGradient>,
                );
              }

              // Vertical fade fill under the line for `fillUnder: true`.
              if (style?.fillUnder) {
                const baseColor =
                  style.color ?? style.gradient?.from ?? "#FF124B";
                nodes.push(
                  <linearGradient
                    key={`fill-${s.id}`}
                    id={`${scopedId}-fill-${s.id}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={baseColor}
                      stopOpacity={style.fillOpacity ?? 0.18}
                    />
                    <stop offset="100%" stopColor={baseColor} stopOpacity={0} />
                  </linearGradient>,
                );
              }

              return <Fragment key={s.id}>{nodes}</Fragment>;
            })}
          </defs>

          {props.grid.show && (
            <CartesianGrid
              vertical={false}
              stroke={props.grid.color}
              strokeDasharray={props.grid.strokeDasharray}
            />
          )}

          {props.xAxis.show && (
            <XAxis
              dataKey="x"
              tickLine={false}
              axisLine={!props.xAxis.hideLine}
              tickFormatter={(value) => props.xAxis.tickFormatter(value as TX)}
              tick={{ fill: "#999", fontSize: 12 }}
            />
          )}

          {props.yAxis.show && (
            <YAxis
              tickLine={false}
              axisLine={!props.yAxis.hideLine}
              tickFormatter={(value) =>
                props.yAxis.tickFormatter(value as number)
              }
              tick={{ fill: "#999", fontSize: 12 }}
              domain={props.yAxis.domain}
              tickCount={props.yAxis.ticks}
            />
          )}

          {props.tooltip.show && (
            <Tooltip
              cursor={{ stroke: "#D0D0D0", strokeDasharray: "4 4" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #F0F0F0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                fontFamily: "var(--font-proxima-nova)",
              }}
              labelFormatter={(label) => props.tooltip.formatLabel(label as TX)}
              formatter={
                ((value: unknown, name: unknown) => {
                  const numeric =
                    typeof value === "number" ? value : Number(value ?? 0);
                  const series = props.series.find((s) => s.id === name);
                  return [
                    props.tooltip.formatValue(numeric),
                    series?.label ?? String(name),
                  ];
                }) as never
              }
            />
          )}

          {/* Areas first so their fills sit underneath any line strokes. */}
          {props.series.map((s) => {
            const style = props.styles[s.id] ?? {};
            if (!style.fillUnder) return null;
            return (
              <Area
                key={`area-${s.id}`}
                type={style.curveType ?? "monotone"}
                dataKey={s.id}
                stroke="none"
                fill={`url(#${scopedId}-fill-${s.id})`}
                isAnimationActive={false}
                activeDot={false}
              />
            );
          })}

          {props.series.map((s) => {
            const style = props.styles[s.id] ?? {};
            const stroke = style.gradient
              ? `url(#${scopedId}-stroke-${s.id})`
              : (style.color ?? "#FF124B");
            return (
              <Line
                key={`line-${s.id}`}
                type={style.curveType ?? "monotone"}
                dataKey={s.id}
                stroke={stroke}
                strokeWidth={style.strokeWidth ?? 2}
                dot={style.showDots === true}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                isAnimationActive
                animationDuration={650}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
