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
          "p-0 border border-[#F0F0F0] bg-white shadow-[2px_-1px_9px_rgba(229,226,226,0.25),0px_4px_9px_rgba(229,226,226,0.25)]",
          matchTriggerWidth ? "w-(--radix-popover-trigger-width)" : "w-50",
          contentClassName,
        )}
      >
        <div className="flex flex-col max-h-64 overflow-y-auto">
          {options.map((option) => {
            const isActive = value === option.value;

            // Hover tints with the PRIMARY ramp, matching the primary text
            // colour the row takes — the old "#FEF4F6" was the retired
            // pink brand, so selected and hovered rows disagreed with
            // their own label colour.
            const itemClass = isActive
              ? "bg-primary/10 text-primary font-semibold"
              : "text-[#141414] hover:bg-primary/5 hover:text-primary";

            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`font-proxima-nova text-sm cursor-pointer px-4 py-3 text-left transition-colors ${itemClass}`}
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
