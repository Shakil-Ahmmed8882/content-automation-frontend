"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Option<T> = {
  value: T;
  label: string;
};

type DropdownProps<T> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  trigger: React.ReactNode;
  /** Popover align. Defaults to "end" (existing behavior). */
  align?: "start" | "center" | "end";
  /** Extra classes for the popover panel (e.g. a higher z-index inside a modal). */
  contentClassName?: string;
  /** Match the panel width to the trigger width (field-style dropdown). */
  matchTriggerWidth?: boolean;
};

export function Dropdown<T extends string | number>(props: DropdownProps<T>) {
  const {
    options,
    value,
    onChange,
    trigger,
    align = "end",
    contentClassName,
    matchTriggerWidth = false,
  } = props;

  const [open, setOpen] = useState(false);

  const handleSelect = (next: T) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>{trigger}</PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={8}
        className={cn(
          "border border-border bg-popover p-1 text-popover-foreground shadow-float",
          matchTriggerWidth ? "w-(--radix-popover-trigger-width)" : "w-50",
          contentClassName,
        )}
      >
        <div className="flex flex-col max-h-64 overflow-y-auto">
          {options.map((option) => {
            const isActive = value === option.value;

            // Rows highlight with the accent surface; the active one is also
            // bolder and carries aria-current so it is not colour-only.
            const itemClass = isActive
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-popover-foreground hover:bg-accent hover:text-accent-foreground";

            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => handleSelect(option.value)}
                aria-current={isActive ? "true" : undefined}
                className={`cursor-pointer rounded-sm px-3 py-2.5 text-left text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${itemClass}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ===============================  HOW TO USE ===============================
type Sort = "asc" | "desc";

const OPTIONS = [
	{ value: "asc", label: "Ascending" },
	{ value: "desc", label: "Descending" },
];

export function SimpleExample() {
	const [sort, setSort] = useState<Sort>("asc");

	return (
		<div className="p-10">
			<Dropdown
				options={OPTIONS}
				value={sort}
				onChange={setSort}
				trigger={<button className="border px-4 py-2">Sort</button>}
			/>

			<p className="mt-4">Selected: {sort}</p>
		</div>
	);
}

*/
