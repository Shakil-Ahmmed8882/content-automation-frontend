import type {
  DrawerBreakpoint,
  DrawerResponsiveSize,
  DrawerSize,
  DrawerSizeValue,
} from "../types";

// Tailwind v4 default breakpoint min-widths.
const BREAKPOINT_MIN_WIDTH: Record<
  Exclude<DrawerBreakpoint, "base">,
  string
> = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
};

const SIZE_PRESETS: Record<string, string> = {
  third: "33.333%",
  half: "50%",
  twoThird: "66.666%",
  full: "100%",
};

const BREAKPOINT_ORDER: DrawerBreakpoint[] = ["base", "sm", "md", "lg", "xl"];

function toCssLength(value: DrawerSizeValue): string {
  return SIZE_PRESETS[value] ?? value;
}

/**
 * Normalises the `width` prop into a per-breakpoint map.
 *
 * A single value becomes mobile-first responsive across THREE bands, because
 * one width cannot serve every screen: a "third" drawer that reads well on a
 * wide desktop is a cramped column on a tablet or a small laptop.
 *
 *   base → "full"   phones: full-bleed, nothing else fits
 *   md   → "half"   tablets and laptops: half the viewport
 *   xl   → `size`   wide desktops: the size the caller actually asked for
 *
 * A responsive object is still used as-is (minus a `base` default of "full") —
 * an explicit per-breakpoint map means the caller has already made this call,
 * so silently injecting an `md` step would fight them.
 */
function normalise(size: DrawerSize): DrawerResponsiveSize {
  if (typeof size === "string") {
    if (size === "full") return { base: "full" };
    if (size === "half") return { base: "full", md: "half" };
    return { base: "full", md: "half", xl: size };
  }
  return { base: "full", ...size };
}

/**
 * Builds the CSS that drives the panel's size responsively. Inline styles can't
 * hold media queries, so we emit a scoped stylesheet that sets a CSS variable
 * (`--drawer-size`) per breakpoint, and the panel reads that variable for its
 * width (horizontal drawers) or height (vertical). Returns the stylesheet text
 * plus the class the panel must carry, both keyed to a unique instance id.
 */
export function resolveDrawerSize(
  size: DrawerSize,
  side: "horizontal" | "vertical",
  instanceId: string,
) {
  const map = normalise(size);
  const className = `drawer-size-${instanceId}`;
  const selector = `.${className}`;
  const dimension = side === "horizontal" ? "width" : "height";
  const maxDimension = side === "horizontal" ? "max-width" : "max-height";

  // Fill down: a breakpoint with no explicit value inherits the nearest smaller.
  let last: DrawerSizeValue = map.base ?? "full";
  const rules: string[] = [];

  for (const bp of BREAKPOINT_ORDER) {
    const value = map[bp];
    if (bp !== "base" && value === undefined) continue; // no change at this breakpoint
    if (value !== undefined) last = value;
    const declaration = `${selector} { --drawer-size: ${toCssLength(last)}; }`;
    if (bp === "base") {
      rules.push(declaration);
    } else {
      rules.push(
        `@media (min-width: ${BREAKPOINT_MIN_WIDTH[bp]}) { ${declaration} }`,
      );
    }
  }

  const css = `${selector} { ${dimension}: var(--drawer-size); ${maxDimension}: 100%; } ${rules.join(" ")}`;

  return { className, css };
}
