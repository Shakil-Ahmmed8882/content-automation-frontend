"use client";

// LabelsColumn — middle column.
// Renders one row per slice: a colored dot + the slice's label text.
// The dot color always matches the chart slice (uses flat color when given,
// falls back to the gradient's "from" stop otherwise).

import { motion } from "framer-motion";
import { resolveSliceTextColor } from "./resolveSliceFill";
import type { DonutSlice, SliceStyleMap } from "./types";

type LabelsColumnProps<TId extends string> = {
  data: DonutSlice<TId>[];
  styles: SliceStyleMap<TId>;
};

export function LabelsColumn<TId extends string>(
  props: LabelsColumnProps<TId>,
) {
  const { data, styles } = props;

  return (
    <ul className="flex flex-col gap-2 min-w-0 flex-1">
      {data.map((slice, index) => {
        const dotColor = resolveSliceTextColor(styles[slice.id]);
        return (
          <motion.li
            key={slice.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
            className="flex items-center gap-2 min-w-0"
          >
            <span
              aria-hidden
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: dotColor }}
            />
            <span className="font-proxima-nova text-[20px] leading-normal text-[#141414] truncate">
              {slice.label}
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}
