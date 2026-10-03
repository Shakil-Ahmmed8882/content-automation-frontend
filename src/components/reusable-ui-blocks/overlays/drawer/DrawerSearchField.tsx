"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/*=========================================================
// The search pill used inside a DrawerShell. Pass it as the shell's
// `headerExtra` so it sticks with the header instead of scrolling away
// with the list it filters.
//
// Visually the same control as AssignTaskFormPage's INPUT_CLASS (h-14,
// rounded-full, border-border-extra-light, shadow-xs, primary focus
// ring) — it differs only in using focus-within, since the ring belongs
// to the wrapper rather than the bare input.
=========================================================*/
type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /**
   * Escape hatch for a page whose frame draws this field at a different height
   * or stroke than the h-14 default — merged last, so it wins.
   */
  className?: string;
};

export function DrawerSearchField(props: Props) {
  const { value, onChange, placeholder, className } = props;

  return (
    <div
      className={cn(
        "flex h-14 w-full items-center gap-3 rounded-full border border-border-extra-light px-5 shadow-xs transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/50",
        className,
      )}
    >
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent font-proxima-nova text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground"
      />
      <Search className="size-5 shrink-0 text-muted-foreground" />
    </div>
  );
}
