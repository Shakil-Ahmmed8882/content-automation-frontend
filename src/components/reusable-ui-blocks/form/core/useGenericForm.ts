"use client";

import {
  type FieldValues,
  type Path,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form";

/*=========================================================
// useGenericForm — reach the enclosing form from any child.
//
// For custom controls, conditional sections, or a summary
// panel that needs live values. Anything rendered inside
// <GenericForm> can call this; nothing needs prop-drilling.
=========================================================*/

/** The full react-hook-form instance for the enclosing <GenericForm>. */
export function useGenericForm<T extends FieldValues>() {
  const context = useFormContext<T>();

  if (!context) {
    throw new Error("useGenericForm must be used inside a <GenericForm>.");
  }

  return context;
}

/**
 * Live value of one field, without re-rendering the whole form.
 * Use for conditional UI:
 * `const kind = useGenericFormValue<FormValues>("kind")`.
 */
export function useGenericFormValue<
  T extends FieldValues,
  TName extends Path<T> = Path<T>,
>(name: TName) {
  const { control } = useGenericForm<T>();
  return useWatch({ control, name });
}

/** Validation/submission state (isDirty, isValid, isSubmitting, errors…). */
export function useGenericFormState<T extends FieldValues>() {
  const { control } = useGenericForm<T>();
  return useFormState({ control });
}
