import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/**
 * Stamps the current local time onto a picked calendar date, then converts to UTC.
 * Mirrors the mobile app's payment date convention: a date-only value would
 * otherwise serialize as local midnight, which can roll back a day once converted to UTC.
 * Returns an ISO 8601 UTC string with microsecond precision, matching the
 * backend's own timestamp format (e.g. "2026-07-13T12:20:09.000000Z"),
 * or null if no date is given.
 */
export function stampDateToUtc(
  date: string | Date | undefined | null,
): string | null {
  if (!date) return null;

  const picked = dayjs(date);
  if (!picked.isValid()) return null;

  const now = dayjs();
  const stamped = picked
    .hour(now.hour())
    .minute(now.minute())
    .second(now.second());

  return `${stamped.utc().format("YYYY-MM-DDTHH:mm:ss.SSS")}000Z`;
}
