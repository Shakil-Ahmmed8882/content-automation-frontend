"use client";

import { type FieldValues, useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
  Switch,
} from "../primitives";
import type { TBaseFieldProps, TInlineFieldLayout } from "../types/form.type";
import { inlineOrderClass, inlineRowClass } from "../utils/fieldLayout";
import { FieldLabel } from "./FieldLabel";

/*=========================================================
// SwitchField — a boolean that reads as an on/off setting.
//
// Same data shape as CheckboxField; pick by intent. Checkbox
// for "I agree", switch for "Notifications enabled".
//
// @example
// <SwitchField name="isActive" label="Active" longGap />
=========================================================*/

type TSwitchFieldProps<T extends FieldValues> = TBaseFieldProps<T> &
  TInlineFieldLayout;

export function SwitchField<T extends FieldValues>(
  props: TSwitchFieldProps<T>,
) {
  const {
    name,
    label,
    required = false,
    disabled = false,
    description,
    className,
    column,
    longGap,
    reverse,
    gap,
  } = props;

  const { control } = useFormContext<T>();
  const layout = { column, longGap, reverse, gap };
  const order = inlineOrderClass(layout);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <div className={inlineRowClass(layout)}>
            <FormControl>
              <Switch
                className={order.control}
                checked={!!field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                disabled={disabled}
              />
            </FormControl>
            <FieldLabel
              label={label}
              required={required}
              className={order.label}
            />
          </div>

          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : null}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}

SwitchField.displayName = "SwitchField";
