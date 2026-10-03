// "deadline": "2026-07-10T10:25:41.000000Z",

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

// ── Shared core ──────────────────────────────────────────────────────────────
//
// Every "N left" helper below reads the deadline as UTC and diffs it against
// the current UTC instant in whole minutes. Whole minutes is the single unit
// every other function derives from (days, hours, weeks) — deriving each unit
// independently from raw millisecond math is what causes the off-by-one /
// plus-minus-a-day bugs this file exists to kill.

function utcMinutesUntil(deadline: string): number {
  return dayjs.utc(deadline).diff(dayjs.utc(), "minute");
}

function pluralize(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"} left`;
}

// ── Minutes ──────────────────────────────────────────────────────────────────

/** "45 minutes left" / "1 minute left" / "0 minutes left". Negative → "0 minutes left". */
export function getMinutesLeft(deadline: string): string {
  const minutes = Math.max(0, Math.floor(utcMinutesUntil(deadline)));
  return pluralize(minutes, "minute");
}

// ── Hours ────────────────────────────────────────────────────────────────────

/** "3 hours left" / "1 hour left" / "0 hours left". Floored, never rounded up. */
export function getHoursLeft(deadline: string): string {
  const hours = Math.max(0, Math.floor(utcMinutesUntil(deadline) / 60));
  return pluralize(hours, "hour");
}

/** "3 hours 12 minutes left" — hours floored, remainder minutes floored. */
export function getHoursAndMinutesLeft(deadline: string): string {
  const totalMinutes = Math.max(0, Math.floor(utcMinutesUntil(deadline)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} hour${hours === 1 ? "" : "s"} ${minutes} minute${minutes === 1 ? "" : "s"} left`;
}

// ── Days ─────────────────────────────────────────────────────────────────────

/**
 * "10 days left" / "1 day left" / "0 days left".
 *
 * Whole days remaining, floored — never ceiled and never rounded — so a
 * deadline 23h59m away reads "0 days left", not "1 day left". This is the
 * function to call when a design shows a plain day count with no time
 * component (the case in the screenshot this file was created for).
 */
export function getDaysLeft(deadline: string): string {
  const days = Math.max(0, Math.floor(utcMinutesUntil(deadline) / (60 * 24)));
  return pluralize(days, "day");
}

/** "10 days 4 hours left" — days floored, remainder hours floored. */
export function getDaysAndHoursLeft(deadline: string): string {
  const totalHours = Math.max(0, Math.floor(utcMinutesUntil(deadline) / 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days} day${days === 1 ? "" : "s"} ${hours} hour${hours === 1 ? "" : "s"} left`;
}

// ── Weeks ────────────────────────────────────────────────────────────────────

/** "2 weeks left" / "1 week left" / "0 weeks left". Floored. */
export function getWeeksLeft(deadline: string): string {
  const weeks = Math.max(
    0,
    Math.floor(utcMinutesUntil(deadline) / (60 * 24 * 7)),
  );
  return pluralize(weeks, "week");
}

/** "2 weeks 3 days left" — weeks floored, remainder days floored. */
export function getWeeksAndDaysLeft(deadline: string): string {
  const totalDays = Math.max(
    0,
    Math.floor(utcMinutesUntil(deadline) / (60 * 24)),
  );
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return `${weeks} week${weeks === 1 ? "" : "s"} ${days} day${days === 1 ? "" : "s"} left`;
}

// ── Overdue check ────────────────────────────────────────────────────────────

/** True once the deadline has passed (UTC "now" is after it). */
export function isPastDeadline(deadline: string): boolean {
  return utcMinutesUntil(deadline) < 0;
}
