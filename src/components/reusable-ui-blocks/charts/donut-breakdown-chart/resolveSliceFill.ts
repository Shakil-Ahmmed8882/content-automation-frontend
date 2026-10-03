// Resolves a slice's fill — either a flat color, a gradient url, or a safe fallback.
// The gradient url references <linearGradient> elements rendered in DonutPie's <defs>.

import type { SliceStyle } from "./types";

export const FALLBACK_SLICE_COLOR = "#D0D0D0";

export function resolveSliceFill(
  style: SliceStyle | undefined,
  gradientId: string,
): string {
  if (!style) return FALLBACK_SLICE_COLOR;
  if (style.gradient) return `url(#${gradientId})`;
  return style.color ?? FALLBACK_SLICE_COLOR;
}

// Used by the labels/values columns where a flat color is needed for text.
// Falls back to the gradient's `from` stop if no flat color is supplied.
export function resolveSliceTextColor(style: SliceStyle | undefined): string {
  if (!style) return FALLBACK_SLICE_COLOR;
  if (style.color) return style.color;
  if (style.gradient) return style.gradient.from;
  return FALLBACK_SLICE_COLOR;
}
