"use client";

// DonutPie — the actual donut visualisation.
// Built on recharts <Pie> with a custom animated <Sector> so that:
//   - on hover the active slice grows slightly (controlled by hoverGrowth)
//   - the whole donut fades + scales in via framer-motion
//   - gradient fills are supported via <defs><linearGradient/></defs>

import { motion } from "framer-motion";
import { useId } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { resolveSliceFill } from "./resolveSliceFill";
import type { DonutChartDimensions, DonutSlice, SliceStyleMap } from "./types";

type DonutPieProps<TId extends string> = {
  data: DonutSlice<TId>[];
  styles: SliceStyleMap<TId>;
  dimensions: Required<DonutChartDimensions>;
  chartId: string;
};

// Custom active shape — adds a few px of outerRadius to the hovered slice.
// recharts hands us a partial shape descriptor; everything we need is optional
// so we coalesce defensively before forwarding to <Sector>.
type ActiveShapeProps = {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
};

function buildActiveShape(growth: number) {
  return function ActiveSector(props: ActiveShapeProps) {
    return (
      <Sector
        cx={props.cx}
        cy={props.cy}
        innerRadius={props.innerRadius}
        outerRadius={(props.outerRadius ?? 0) + growth}
        startAngle={props.startAngle}
        endAngle={props.endAngle}
        fill={props.fill}
      />
    );
  };
}

export function DonutPie<TId extends string>(props: DonutPieProps<TId>) {
  const { data, styles, dimensions, chartId } = props;
  const reactInstanceId = useId().replace(/:/g, "");
  const scopedId = `${chartId}-${reactInstanceId}`;

  // Compute radii from size + thickness. Reserve a few px for the hover-grow
  // so the enlarged slice never gets clipped by the SVG bounds.
  const half = dimensions.size / 2;
  const outerRadius = half - dimensions.hoverGrowth;
  const innerRadius = Math.max(0, outerRadius - dimensions.thickness);

  const activeShape = buildActiveShape(dimensions.hoverGrowth);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{ width: dimensions.size, height: dimensions.size }}
      className="shrink-0"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Gradient definitions — one per slice that opted into a gradient */}
          <defs>
            {data.map((slice) => {
              const gradient = styles[slice.id]?.gradient;
              if (!gradient) return null;
              const angle = gradient.angleDegrees ?? 0;
              // Convert angle to x1/y1/x2/y2 across the unit box.
              const radians = (angle * Math.PI) / 180;
              const x2 = 0.5 + Math.cos(radians) * 0.5;
              const y2 = 0.5 + Math.sin(radians) * 0.5;
              const x1 = 1 - x2;
              const y1 = 1 - y2;
              return (
                <linearGradient
                  key={slice.id}
                  id={`${scopedId}-${slice.id}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                >
                  <stop offset="0%" stopColor={gradient.from} />
                  <stop offset="100%" stopColor={gradient.to} />
                </linearGradient>
              );
            })}
          </defs>

          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            stroke="none"
            isAnimationActive
            animationBegin={0}
            animationDuration={650}
            activeShape={activeShape}
          >
            {data.map((slice) => {
              const fill = resolveSliceFill(
                styles[slice.id],
                `${scopedId}-${slice.id}`,
              );
              return <Cell key={slice.id} fill={fill} />;
            })}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
