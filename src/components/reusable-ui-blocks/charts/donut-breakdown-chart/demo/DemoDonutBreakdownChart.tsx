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
type RoleId =
  | "supervisor"
  | "technician"
  | "security"
  | "maintenance"
  | "housekeeper";

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

const DemoDonutBreakdownChart = () => {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Card 1 — full Figma reference: chart + labels + values */}
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
        <DonutBreakdownChart
          isLoading={true}
          data={roleData}
          styles={roleStyles}
        />
      </section>

      {/* Card 2 — chart-only variant (no side columns) */}
      <section className="bg-white border border-[#F0F0F0] rounded-2xl shadow-card p-6">
        <header className="mb-6">
          <h2 className="font-proxima-nova text-[#141414] text-xl font-bold">
            Chart Only
          </h2>
        </header>
        <DonutBreakdownChart
          isLoading={true}
          data={roleData}
          styles={roleStyles}
          columns={{ showLabels: false, showValues: false }}
          dimensions={{ size: 200, thickness: 28 }}
        />
      </section>

      {/* Card 3 — labels only, thinner ring */}
      <section className="bg-white border border-[#F0F0F0] rounded-2xl shadow-card p-6">
        <header className="mb-6">
          <h2 className="font-proxima-nova text-[#141414] text-xl font-bold">
            Labels Only · Thinner Ring
          </h2>
        </header>
        <DonutBreakdownChart
          isLoading={true}
          data={roleData}
          styles={roleStyles}
          columns={{ showLabels: true, showValues: false }}
          dimensions={{ size: 220, thickness: 20 }}
        />
      </section>

      {/* Card 4 — gradient slices + custom value formatter (hours, not $) */}
      <section className="bg-white border border-[#F0F0F0] rounded-2xl shadow-card p-6">
        <header className="mb-6">
          <h2 className="font-proxima-nova text-[#141414] text-xl font-bold">
            Gradient Slices · Hour Formatter
          </h2>
        </header>
        <DonutBreakdownChart
          data={roleData}
          styles={{
            supervisor: {
              gradient: { from: "#141414", to: "#3D3D3D", angleDegrees: 90 },
            },
            technician: {
              gradient: { from: "#099EFA", to: "#5BC0FF", angleDegrees: 90 },
            },
            security: {
              gradient: { from: "#07B833", to: "#5DD981", angleDegrees: 90 },
            },
            maintenance: {
              gradient: { from: "#E0A308", to: "#F4C95D", angleDegrees: 90 },
            },
            housekeeper: {
              gradient: { from: "#FF124B", to: "#FF7A9C", angleDegrees: 90 },
            },
          }}
          formatValue={(value) => `${Math.round(value / 100)}h`}
          dimensions={{ thickness: 48, hoverGrowth: 10 }}
        />
      </section>
    </div>
  );
};

export default DemoDonutBreakdownChart;
