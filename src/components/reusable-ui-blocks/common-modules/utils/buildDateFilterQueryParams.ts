import {
  type DateRangeFilter,
  getDateRangeFromFilter,
} from "./getDateRangeFromFilter";

export type DateFilterQueryParamsInput = {
  page?: number;
  dateType?: DateRangeFilter;
  customStartDate?: Date;
  customEndDate?: Date;
};

const pad = (n: number) => String(n).padStart(2, "0");

// Local calendar date sent as-is (no UTC conversion) — converting shifted the
// boundary onto the previous day for UTC+ devices (e.g. picking 9-10 returned
// 7/8). Mirrors the preset path (getDateRangeFromFilter), which is also local.
const formatLocalBoundary = (date: Date, boundary: "start" | "end") => {
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  return `${yyyy}-${mm}-${dd} ${boundary === "start" ? "00:00" : "23:59"}`;
};

export function buildDateFilterQueryParams(
  input: DateFilterQueryParamsInput,
): Record<string, string> {
  const { page, dateType, customStartDate, customEndDate } = input;
  const queryParams: Record<string, string> = {};

  if (page != null) {
    queryParams.page = String(page);
  }

  if (dateType && dateType !== "custom_date") {
    const { start_date, end_date } = getDateRangeFromFilter(dateType);
    if (start_date) queryParams.start_date = start_date;
    if (end_date) queryParams.end_date = end_date;
  }

  if (dateType === "custom_date") {
    if (customStartDate)
      queryParams.start_date = formatLocalBoundary(customStartDate, "start");
    if (customEndDate)
      queryParams.end_date = formatLocalBoundary(customEndDate, "end");
  }

  return queryParams;
}
