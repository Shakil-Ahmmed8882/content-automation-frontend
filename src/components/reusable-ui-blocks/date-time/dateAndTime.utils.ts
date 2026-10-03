// "date": "2026-07-10T10:25:41.000000Z",
//
// Inputs are UTC ISO strings from the API. We parse them as UTC
// (dayjs.utc) then convert to the viewer's LOCAL timezone (.local())
// before formatting, so timestamps read correctly wherever the user is.

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

// ── Slash date ─────────────────────────────────────────────────────────────────

/**
 * input:  "2026-12-31T10:25:41.000000Z"
 * output: "31/12/2026"
 */
export function formatSlashDate(date: string): string {
  return dayjs.utc(date).local().format("DD/MM/YYYY");
}

// ── Date with time ─────────────────────────────────────────────────────────────

/**
 * input:  "2026-04-22T10:15:00.000000Z"
 * output: "Apr 22, 2026 · 10:15 AM"
 */
export function formatDateTime(date: string): string {
  return dayjs.utc(date).local().format("MMM D, YYYY · hh:mm A");
}

// ── Long date ──────────────────────────────────────────────────────────────────

/**
 * input:  "2026-03-17T10:25:41.000000Z"
 * output: "17 March, 2026"
 */
export function formatLongDate(date: string): string {
  return dayjs.utc(date).local().format("D MMMM, YYYY");
}

// ── Time range ─────────────────────────────────────────────────────────────────

/**
 * input:  start "2026-04-22T02:50:00.000000Z", end "2026-04-22T03:40:00.000000Z"
 * output: "2:50 AM - 3:40 AM"
 */
export function formatTimeRange(start: string, end: string): string {
  return `${dayjs.utc(start).local().format("h:mm A")} - ${dayjs.utc(end).local().format("h:mm A")}`;
}

// ── Short date ─────────────────────────────────────────────────────────────────

/**
 * input:  "2026-05-05T10:25:41.000000Z"
 * output: "May 5, 2026"
 */
export function formatShortDate(date: string): string {
  return dayjs.utc(date).local().format("MMM D, YYYY");
}

// ── Short date with time ─────────────────────────────────────────────────────────

/**
 * input:  "2026-04-19T10:05:41.000000Z"
 * output: "Apr 19 - 10:05 AM"
 */
export function formatShortDateTime(date: string): string {
  return dayjs.utc(date).local().format("MMM D - hh:mm A");
}

// ── Days left ──────────────────────────────────────────────────────────────────

/**
 * input:  "2026-07-25T10:25:41.000000Z" (compared against current date)
 * output: "4 days left"
 */
export function formatDaysLeft(date: string): string {
  const days = Math.max(
    0,
    Math.floor(dayjs.utc(date).diff(dayjs.utc(), "minute") / (60 * 24)),
  );
  return `${days} day${days === 1 ? "" : "s"} left`;
}
