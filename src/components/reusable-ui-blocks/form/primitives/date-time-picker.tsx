"use client";

import { format } from "date-fns";
import { enUS, type Locale } from "date-fns/locale";
import { CalendarIcon, ClockIcon } from "lucide-react";
import * as React from "react";
import type { Matcher } from "react-day-picker";

import {
  Button,
  Calendar,
  cn,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./host";

/*=========================================================
// date-time-picker — one popover that covers date-only,
// date+time, and every granularity in between.
//
// Rebuilt on the host's own <Calendar> (react-day-picker v9)
// instead of vendoring a second calendar, so month/year
// dropdowns, theming and RTL come from the host for free.
// Only the keyboard-driven time segment lives here.
=========================================================*/

export type TGranularity = "day" | "hour" | "minute" | "second";
type TPeriod = "AM" | "PM";
type TTimeSegment = "hours" | "12hours" | "minutes" | "seconds";

// ─── time helpers ─────────────────────────────────────────────────────────────

function clampToRange(value: string, min: number, max: number, loop = false) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return "00";

  let next = parsed;
  if (loop) {
    if (next > max) next = min;
    if (next < min) next = max;
  } else {
    if (next > max) next = max;
    if (next < min) next = min;
  }

  return next.toString().padStart(2, "0");
}

const SEGMENT_BOUNDS: Record<TTimeSegment, { min: number; max: number }> = {
  hours: { min: 0, max: 23 },
  "12hours": { min: 1, max: 12 },
  minutes: { min: 0, max: 59 },
  seconds: { min: 0, max: 59 },
};

function to12Hour(hours: number) {
  if (hours === 0 || hours === 12) return 12;
  return hours > 12 ? hours - 12 : hours;
}

function from12Hour(hour: number, period: TPeriod) {
  if (period === "PM") return hour <= 11 ? hour + 12 : hour;
  return hour === 12 ? 0 : hour;
}

function readSegment(date: Date, segment: TTimeSegment) {
  const raw = {
    hours: date.getHours(),
    "12hours": to12Hour(date.getHours()),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  }[segment];

  return raw.toString().padStart(2, "0");
}

function writeSegment(
  date: Date,
  segment: TTimeSegment,
  value: string,
  period: TPeriod,
) {
  const { min, max } = SEGMENT_BOUNDS[segment];
  const parsed = Number.parseInt(clampToRange(value, min, max), 10);
  const next = new Date(date);

  if (segment === "hours") next.setHours(parsed);
  if (segment === "12hours") next.setHours(from12Hour(parsed, period));
  if (segment === "minutes") next.setMinutes(parsed);
  if (segment === "seconds") next.setSeconds(parsed);

  return next;
}

function stepSegment(
  date: Date,
  segment: TTimeSegment,
  step: number,
  period: TPeriod,
) {
  const { min, max } = SEGMENT_BOUNDS[segment];
  const current = Number.parseInt(readSegment(date, segment), 10);
  return writeSegment(
    date,
    segment,
    clampToRange(String(current + step), min, max, true),
    period,
  );
}

// ─── TimeSegmentInput ─────────────────────────────────────────────────────────
// A two-digit cell. Typing replaces digits left-to-right and
// auto-advances; ArrowUp/Down steps with wraparound; Arrow
// Left/Right moves between cells. Never free-text, so the
// value can't desync from the Date.

type TTimeSegmentInputProps = {
  segment: TTimeSegment;
  date: Date;
  period: TPeriod;
  onDateChange: (date: Date) => void;
  onLeftFocus?: () => void;
  onRightFocus?: () => void;
  disabled?: boolean;
  ref?: React.Ref<HTMLInputElement>;
};

function TimeSegmentInput(props: TTimeSegmentInputProps) {
  const {
    segment,
    date,
    period,
    onDateChange,
    onLeftFocus,
    onRightFocus,
    disabled,
    ref,
  } = props;

  const [isSecondDigit, setIsSecondDigit] = React.useState(false);
  const displayValue = readSegment(date, segment);

  React.useEffect(() => {
    if (!isSecondDigit) return;
    const timer = setTimeout(() => setIsSecondDigit(false), 2000);
    return () => clearTimeout(timer);
  }, [isSecondDigit]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab") return;
    event.preventDefault();

    if (event.key === "ArrowRight") return onRightFocus?.();
    if (event.key === "ArrowLeft") return onLeftFocus?.();

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      setIsSecondDigit(false);
      onDateChange(
        stepSegment(date, segment, event.key === "ArrowUp" ? 1 : -1, period),
      );
      return;
    }

    if (event.key >= "0" && event.key <= "9") {
      const next = isSecondDigit
        ? displayValue.slice(1) + event.key
        : `0${event.key}`;
      onDateChange(writeSegment(date, segment, next, period));
      if (isSecondDigit) onRightFocus?.();
      setIsSecondDigit((prev) => !prev);
    }
  };

  return (
    <Input
      ref={ref}
      type="tel"
      inputMode="decimal"
      aria-label={segment}
      disabled={disabled}
      className="w-12 text-center font-mono text-base tabular-nums caret-transparent focus:bg-accent focus:text-accent-foreground [&::-webkit-inner-spin-button]:appearance-none"
      value={displayValue}
      onChange={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
    />
  );
}

