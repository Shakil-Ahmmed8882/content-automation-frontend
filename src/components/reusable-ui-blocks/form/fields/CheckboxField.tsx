"use client";

import { type FieldValues, useFormContext } from "react-hook-form";

import {
  Checkbox,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "../primitives";
import type { TBaseFieldProps, TInlineFieldLayout } from "../types/form.type";
import { inlineOrderClass, inlineRowClass } from "../utils/fieldLayout";
import { FieldLabel } from "./FieldLabel";

/*=========================================================
// CheckboxField — a single boolean.
//
// For "must be true" (terms acceptance) validate in the
// schema: z.boolean().refine((v) => v, "You must agree").
//
// @example
// <CheckboxField name="tnc" label="I accept the terms" required />
=========================================================*/

type TCheckboxFieldProps<T extends FieldValues> = TBaseFieldProps<T> &
  TInlineFieldLayout & {
    label: string;
  };

export function CheckboxField<T extends FieldValues>(
  props: TCheckboxFieldProps<T>,
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
              <Checkbox
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

CheckboxField.displayName = "CheckboxField";
