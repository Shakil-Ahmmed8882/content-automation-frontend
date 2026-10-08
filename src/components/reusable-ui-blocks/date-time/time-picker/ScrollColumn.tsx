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
      <span className="eyebrow px-1 text-center text-[10px]">{label}</span>
      <div className="h-44 overflow-y-auto rounded-sm border border-border scrollbar-thin-primary">
        {items.map((item) => {
          const isSelected = item === selected;
          return (
            <button
              key={item}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                onSelect(item);
                if (closeOnSelect && onClose) onClose();
              }}
              className={cn(
                "w-full cursor-pointer py-2 text-center text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60",
                isSelected
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "text-popover-foreground hover:bg-accent",
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
