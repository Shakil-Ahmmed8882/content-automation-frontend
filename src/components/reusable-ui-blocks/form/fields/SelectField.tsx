"use client";

import { type FieldValues, useFormContext } from "react-hook-form";

import {
  cn,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../primitives";
import type { TBaseFieldProps, TSelectOption } from "../types/form.type";
import { FieldLabel } from "./FieldLabel";

/*=========================================================
// SelectField — single choice from a list.
//
// Values are strings; map ids to strings before passing them
// in and parse on submit (or use z.coerce in the schema).
//
// @example
// <SelectField name="role" label="Role" options={ROLE_OPTIONS} />
=========================================================*/

type TSelectFieldProps<T extends FieldValues> = TBaseFieldProps<T> & {
  options: TSelectOption[];
  placeholder?: string;
  triggerClassName?: string;
  /**
   * Classes for the portalled dropdown panel. Needed when the field sits
   * inside an overlay that stacks above the panel's default `z-99999` — a
   * Drawer or a MultipageModal both use `z-999999`, so the list would open
   * behind them. Pass `z-1000000` there.
   */
  contentClassName?: string;
};

export function SelectField<T extends FieldValues>(
  props: TSelectFieldProps<T>,
) {
  const {
    name,
    label,
    options,
    placeholder = "Select an item",
    required = false,
    disabled = false,
    description,
    className,
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

          <Select
            onValueChange={field.onChange}
            value={field.value ?? ""}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className={cn("w-full", triggerClassName)}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>

            <SelectContent className={contentClassName}>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : null}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}

SelectField.displayName = "SelectField";
