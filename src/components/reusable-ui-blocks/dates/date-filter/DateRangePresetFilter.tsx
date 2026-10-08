"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useState } from "react";
import {
  type DateRangeFilter,
  getDateRangeFromFilter,
} from "@/components/reusable-ui-blocks/common-modules/utils/getDateRangeFromFilter";
import { useTranslation } from "@/lib/i18n";
import {
  CANCEL_CUSTOM_DATE_FILTER,
  DateFilterButton,
  type DateFilterSelection,
} from ".";

dayjs.extend(utc);

/*=========================================================
// DateFilterButton plus the state machine every caller of it needs: which
// preset is active, the Cancel/re-select-to-clear semantics, and the inline
// custom-range calendar. Callers get a resolved date RANGE instead of a preset
// string they have to expand themselves.
//
// Lives here rather than in a feature module because three headers now want
// exactly this behaviour — the manager Tasks Overview, the housekeeper Task
// Progress panel and the supplies list — and the clear-semantics are subtle
// enough that a per-module copy would drift.
//
// The range is emitted in getDateRangeFromFilter's own "YYYY-MM-DD HH:mm" UTC
// form, which is what the API's `start_date`/`end_date` params expect, so a
// caller can hand it straight to a fetcher.
=========================================================*/
export type PresetDateRange = {
  startDate: string | undefined;
  endDate: string | undefined;
};

/*
 * The app's standard filter pill, lifted from the task list header
 * (HouseKeeperTasksHeaderSection) where the date, Filter and Sort pills all
 * share it. Made the default here so a new caller matches that row without
 * restating the string — the fourth copy of it was where the treatments would
 * have started to drift.
 */
const PILL_CLASS =
  "flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent";

export type PresetDateSelection = {
  preset: DateRangeFilter | undefined;
  customRange?: { from: Date; to: Date };
};

type Props = {
  onChange: (range: PresetDateRange, selection: PresetDateSelection) => void;
  /** Label while no preset is active. Defaults to "Date", as on the task list. */
  emptyLabel?: string;
  /**
   * Preset the pill starts on, for a screen whose spec defines a default
   * range (Staff Management's Overview opens on "today"). Seeds the LABEL
   * only — this component stays uncontrolled and fires no initial onChange,
   * so the caller must seed its own query state from the same preset or the
   * pill and the figures beneath it will disagree.
   *
   * Omit it — as the task and dashboard headers do — to open unfiltered.
   */
  initialPreset?: DateRangeFilter;
  /** Seeds the custom range shown when `initialPreset` is "custom_date". */
  initialCustomRange?: { from: Date; to: Date };
  size?: number;
  /** Defaults to the task list pill's fill. */
  buttonColor?: string;
  /** Replaces the standard pill treatment rather than adding to it. */
  className?: string;
  iconClassName?: string;
};

/**
 * A custom range arrives as two local `Date`s. The API wants the same
 * local-day-expressed-in-UTC form the presets produce, so each end is snapped
 * to its local boundary before the UTC conversion — slicing the dates directly
 * would send midday instants and clip the first and last day of the range.
 *
 * Exported so any other layout of these presets (the RM filter sheet lays them
 * out flat as chips) converts a custom range identically instead of re-deriving
 * the boundary snapping and getting one end off by a day.
 */
export function toCustomDateApiRange(from: Date, to: Date): PresetDateRange {
  return {
    startDate: dayjs(from).startOf("day").utc().format("YYYY-MM-DD HH:mm"),
    endDate: dayjs(to).endOf("day").utc().format("YYYY-MM-DD HH:mm"),
  };
}

export function DateRangePresetFilter(props: Props) {
  const {
    onChange,
    emptyLabel,
    initialPreset,
    initialCustomRange,
    size = 40,
    buttonColor = "bg-background",
    className = PILL_CLASS,
    iconClassName = "size-5 shrink-0",
  } = props;
  const { t } = useTranslation();

  const [preset, setPreset] = useState<DateRangeFilter | undefined>(
    initialPreset,
  );
  const [customRange, setCustomRange] = useState<
    { from: Date; to: Date } | undefined
  >(initialCustomRange);

  function clear() {
    setPreset(undefined);
    setCustomRange(undefined);
    onChange(
      { startDate: undefined, endDate: undefined },
      { preset: undefined },
    );
  }

  function handleSelect(selection: DateFilterSelection) {
    // The popover marks the active row with a Cancel affordance. For a custom
    // range that emits the sentinel; for every other preset it re-emits the
    // preset itself — so an incoming value equal to the active one means
    // "clear", not "re-apply".
    if (selection === CANCEL_CUSTOM_DATE_FILTER) return clear();
    if (selection === preset && selection !== "custom_date") return clear();

    // "Custom Date" only opens the inline calendar; the range arrives after
    // the user picks it, via onCustomRangeSelect.
    if (selection === "custom_date") {
      setPreset("custom_date");
      return;
    }

    const { start_date, end_date } = getDateRangeFromFilter(selection);
    setPreset(selection);
    setCustomRange(undefined);
    onChange(
      { startDate: start_date || undefined, endDate: end_date || undefined },
      { preset: selection },
    );
  }

  function handleCustomRange(range: { from: Date; to: Date }) {
    setPreset("custom_date");
    setCustomRange(range);
    onChange(toCustomDateApiRange(range.from, range.to), {
      preset: "custom_date",
      customRange: range,
    });
  }

  return (
    <DateFilterButton
      value={preset}
      onSelect={handleSelect}
      customStartDate={customRange?.from}
      customEndDate={customRange?.to}
      onCustomRangeSelect={handleCustomRange}
      emptyLabel={emptyLabel ?? t("date", "Date")}
      size={size}
      buttonColor={buttonColor}
      iconClassName={iconClassName}
      className={className}
    />
  );
}
