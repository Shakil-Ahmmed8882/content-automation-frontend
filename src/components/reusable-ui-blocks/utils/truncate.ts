import { cn } from "@/lib/utils";

/**
 * Responsive text truncation helper — returns a className string.
 *
 * Truncation is applied via Tailwind's `truncate` utility (single-line) or
 * `line-clamp-N` (multi-line). Providing a `max-width` per breakpoint keeps
 * the ellipsis anchored to a predictable boundary instead of relying on
 * parent width alone, which avoids layout thrashing on content-driven grids.
 *
 * Pass only the breakpoints you care about; unspecified ones inherit the
 * previous breakpoint's behavior (mobile-first cascade).
 *
 * Performance: returns static Tailwind classes — no runtime measurement,
 * no ResizeObserver, no JS layout reads. The browser handles it on the
 * compositor/paint path.
 *
 * @example
 * // Single-line ellipsis, capped width per breakpoint
 * <p className={truncate({ base: 120, md: 180, lg: 240 })}>{name}</p>
 *
 * @example
 * // 2 lines on small, 1 line on md+
 * <p className={truncate({ lines: { base: 2, md: 1 } })}>{description}</p>
 */

type Breakpoint = "base" | "sm" | "md" | "lg" | "xl" | "2xl";

type TruncateMaxWidth = Partial<Record<Breakpoint, number | string>>;
type TruncateLines = Partial<Record<Breakpoint, number>>;

export type TruncateOptions =
  | TruncateMaxWidth
  | {
      /** per-breakpoint max-width in px (number) or any CSS length (string) */
      maxWidth?: TruncateMaxWidth;
      /** per-breakpoint line clamp (1 = single-line truncate) */
      lines?: TruncateLines;
      /** extra classes appended at the end */
      className?: string;
    };

const PREFIX: Record<Breakpoint, string> = {
  base: "",
  sm: "sm:",
  md: "md:",
  lg: "lg:",
  xl: "xl:",
  "2xl": "2xl:",
};

function toCssLength(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}

function maxWidthClasses(map: TruncateMaxWidth): string[] {
  return (Object.keys(map) as Breakpoint[])
    .filter((bp) => map[bp] !== undefined)
    .map((bp) => `${PREFIX[bp]}max-w-[${toCssLength(map[bp]!)}]`);
}

function lineClampClasses(map: TruncateLines): string[] {
  return (Object.keys(map) as Breakpoint[])
    .filter((bp) => map[bp] !== undefined)
    .map((bp) => {
      const n = map[bp]!;
      // line-clamp-1 uses a different rendering path than truncate;
      // only use truncate when we're strictly single-line everywhere.
      return `${PREFIX[bp]}line-clamp-${n}`;
    });
}

function isDirectMaxWidthShape(
  options: TruncateOptions,
): options is TruncateMaxWidth {
  if (!options) return false;
  const keys = Object.keys(options);
  if (keys.length === 0) return true;
  const bpKeys: Breakpoint[] = ["base", "sm", "md", "lg", "xl", "2xl"];
  return keys.every((k) => (bpKeys as string[]).includes(k));
}

export function truncate(options: TruncateOptions = {}): string {
  // Shorthand: `truncate({ base: 120, md: 180 })`
  if (isDirectMaxWidthShape(options)) {
    const widths = maxWidthClasses(options);
    return cn("block truncate min-w-0", widths);
  }

  const { maxWidth, lines, className } = options;

  const widthClasses = maxWidth ? maxWidthClasses(maxWidth) : [];

  // Single-line everywhere → `truncate`. Multi-line → `line-clamp-N`.
  const allSingle =
    !lines || (Object.values(lines) as number[]).every((n) => n === 1);

  const clampClasses = !allSingle && lines ? lineClampClasses(lines) : [];

  return cn(
    allSingle ? "block truncate min-w-0" : "block min-w-0 break-words",
    widthClasses,
    clampClasses,
    className,
  );
}
