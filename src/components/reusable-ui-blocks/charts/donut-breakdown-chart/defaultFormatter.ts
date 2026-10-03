// Default value formatter — turns a number into a "$52k" / "$1.2M" string.
// Consumers can pass their own formatValue to fully override (e.g. hours, %).

import type { ValueFormatter } from "./types";

export const defaultDollarFormatter: ValueFormatter = (value) => {
  if (value >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value}`;
};
