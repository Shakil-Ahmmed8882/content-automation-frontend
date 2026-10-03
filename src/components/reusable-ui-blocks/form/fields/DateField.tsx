"use client";

import { type FieldValues, useFormContext } from "react-hook-form";

import {
  DateTimePicker,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "../primitives";
import type { TBaseFieldProps } from "../types/form.type";
import { FieldLabel } from "./FieldLabel";

/*=========================================================
// DateField — calendar only, no clock.
//
// Stores a real Date, so the schema is z.date(). Serialize
// at the API boundary (.toISOString()), not in the form.
//
// @example
// <DateField name="dob" label="Date of birth" maxDate={new Date()} />
=========================================================*/

type TDateFieldProps<T extends FieldValues> = TBaseFieldProps<T> & {
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  /** Month/year dropdown span: this year ± yearRange. Default 50. */
  yearRange?: number;
  /** date-fns pattern for the trigger label. Default "PPP". */
  displayFormat?: string;
  triggerClassName?: string;
  /**
   * Classes for the portalled calendar panel. Needed when the field sits
   * inside an overlay that stacks above the popover's default `z-99999` — a
   * Drawer or a MultipageModal both use `z-999999`, so the calendar would
   * open behind them. Pass `z-1000000` there. Same escape hatch SelectField
   * already carries.
   */
  contentClassName?: string;
};

export function DateField<T extends FieldValues>(props: TDateFieldProps<T>) {
  const {
    name,
    label,
    placeholder,
    required = false,
    disabled = false,
    description,
    className,
    minDate,
    maxDate,
    yearRange,
    displayFormat,
    triggerClassName,
    contentClassName,
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
            granularity="day"
            value={field.value}
            onChange={field.onChange}
            disabled={disabled}
            placeholder={placeholder}
            minDate={minDate}
            maxDate={maxDate}
            yearRange={yearRange}
            displayFormat={displayFormat ? { day: displayFormat } : undefined}
            className={triggerClassName}
            contentClassName={contentClassName}
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

DateField.displayName = "DateField";
