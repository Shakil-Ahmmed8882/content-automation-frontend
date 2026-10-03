"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import type { DateRangeFilter } from "@/components/reusable-ui-blocks/common-modules/utils/getDateRangeFromFilter";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type DictionaryKey, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Sentinel emitted instead of "custom_date" when the user cancels an already
// active custom range — distinct from re-picking "custom_date" itself, which
// would just reopen custom-date entry without clearing the picked range.
export const CANCEL_CUSTOM_DATE_FILTER = "cancel_custom_date_filter" as const;

export type DateFilterSelection =
  | Exclude<DateRangeFilter, "">
  | typeof CANCEL_CUSTOM_DATE_FILTER;

export type DateFilterPreset = {
  value: Exclude<DateRangeFilter, "">;
  labelKey: DictionaryKey;
  label: string;
};

/**
 * The canonical preset list, in the order mobile ships it.
 *
 * Exported because this popover is no longer the only presentation of it — the
 * RM filter sheet lays the same presets out FLAT as chips. Both read this array
 * so adding/removing/reordering a preset once changes every surface, which is
 * the whole reason it lives here rather than beside each layout.
 */
export const DATE_FILTER_PRESETS: DateFilterPreset[] = [
  { value: "today", labelKey: "today", label: "Today" },
  { value: "yesterday", labelKey: "yesterday", label: "Yesterday" },
  { value: "this_week", labelKey: "thisWeek", label: "This Week" },
  { value: "last_week", labelKey: "lastWeek", label: "Last Week" },
  { value: "this_month", labelKey: "thisMonth", label: "This Month" },
  { value: "last_month", labelKey: "lastMonth", label: "Last Month" },
  { value: "this_year", labelKey: "thisYear", label: "This Year" },
  { value: "last_year", labelKey: "lastYear", label: "Last Year" },
  { value: "custom_date", labelKey: "customDate", label: "Custom Date" },
];

const formatRangeDate = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

export type DateFilterButtonProps = {
  value?: DateRangeFilter;
  onSelect: (value: DateFilterSelection) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  /** When provided, "Custom Date" opens an inline range calendar instead of just reporting the selection. */
  onCustomRangeSelect?: (range: { from: Date; to: Date }) => void;
  buttonColor?: string;
  showSelectedType?: boolean;
  showFilterText?: boolean;
  showBorder?: boolean;
  size?: number;
  className?: string;
  /** Label shown while no preset is active. Defaults to "Select Date". */
  emptyLabel?: string;
  /** Overrides the calendar glyph's size/colour for callers whose frame sizes it differently. */
  iconClassName?: string;
};

/**
 * Reusable, global date-filter trigger: a pill button that opens a popover of
 * date-range presets plus a "Custom Date" entry. Port of the mobile app's
 * CustomDateFilterWidget — same preset set, same active-item Cancel affordance,
 * and the same cancel_custom_date_filter sentinel so callers can tell "cancel
 * the active custom range" apart from "re-open custom date entry".
 */
export function DateFilterButton(props: DateFilterButtonProps) {
  const {
    value,
    onSelect,
    customStartDate,
    customEndDate,
    onCustomRangeSelect,
    buttonColor = "bg-white",
    showSelectedType = true,
    showFilterText = false,
    showBorder = false,
    size = 36,
    className,
    emptyLabel,
    iconClassName = "size-4 text-[#666]",
  } = props;

  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();

  const activePreset = DATE_FILTER_PRESETS.find(
    (preset) => preset.value === value,
  );
  const triggerLabel = showSelectedType
    ? activePreset
      ? t(activePreset.labelKey, activePreset.label)
      : (emptyLabel ?? t("selectDate", "Select Date"))
    : showFilterText
      ? t("filter", "Filter")
      : undefined;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setRange(
        customStartDate
          ? { from: customStartDate, to: customEndDate }
          : undefined,
      );
    } else {
      setShowCalendar(false);
    }
  }

  function selectPreset(preset: DateFilterPreset) {
    if (preset.value === "custom_date" && onCustomRangeSelect) {
      onSelect(preset.value);
      setShowCalendar(true);
      return;
    }
    onSelect(preset.value);
    setOpen(false);
  }

  function cancelPreset(preset: DateFilterPreset) {
    onSelect(
      preset.value === "custom_date" ? CANCEL_CUSTOM_DATE_FILTER : preset.value,
    );
    setOpen(false);
  }

  function applyCustomRange() {
    if (!range?.from || !onCustomRangeSelect) return;
    onCustomRangeSelect({ from: range.from, to: range.to ?? range.from });
    setOpen(false);
    setShowCalendar(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          style={{ height: size, width: showSelectedType ? undefined : size }}
          className={cn(
            "relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-[60px] px-3 font-proxima-nova text-sm font-semibold text-[#666] transition-colors hover:bg-[#F0F0F0]",
            buttonColor,
            showBorder && "border border-[#D0D0D0]",
            className,
          )}
        >
          {triggerLabel ? (
            <span className="leading-normal">{triggerLabel}</span>
          ) : null}
          <CalendarIcon className={iconClassName} />
          {value ? (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-2xl border border-[#F0F0F0] bg-white p-0 shadow-card"
      >
        {showCalendar ? (
          <div className="flex flex-col gap-3 p-3">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={1}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCalendar(false)}
                className="flex-1 cursor-pointer rounded-[60px] border border-[#F0F0F0] py-2 font-proxima-nova text-sm font-semibold text-[#141414] hover:bg-[#FAFAFA]"
              >
                {t("back", "Back")}
              </button>
              <button
                type="button"
                onClick={applyCustomRange}
                disabled={!range?.from}
                className="flex-1 cursor-pointer rounded-[60px] bg-primary py-2 font-proxima-nova text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("apply", "Apply")}
              </button>
            </div>
          </div>
        ) : (
          <ul className="py-2">
            {DATE_FILTER_PRESETS.map((preset) => {
              const isActive = value === preset.value;

              return (
                <li
                  key={preset.value}
                  className="flex items-center justify-between gap-2 px-5 py-2.5 transition-colors hover:bg-[#FAFAFA]"
                >
                  {/* flex-1: the row is the hit area, not just the label's own
									    width — without it the pointer reverts to an arrow over the
									    empty half of a row that still looks clickable. */}
                  <button
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className="flex flex-1 cursor-pointer flex-col items-start text-left"
                  >
                    <span
                      className={cn(
                        "font-proxima-nova text-sm font-semibold",
                        isActive ? "text-primary" : "text-[#141414]",
                      )}
                    >
                      {t(preset.labelKey, preset.label)}
                    </span>

                    {isActive &&
                    preset.value === "custom_date" &&
                    customStartDate &&
                    customEndDate ? (
                      <span className="font-proxima-nova text-xs text-primary">
                        {formatRangeDate(customStartDate)}{" "}
                        {t("dateRangeTo", "to")}{" "}
                        {formatRangeDate(customEndDate)}
                      </span>
                    ) : null}
                  </button>

                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => cancelPreset(preset)}
                      className="shrink-0 cursor-pointer rounded-full px-3 py-1 font-proxima-nova text-xs font-bold text-primary hover:bg-primary-subtle"
                    >
                      {t("cancel", "Cancel")}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
