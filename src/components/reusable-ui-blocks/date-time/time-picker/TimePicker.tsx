"use client";

import { Clock } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ScrollColumn } from "./ScrollColumn";

// ── Constants ────────────────────────────────────────────────────────────────

const HOURS_12 = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const PERIODS = ["AM", "PM"] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}

function parseTo12(value: string) {
  if (!value) return { h12: "", minute: "", period: "AM" as "AM" | "PM" };
  const [h, m] = value.split(":").map(Number);
  const period: "AM" | "PM" = h < 12 ? "AM" : "PM";
  const h12 = String(h % 12 || 12).padStart(2, "0");
  const minute = String(m ?? 0).padStart(2, "0");
  return { h12, minute, period };
}

function to24(h12: string, minute: string, period: "AM" | "PM"): string {
  let h = parseInt(h12, 10);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Which side of the trigger the dropdown opens toward. Default "down" —
   * pass "up" when the trigger sits near the bottom of its scroll container
   * (e.g. right above a sticky footer) so the panel opens into visible
   * space instead of off-screen. */
  openDirection?: "up" | "down";
};

// ── Component ────────────────────────────────────────────────────────────────

export function TimePicker(props: Props) {
  const { t } = useTranslation();
  const { value, onChange, placeholder, openDirection = "down" } = props;
  const resolvedPlaceholder =
    placeholder ?? t("timePickerSelectTime", "Select time");

  const [open, setOpen] = useState(false);

  const parsed = parseTo12(value);
  const selH = parsed.h12 || "12";
  const selM = parsed.minute || "00";
  const selP = (parsed.period || "AM") as "AM" | "PM";

  function commit(h: string, m: string, p: "AM" | "PM") {
    onChange(to24(h, m, p));
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 px-5 py-3 rounded-[60px] border border-[#f0f0f0] bg-white",
          "text-sm leading-6 text-left transition-colors hover:border-gray-300",
          "focus-visible:outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50",
          !value && "text-[#8f8f8f]",
          open && "border-primary/40",
        )}
      >
        <span>{value ? formatTime(value) : resolvedPlaceholder}</span>
        <Clock className="size-4 text-[#666] shrink-0" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute left-0 z-[101] w-full min-w-[200px] max-w-[240px] rounded-xl border border-[#f0f0f0] bg-white shadow-lg p-3",
              openDirection === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5",
            )}
          >
            <div className="flex gap-2">
              <ScrollColumn
                label={t("timePickerHour", "Hour")}
                items={HOURS_12}
                selected={selH as (typeof HOURS_12)[number]}
                onSelect={(v) => commit(v, selM, selP)}
              />
              <ScrollColumn
                label={t("timePickerMin", "Min")}
                items={MINUTES}
                selected={selM as (typeof MINUTES)[number]}
                onSelect={(v) => commit(selH, v, selP)}
              />
              <ScrollColumn
                label={t("timePickerAmPm", "AM/PM")}
                items={[...PERIODS]}
                selected={selP}
                onSelect={(v) => commit(selH, selM, v as "AM" | "PM")}
                closeOnSelect
                onClose={() => setOpen(false)}
              />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 w-full rounded-lg bg-primary py-3 cursor-pointer text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              {t("done", "Done")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
