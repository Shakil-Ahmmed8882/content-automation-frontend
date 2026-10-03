"use client";

import type { ReactNode } from "react";
import {
  type ArrayPath,
  type FieldValues,
  type UseFieldArrayReturn,
  useFieldArray,
  useFormContext,
} from "react-hook-form";

/*=========================================================
// FieldArray — repeating groups (line items, phone numbers,
// checklist rows).
//
// Renders nothing itself: it hands you `fields` plus the
// append/remove/move helpers and you lay them out. Index the
// child field names into the array — `items.0.name` — and
// zod validates each row through the same schema.
//
// Always key rows on `field.id`, never the array index; the
// index shifts on remove and React would reuse the wrong
// input state.
=========================================================*/

type TFieldArrayProps<T extends FieldValues> = {
  name: ArrayPath<T>;
  children: (fieldArray: UseFieldArrayReturn<T, ArrayPath<T>>) => ReactNode;
};

export function FieldArray<T extends FieldValues>(props: TFieldArrayProps<T>) {
  const { name, children } = props;

  const { control } = useFormContext<T>();
  const fieldArray = useFieldArray<T, ArrayPath<T>>({ control, name });

  return children(fieldArray);
}

FieldArray.displayName = "FieldArray";
