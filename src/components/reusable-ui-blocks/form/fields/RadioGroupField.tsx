"use client";

import { useId } from "react";
import { type FieldValues, useFormContext } from "react-hook-form";

import {
  cn,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  RadioGroup,
  RadioGroupItem,
} from "../primitives";
import type {
  TBaseFieldProps,
  TInlineFieldLayout,
  TSelectOption,
} from "../types/form.type";
import { inlineOrderClass, inlineRowClass } from "../utils/fieldLayout";
import { FieldLabel } from "./FieldLabel";

/*=========================================================
// RadioGroupField — one choice, all options visible.
//
// Option ids are scoped with useId so two RadioGroupFields
// on the same page can share option values without their
// labels cross-wiring.
//
// @example
// <RadioGroupField name="gender" label="Gender" options={GENDER} orientation="row" />
=========================================================*/

type TRadioGroupFieldProps<T extends FieldValues> = TBaseFieldProps<T> &
  TInlineFieldLayout & {
    options: TSelectOption[];
    /** Stack the options or lay them out in a row. Default "column". */
    orientation?: "row" | "column";
    groupClassName?: string;
  };

export function RadioGroupField<T extends FieldValues>(
  props: TRadioGroupFieldProps<T>,
) {
  const {
    name,
    label,
    options,
    orientation = "column",
    required = false,
    disabled = false,
    description,
    className,
    groupClassName,
    column,
    longGap,
    reverse,
    gap,
  } = props;

  const { control } = useFormContext<T>();
  const scope = useId();
  const layout = { column, longGap, reverse, gap };
  const order = inlineOrderClass(layout);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel label={label} required={required} />

          <FormControl>
            <RadioGroup
              value={field.value ?? ""}
              onValueChange={field.onChange}
              disabled={disabled}
              className={cn(
                "flex gap-3",
                orientation === "row" ? "flex-row flex-wrap" : "flex-col",
                groupClassName,
              )}
            >
              {options.map((option) => {
                const optionId = `${scope}-${option.value}`;

                return (
                  <div key={option.value} className={inlineRowClass(layout)}>
                    <RadioGroupItem
                      id={optionId}
                      value={option.value}
                      disabled={disabled || option.disabled}
                      className={order.control}
                    />
                    <FormLabel
                      htmlFor={optionId}
                      className={cn("font-normal", order.label)}
                    >
                      {option.text}
                    </FormLabel>
                  </div>
                );
              })}
            </RadioGroup>
          </FormControl>

          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : null}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}

RadioGroupField.displayName = "RadioGroupField";
