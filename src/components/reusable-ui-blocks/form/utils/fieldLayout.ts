import { cn } from "../primitives";
import type { TFieldGap, TInlineFieldLayout } from "../types/form.type";

/*=========================================================
// fieldLayout — inline label/control positioning.
//
// The gap classes are spelled out in full on purpose.
// Tailwind scans source as plain text, so a template literal
// like `gap-${gap}` compiles to nothing and the spacing
// silently disappears. Every class here is a literal string.
=========================================================*/

const GAP_CLASS: Record<TFieldGap, string> = {
  "2": "gap-2",
  "4": "gap-4",
  "6": "gap-6",
  "8": "gap-8",
};

/** Wrapper classes for a control that sits next to its label. */
export function inlineRowClass(layout: TInlineFieldLayout = {}) {
  const { column = false, longGap = false, gap = "2" } = layout;

  return cn(
    "relative flex items-center",
    GAP_CLASS[gap],
    column && "flex-col items-start",
    longGap && "w-full justify-between",
  );
}

/** Order classes so `reverse` flips label and control. */
export function inlineOrderClass(layout: TInlineFieldLayout = {}) {
  const { reverse = false } = layout;

  return {
    control: reverse ? "order-1" : "order-0",
    label: reverse ? "order-0" : "order-1",
  };
}
