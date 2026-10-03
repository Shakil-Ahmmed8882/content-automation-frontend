// ============================================================
// getDateRangeFromFilter
// Shared date-range computation that mirrors the mobile app
// implementation, so web + mobile produce identical
// `start_date` / `end_date` query params for the API.
//
// Output format: "YYYY-MM-DD HH:mm" in UTC.
// `custom_date` returns empty strings — caller supplies its own.
// ============================================================

import type { DictionaryKey } from "@/lib/i18n";

export type DateRangeFilter =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "custom_date"
  | "";

export type DateRange = {
  start_date: string;
  end_date: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

// Formats a `Date` instant as "YYYY-MM-DD HH:mm" in UTC.
// Local-day boundaries are constructed via `new Date(y, m, d, ...)` then
// `.getUTC*()` reads back the equivalent UTC clock components.
const formatUtc = (d: Date): string => {
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
};

const startOfLocalDay = (y: number, m: number, d: number) =>
  new Date(y, m, d, 0, 0, 0, 0);
const endOfLocalDay = (y: number, m: number, d: number) =>
  new Date(y, m, d, 23, 59, 59, 999);

const lastDayOfMonth = (y: number, m: number) =>
  new Date(y, m + 1, 0).getDate();

export function getDateRangeFromFilter(
  filter: DateRangeFilter,
  now: Date = new Date(),
): DateRange {
  let startLocal: Date;
  let endLocal: Date;

  switch (filter) {
    case "today": {
      startLocal = startOfLocalDay(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      endLocal = endOfLocalDay(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      break;
    }
    case "yesterday": {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      startLocal = startOfLocalDay(y.getFullYear(), y.getMonth(), y.getDate());
      endLocal = endOfLocalDay(y.getFullYear(), y.getMonth(), y.getDate());
      break;
    }
    case "this_week": {
      // Monday as first day of week (matches mobile: now.weekday - 1)
      const dow = now.getDay() === 0 ? 7 : now.getDay(); // 1..7 (Mon..Sun)
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dow - 1));
      startLocal = startOfLocalDay(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate(),
      );
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      endLocal = endOfLocalDay(
        sunday.getFullYear(),
        sunday.getMonth(),
        sunday.getDate(),
      );
      break;
    }
    case "last_week": {
      const dow = now.getDay() === 0 ? 7 : now.getDay();
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - (dow + 6));
      startLocal = startOfLocalDay(
        lastMonday.getFullYear(),
        lastMonday.getMonth(),
        lastMonday.getDate(),
      );
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      endLocal = endOfLocalDay(
        lastSunday.getFullYear(),
        lastSunday.getMonth(),
        lastSunday.getDate(),
      );
      break;
    }
    case "this_month": {
      startLocal = startOfLocalDay(now.getFullYear(), now.getMonth(), 1);
      endLocal = endOfLocalDay(
        now.getFullYear(),
        now.getMonth(),
        lastDayOfMonth(now.getFullYear(), now.getMonth()),
      );
      break;
    }
    case "last_month": {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startLocal = startOfLocalDay(prev.getFullYear(), prev.getMonth(), 1);
      endLocal = endOfLocalDay(
        prev.getFullYear(),
        prev.getMonth(),
        lastDayOfMonth(prev.getFullYear(), prev.getMonth()),
      );
      break;
    }
    case "this_year": {
      startLocal = startOfLocalDay(now.getFullYear(), 0, 1);
      endLocal = endOfLocalDay(now.getFullYear(), 11, 31);
      break;
    }
    case "last_year": {
      const ly = now.getFullYear() - 1;
      startLocal = startOfLocalDay(ly, 0, 1);
      endLocal = endOfLocalDay(ly, 11, 31);
      break;
    }
    case "custom_date":
      return { start_date: "", end_date: "" };
    case "":
      return { start_date: "", end_date: "" };
    default:
      startLocal = now;
      endLocal = now;
  }

  return {
    start_date: formatUtc(startLocal),
    end_date: formatUtc(endLocal),
  };
}

export type TDateRange = Extract<
  DateRangeFilter,
  | "today"
  | "this_month"
  | "this_year"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "last_month"
  | "last_year"
  | ""
>;

export const DATE_RANGE_OPTIONS: {
  value: TDateRange;
  labelKey: DictionaryKey;
  label: string;
}[] = [
  { value: "today", labelKey: "today", label: "Today" },
  { value: "this_month", labelKey: "thisMonth", label: "This Month" },
  { value: "this_year", labelKey: "thisYear", label: "This Year" },
  { value: "yesterday", labelKey: "yesterday", label: "Yesterday" },
  { value: "this_week", labelKey: "thisWeek", label: "This Week" },
  { value: "last_week", labelKey: "lastWeek", label: "Last Week" },
  { value: "last_month", labelKey: "lastMonth", label: "Last Month" },
  { value: "last_year", labelKey: "lastYear", label: "Last Year" },
  { value: "", labelKey: "all", label: "All" },
];

export const DATE_RANGE_LABEL: Record<TDateRange, string> = {
  today: "Today",
  this_month: "This Month",
  this_year: "This Year",
  yesterday: "Yesterday",
  this_week: "This Week",
  last_week: "Last Week",
  last_month: "Last Month",
  last_year: "Last Year",
  "": "All",
};

export const DATE_RANGE_LABEL_KEY: Record<TDateRange, DictionaryKey> = {
  today: "today",
  this_month: "thisMonth",
  this_year: "thisYear",
  yesterday: "yesterday",
  this_week: "thisWeek",
  last_week: "lastWeek",
  last_month: "lastMonth",
  last_year: "lastYear",
  "": "all",
};
