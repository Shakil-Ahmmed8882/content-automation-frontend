"use client";

// ValuesColumn — right column.
// Renders one value per slice, colored to match its slice. The exact text
// (currency, hours, percent…) is determined by the formatValue function so
// this column makes no assumption about the underlying unit.

import { motion } from "framer-motion";
import { resolveSliceTextColor } from "./resolveSliceFill";
import type { DonutSlice, SliceStyleMap, ValueFormatter } from "./types";

type ValuesColumnProps<TId extends string> = {
  data: DonutSlice<TId>[];
  styles: SliceStyleMap<TId>;
  formatValue: ValueFormatter;
};

export function ValuesColumn<TId extends string>(
  props: ValuesColumnProps<TId>,
) {
  const { data, styles, formatValue } = props;

  return (
    <ul className="flex flex-col gap-2 items-end shrink-0">
      {data.map((slice, index) => {
        const textColor = resolveSliceTextColor(styles[slice.id]);
        return (
          <motion.li
            key={slice.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
            className="font-proxima-nova text-[16px] leading-6 whitespace-nowrap"
            style={{ color: textColor }}
          >
            {formatValue(slice.value, slice)}
          </motion.li>
        );
      })}
    </ul>
  );
}