// ─── TimePicker ───────────────────────────────────────────────────────────────

type TTimePickerProps = {
  date: Date;
  onChange: (date: Date) => void;
  hourCycle?: 12 | 24;
  granularity?: TGranularity;
  disabled?: boolean;
};

export function TimePicker(props: TTimePickerProps) {
  const {
    date,
    onChange,
    hourCycle = 24,
    granularity = "second",
    disabled,
  } = props;

  const hourRef = React.useRef<HTMLInputElement>(null);
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const secondRef = React.useRef<HTMLInputElement>(null);

  const period: TPeriod = date.getHours() >= 12 ? "PM" : "AM";
  const showMinutes = granularity === "minute" || granularity === "second";
  const showSeconds = granularity === "second";

  return (
    <div className="flex items-center justify-center gap-2">
      <ClockIcon className="size-4 text-muted-foreground" />

      <TimeSegmentInput
        ref={hourRef}
        segment={hourCycle === 24 ? "hours" : "12hours"}
        date={date}
        period={period}
        disabled={disabled}
        onDateChange={onChange}
        onRightFocus={() => minuteRef.current?.focus()}
      />

      {showMinutes ? (
        <>
          <span className="text-muted-foreground">:</span>
          <TimeSegmentInput
            ref={minuteRef}
            segment="minutes"
            date={date}
            period={period}
            disabled={disabled}
            onDateChange={onChange}
            onLeftFocus={() => hourRef.current?.focus()}
            onRightFocus={() => secondRef.current?.focus()}
          />
        </>
      ) : null}

      {showSeconds ? (
        <>
          <span className="text-muted-foreground">:</span>
          <TimeSegmentInput
            ref={secondRef}
            segment="seconds"
            date={date}
            period={period}
            disabled={disabled}
            onDateChange={onChange}
            onLeftFocus={() => minuteRef.current?.focus()}
          />
        </>
      ) : null}

      {hourCycle === 12 ? (
        <Select
          value={period}
          disabled={disabled}
          onValueChange={(next: TPeriod) => {
            const hour12 = to12Hour(date.getHours());
            const shifted = new Date(date);
            shifted.setHours(from12Hour(hour12, next));
            onChange(shifted);
          }}
        >
          <SelectTrigger className="w-17.5" aria-label="AM or PM">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}

// ─── SingleCalendar ───────────────────────────────────────────────────────────
/*
// react-day-picker types DayPickerProps as one large union —
// single / multiple / range mode, each with its own selected
// and onSelect signatures. Type-checking a 13-prop JSX call
// against that union makes tsc allocate ~1M extra types and
// blow past its 2GB default heap, which surfaces as an OOM
// in `next build` and a crashed SSR worker in `next dev`
// ("Jest worker encountered N child process exceptions").
//
// This picker only ever uses single-date mode, so pin exactly
// the props we pass. Runtime is untouched — this IS <Calendar>.
*/
type TSingleCalendarProps = {
  mode: "single";
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
  selected?: Date;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  onSelect?: (date: Date | undefined) => void;
  startMonth?: Date;
  endMonth?: Date;
  disabled?: Matcher | Matcher[];
  locale?: Locale;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  showWeekNumber?: boolean;
  showOutsideDays?: boolean;
  className?: string;
};

const SingleCalendar = Calendar as unknown as (
  props: TSingleCalendarProps,
) => React.ReactElement;

// ─── DateTimePicker ───────────────────────────────────────────────────────────

export type TDateTimePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  /** Show AM/PM instead of a 24h clock. */
  hourCycle?: 12 | 24;
  placeholder?: string;
  /** Month/year dropdown span: this year ± yearRange. Default 50. */
  yearRange?: number;
  /** date-fns format strings. @see https://date-fns.org/docs/format */
  displayFormat?: { hour24?: string; hour12?: string; day?: string };
  /** Smallest unit the picker exposes. `day` hides the clock entirely. */
  granularity?: TGranularity;
  className?: string;
  /**
   * Classes for the PORTALLED calendar panel. Needed when the picker sits
   * inside an overlay that stacks above the popover's default `z-99999` — a
   * Drawer and a MultipageModal both use `z-999999`, so the calendar would
   * open behind them. Pass `z-1000000` there. Mirrors SelectField's
   * `contentClassName`, which exists for exactly this reason.
   */
  contentClassName?: string;
  /** Time-of-day seeded into a freshly picked date. Default 00:00:00. */
  defaultPopupValue?: Date;
  minDate?: Date;
  maxDate?: Date;
  locale?: Locale;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  showWeekNumber?: boolean;
  showOutsideDays?: boolean;
  id?: string;
};

export function DateTimePicker(props: TDateTimePickerProps) {
  const {
    value,
    onChange,
    disabled = false,
    hourCycle = 24,
    placeholder = "Pick a date",
    yearRange = 50,
    displayFormat,
    granularity = "second",
    className,
    contentClassName,
    defaultPopupValue,
    minDate,
    maxDate,
    locale = enUS,
    weekStartsOn,
    showWeekNumber,
    showOutsideDays,
    id,
  } = props;

  const fallback = React.useMemo(
    () => defaultPopupValue ?? new Date(new Date().setHours(0, 0, 0, 0)),
    [defaultPopupValue],
  );

  const [month, setMonth] = React.useState<Date>(value ?? fallback);

  React.useEffect(() => {
    if (value) setMonth(value);
  }, [value]);

  const bounds = React.useMemo(() => {
    const thisYear = new Date().getFullYear();
    return {
      startMonth: minDate ?? new Date(thisYear - yearRange, 0, 1),
      endMonth: maxDate ?? new Date(thisYear + yearRange, 11, 31),
    };
  }, [minDate, maxDate, yearRange]);

  /*
	// Must stay an ARRAY of separate matchers. react-day-picker
	// reads { before, after } on one object as a DateInterval —
	// the days *between* them — which is the exact inverse of
	// "disable anything outside [minDate, maxDate]".
	*/
  const disabledDays = React.useMemo(() => {
    const matchers: Matcher[] = [];
    if (minDate) matchers.push({ before: minDate });
    if (maxDate) matchers.push({ after: maxDate });
    return matchers.length > 0 ? matchers : undefined;
  }, [minDate, maxDate]);

  /*
	// Picking a day must never wipe the time the user already
	// set — carry hours/minutes/seconds over from the current
	// value (or the seed) onto the newly selected day.
	*/
  const handleSelectDay = (day: Date | undefined) => {
    if (!day) return onChange?.(undefined);

    const carrier = value ?? fallback;
    const next = new Date(day);
    next.setHours(
      carrier.getHours(),
      carrier.getMinutes(),
      carrier.getSeconds(),
      0,
    );

    setMonth(next);
    onChange?.(next);
  };

  const handleTimeChange = (next: Date) => {
    setMonth(next);
    onChange?.(next);
  };

  const label = React.useMemo(() => {
    if (!value) return placeholder;

    if (granularity === "day") {
      return format(value, displayFormat?.day ?? "PPP", { locale });
    }

    const withSeconds = granularity === "second" ? ":ss" : "";
    const pattern =
      hourCycle === 24
        ? (displayFormat?.hour24 ?? `PPP HH:mm${withSeconds}`)
        : (displayFormat?.hour12 ?? `PP hh:mm${withSeconds} b`);

    return format(value, pattern, { locale });
  }, [value, placeholder, granularity, hourCycle, displayFormat, locale]);

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={cn("w-auto p-0", contentClassName)}
        align="start"
      >
        <SingleCalendar
          mode="single"
          captionLayout="dropdown"
          selected={value}
          month={month}
          onMonthChange={setMonth}
          onSelect={handleSelectDay}
          startMonth={bounds.startMonth}
          endMonth={bounds.endMonth}
          disabled={disabledDays}
          locale={locale}
          weekStartsOn={weekStartsOn}
          showWeekNumber={showWeekNumber}
          showOutsideDays={showOutsideDays}
        />

        {granularity !== "day" ? (
          <div className="border-t border-border p-3">
            <TimePicker
              date={value ?? month}
              onChange={handleTimeChange}
              hourCycle={hourCycle}
              granularity={granularity}
            />
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
