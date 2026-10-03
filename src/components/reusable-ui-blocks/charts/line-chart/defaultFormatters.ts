// Sensible default formatters used when the consumer doesn't supply one.
// Keep these dependency-free so they work in both server and client bundles.

export function defaultYFormatter(value: number): string {
  if (!Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

export function defaultXFormatter(value: string | number): string {
  return String(value);
}

export function defaultTooltipValueFormatter(value: number): string {
  return defaultYFormatter(value);
}
