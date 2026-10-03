"use client";

import { type FieldValues, useFormContext } from "react-hook-form";

import {
  DateTimePicker,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
  type TGranularity,
} from "../primitives";
import type { TBaseFieldProps } from "../types/form.type";
import { FieldLabel } from "./FieldLabel";

/*=========================================================
// DateTimeField — calendar plus a keyboard-driven clock.
//
// Same storage as DateField (a Date); `granularity` decides
// how far down the clock goes — "minute" is what most forms
// want, "second" is the default only for parity with the
// underlying picker.
//
// @example
// <DateTimeField name="startsAt" label="Starts at" granularity="minute" hourCycle={12} />
=========================================================*/

type TDateTimeFieldProps<T extends FieldValues> = TBaseFieldProps<T> & {
  placeholder?: string;
  granularity?: Exclude<TGranularity, "day">;
  hourCycle?: 12 | 24;
  minDate?: Date;
  maxDate?: Date;
  yearRange?: number;
  displayFormat?: { hour12?: string; hour24?: string };
  triggerClassName?: string;
};

export function DateTimeField<T extends FieldValues>(
  props: TDateTimeFieldProps<T>,
) {
  const {
    name,
    label,
    placeholder,
    granularity = "minute",
    hourCycle = 24,
    required = false,
    disabled = false,
    description,
    className,
    minDate,
    maxDate,
    yearRange,
    displayFormat,
    triggerClassName,
  } = props;

  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel label={label} required={required} />

          <DateTimePicker
            granularity={granularity}
            hourCycle={hourCycle}
            value={field.value}
            onChange={field.onChange}
            disabled={disabled}
            placeholder={placeholder}
            minDate={minDate}
            maxDate={maxDate}
            yearRange={yearRange}
            displayFormat={displayFormat}
            className={triggerClassName}
          />

          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : null}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}

DateTimeField.displayName = "DateTimeField";
