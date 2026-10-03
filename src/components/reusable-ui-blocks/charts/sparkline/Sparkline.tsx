"use client";

import { useId, useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

/*=========================================================
// Sparkline — a bare trend silhouette for inside a stat card.
//
// No axes, no grid, no tooltip, no legend: it is a shape that says "rising"
// or "falling" beside a headline figure, not a chart anyone reads values off.
// That is why it does NOT go through `line-chart/` next door, which exists for
// real, labelled, interactive plots and carries axis/tooltip/animation config
// this has no use for.
//
// Sits in reusable-ui-blocks rather than inside the RM module because the same
// silhouette is drawn on four cards in one frame and appears again in the RM
// reports suite — the rule-of-three threshold, reached on arrival.
//
// The gradient id is scoped with `useId()`: SVG gradient ids are global to the
// document, so four sparklines on one page would otherwise all paint with
// whichever gradient rendered last.
=========================================================*/

/*=========================================================
// Geometry read straight off the frames' exported paths (Financial Overview
// 2334:43424 and QA Performance 2334:43413), so the two silhouettes are one
// shape at two colours rather than two lookalikes:
//
//   stroke-width 0.798  — hairline; 1.5 read as a chart, not a silhouette
//   straight segments   — every command in both paths is an `L`, so a
//                         monotone spline is the wrong curve entirely
//   round cap + join    — what keeps a 0.8px zig-zag from stippling
//   fill                — a VERTICAL gradient across the plotted box: solid
//                         colour at the top edge, transparent at the bottom.
//                         The Financial cards use it; QA's path is `fill:
//                         none`, which is what `filled={false}` expresses.
=========================================================*/
const SPARKLINE_STROKE_WIDTH = 0.8;

type Props = {
  /** Plain values in chronological order. Fewer than 2 renders nothing. */
  data: number[];
  /** Any CSS color — pass a token var, e.g. `var(--primary)`. */
  color?: string;
  /** The area under the line. `false` draws the stroke alone (QA Performance). */
  filled?: boolean;
  className?: string;
};

export function Sparkline(props: Props) {
  const { data, color = "var(--primary)", filled = true, className } = props;
  const gradientId = useId().replace(/:/g, "");

  const rows = useMemo(
    () => data.map((value, index) => ({ index, value })),
    [data],
  );

  // A single point has no line to draw and recharts renders an empty box for
  // an empty series, so the caller gets nothing rather than a stray axis.
  if (rows.length < 2) return null;

  return (
    <div className={cn("h-10 w-full", className)} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={rows}
          margin={{ top: 1, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              {/* Full opacity at the top edge, not 0.35 — the frame's
							    gradient runs solid-to-transparent, which is why a rising
							    curve reads as a dense wedge on the right and almost
							    nothing on the left. */}
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="linear"
            dataKey="value"
            stroke={color}
            strokeWidth={SPARKLINE_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={filled ? `url(#${gradientId})` : "none"}
            /* Recharts defaults `fillOpacity` to 0.6, which washes the
						   gradient out to roughly half the frame's contrast — the
						   solid-to-transparent ramp has to be the only thing fading
						   the fill, or the wedge stops reading as a wedge. */
            fillOpacity={1}
            // The frame draws a clean silhouette — no point markers, and
            // no entry animation, since four of these animating at once
            // on a dashboard reads as flicker.
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
