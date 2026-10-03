"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// ── Props ────────────────────────────────────────────────────────────────────

type Props<T extends string> = {
  label: string;
  items: T[];
  selected: T;
  onSelect: (v: T) => void;
  closeOnSelect?: boolean;
  onClose?: () => void;
};

// ── Component ────────────────────────────────────────────────────────────────

export function ScrollColumn<T extends string>(props: Props<T>) {
  const {
    label,
    items,
    selected,
    onSelect,
    closeOnSelect = false,
    onClose,
  } = props;

  const selectedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = selectedRef.current;
    if (!el) return;

    el.parentElement!.scrollTo({
      top:
        el.offsetTop - el.parentElement!.clientHeight / 2 + el.clientHeight / 2,
      behavior: "smooth",
    });
  }, [selected]);

  return (
    <div className="flex flex-col gap-1 flex-1">
      <span className="text-[10px] font-medium text-[#999] uppercase tracking-wide px-1 text-center">
        {label}
      </span>
      <div className="h-44 overflow-y-auto rounded-lg border border-[#f0f0f0] scrollbar-thin-primary">
        {items.map((item) => {
          const isSelected = item === selected;
          return (
            <button
              key={item}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              onClick={() => {
                onSelect(item);
                if (closeOnSelect && onClose) onClose();
              }}
              className={cn(
                "w-full py-2 text-sm text-center cursor-pointer transition-colors",
                isSelected
                  ? "bg-primary text-white font-semibold"
                  : "text-[#141414] hover:bg-[#f5f5f5]",
              )}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
