"use client";

// DonutBreakdownChart — top-level orchestrator.
// Composes the donut + optional labels/values columns into one responsive row.
// The chart itself is always rendered; the side columns are opt-in.

import { useId } from "react";
import { DonutChartBoundary } from "./DonutChartBoundary";
import { DonutChartError } from "./DonutChartError";
import { DonutChartSkeleton } from "./DonutChartSkeleton";
import { DonutPie } from "./DonutPie";
import { defaultDollarFormatter } from "./defaultFormatter";
import { LabelsColumn } from "./LabelsColumn";
import type { DonutBreakdownChartProps } from "./types";
import { ValuesColumn } from "./ValuesColumn";

// Sensible defaults — chosen to match the Figma reference at first paint.
const DEFAULT_DIMENSIONS = {
  size: 232,
  thickness: 38,
  hoverGrowth: 6,
} as const;

const DEFAULT_COLUMNS = {
  showLabels: true,
  showValues: true,
} as const;

export function DonutBreakdownChartLayout<TId extends string = string>(
  props: DonutBreakdownChartProps<TId>,
) {
  const {
    data,
    styles,
    columns,
    dimensions,
    formatValue = defaultDollarFormatter,
    isLoading = false,
    chartId,
    className,
  } = props;

  // Merge consumer overrides with defaults so downstream code can rely on
  // every dimension/column flag being defined.
  const mergedDimensions = { ...DEFAULT_DIMENSIONS, ...dimensions };
  const mergedColumns = { ...DEFAULT_COLUMNS, ...columns };

  const generatedId = useId().replace(/:/g, "");
  const resolvedChartId = chartId ?? `donut-${generatedId}`;

  // Loading state — skeleton mirrors the final layout exactly.
  if (isLoading) {
    return (
      <DonutChartSkeleton
        rowCount={Math.max(data.length, 5)}
        columns={mergedColumns}
        dimensions={mergedDimensions}
        className={className}
      />
    );
  }

  // Empty / invalid data — nothing to draw, fall back gracefully.
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <DonutChartError
        title="No data to display"
        message="There are no values to chart yet."
        className={className}
      />
    );
  }

  return (
    <DonutChartBoundary fallback={<DonutChartError className={className} />}>
      <div
        className={`flex items-center justify-center gap-10 w-full ${className ?? ""}`}
      >
        <DonutPie
          data={data}
          styles={styles}
          dimensions={mergedDimensions}
          chartId={resolvedChartId}
        />

        {(mergedColumns.showLabels || mergedColumns.showValues) && (
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {mergedColumns.showLabels && (
              <LabelsColumn data={data} styles={styles} />
            )}
            {mergedColumns.showValues && (
              <ValuesColumn
                data={data}
                styles={styles}
                formatValue={formatValue}
              />
            )}
          </div>
        )}
      </div>
    </DonutChartBoundary>
  );
}

/*


HOW TO USE THIS COMPONENT:


=============================================================
=============================================================
=============================================================


"use client";

// Demo page for the reusable DonutBreakdownChart.
// Shows a "Cost Breakdown by Roles" card matching the Figma reference,
// plus a couple of variant cards to prove the component is fully configurable.

import {
	DonutBreakdownChart,
	type DonutSlice,
	type SliceStyleMap,
} from "@/components/reusable-ui-blocks/charts/donut-breakdown-chart";

// Slice ids — using a string union keeps the `styles` map fully type-safe:
// TypeScript will error if a key is missing or unknown.
type RoleId = "supervisor" | "technician" | "security" | "maintenance" | "housekeeper";

const roleData: DonutSlice<RoleId>[] = [
	{ id: "supervisor", label: "Supervisor", value: 52000 },
	{ id: "technician", label: "Technician", value: 23000 },
	{ id: "security", label: "Security", value: 19000 },
	{ id: "maintenance", label: "Maintenance", value: 8000 },
	{ id: "housekeeper", label: "Housekeeper", value: 3000 },
];

// Per-slice colors. The same id flows through chart, dot, and value — so
// editing one entry here changes every place that color appears.
const roleStyles: SliceStyleMap<RoleId> = {
	supervisor: { color: "#3D3D3D" },
	technician: { color: "#099EFA" },
	security: { color: "#07B833" },
	maintenance: { color: "#E0A308" },
	housekeeper: { color: "#FF124B" },
};

const TotalHours = () => {
	return (
		<div className="flex flex-col gap-6 p-6">



			1️⃣// Card 1 — full Figma reference: chart + labels + values
			<section className="bg-white border border-[#F0F0F0] rounded-2xl shadow-card p-6">
				<header className="flex items-center justify-between mb-6">
					<h2 className="font-proxima-nova text-[#141414] text-xl font-bold">
						Cost Breakdown by Roles
					</h2>
					<button
						type="button"
						className="font-proxima-nova text-[#FF124B] text-sm underline cursor-pointer"
					>
						View All
					</button>
				</header>
				<DonutBreakdownChartLayout isLoading={true} data={roleData} styles={roleStyles} />
			</section>

			//Card 2️⃣ — chart-only variant (no side columns) 
			<section className="bg-white border border-[#F0F0F0] rounded-2xl shadow-card p-6">
				<header className="mb-6">
					<h2 className="font-proxima-nova text-[#141414] text-xl font-bold">
						Chart Only
					</h2>
				</header>
				<DonutBreakdownChartLayout
					isLoading={true}
					data={roleData}
					styles={roleStyles}
					columns={{ showLabels: false, showValues: false }}
					dimensions={{ size: 200, thickness: 28 }}
				/>
			</section>

			// Card 3️⃣ — labels only, thinner ring 
			<section className="bg-white border border-[#F0F0F0] rounded-2xl shadow-card p-6">
				<header className="mb-6">
					<h2 className="font-proxima-nova text-[#141414] text-xl font-bold">
						Labels Only · Thinner Ring
					</h2>
				</header>
				<DonutBreakdownChartLayout
				isLoading={true}
					data={roleData}
					styles={roleStyles}
					columns={{ showLabels: true, showValues: false }}
					dimensions={{ size: 220, thickness: 20 }}
				/>
			</section>

			// Card 4️⃣ — gradient slices + custom value formatter (hours, not $)

			<section className="bg-white border border-[#F0F0F0] rounded-2xl shadow-card p-6">
				<header className="mb-6">
					<h2 className="font-proxima-nova text-[#141414] text-xl font-bold">
						Gradient Slices · Hour Formatter
					</h2>
				</header>
				<DonutBreakdownChartLayout
					data={roleData}
					
					styles={{
						supervisor: { gradient: { from: "#141414", to: "#3D3D3D", angleDegrees: 90 } },
						technician: { gradient: { from: "#099EFA", to: "#5BC0FF", angleDegrees: 90 } },
						security: { gradient: { from: "#07B833", to: "#5DD981", angleDegrees: 90 } },
						maintenance: { gradient: { from: "#E0A308", to: "#F4C95D", angleDegrees: 90 } },
						housekeeper: { gradient: { from: "#FF124B", to: "#FF7A9C", angleDegrees: 90 } },
					}}
					formatValue={(value) => `${Math.round(value / 100)}h`}
					dimensions={{ thickness: 48, hoverGrowth: 10 }}
				/>
			</section>
		</div>
	);
};




*/
