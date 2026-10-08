"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import {
  type DefaultValues,
  type FieldValues,
  type Mode,
  type Path,
  type Resolver,
  type SubmitErrorHandler,
  type SubmitHandler,
  useForm,
} from "react-hook-form";
import type { ZodType } from "zod";

import { cn, Form } from "../primitives";
import type { GenericFormRef } from "../types/form.type";

/*=========================================================
// GenericForm — the one form root.
//
// Give it a zod schema and initial values; it builds the
// react-hook-form instance, wires zod as the resolver, and
// publishes it through context. Every <XField name="..." />
// underneath finds its own slice by name — no control
// prop-drilling, no per-field wiring.
//
// The schema is the single source of truth: it types the
// values, validates them, and produces the error messages
// the fields render. TValues is inferred from `schema`, so
// `name` props are autocompleted and typos are compile
// errors — never pass the generic by hand.
=========================================================*/

type TGenericFormProps<TValues extends FieldValues> = {
  /** zod schema — types the form, validates it, and supplies error text. */
  schema: ZodType<TValues, FieldValues>;
  /** Values the form starts and resets to. */
  initialValues?: Partial<TValues>;
  /**
   * Re-syncs the form when this object changes. Use for edit
   * screens whose data arrives after mount (a query resolving);
   * `initialValues` alone is read once and would stay empty.
   */
  values?: TValues;
  onSubmit: SubmitHandler<TValues>;
  /** Runs instead of onSubmit when validation fails. */
  onInvalid?: SubmitErrorHandler<TValues>;
  /** When validation runs. Default "onSubmit", then live per field. */
  mode?: Mode;
  /** Clear back to initialValues after a successful submit. */
  resetOnSubmit?: boolean;
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<GenericFormRef<TValues>>;
} & Omit<
  React.ComponentPropsWithoutRef<"form">,
  "onSubmit" | "children" | "className" | "ref"
>;

export function GenericForm<TValues extends FieldValues>(
  props: TGenericFormProps<TValues>,
) {
  const {
    schema,
    initialValues,
    values,
    onSubmit,
    onInvalid,
    mode = "onSubmit",
    resetOnSubmit = false,
    children,
    className,
    ref,
    ...formProps
  } = props;

  const form = useForm<TValues>({
    mode,
    defaultValues: initialValues as DefaultValues<TValues>,
    values,
    resolver: zodResolver(schema) as Resolver<TValues>,
  });

  React.useImperativeHandle(
    ref,
    () => ({
      getValues: form.getValues,
      reset: (next?: Partial<TValues>) => form.reset(next as TValues),
      setValue: (name: keyof TValues, value: TValues[keyof TValues]) =>
        form.setValue(name as Path<TValues>, value),
      formState: form.formState,
      control: form.control,
      form,
    }),
    [form],
  );

  const handleValid: SubmitHandler<TValues> = async (data, event) => {
    await onSubmit(data, event);
    if (resetOnSubmit) form.reset();
  };

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleValid, onInvalid)}
        className={cn("space-y-6", className)}
        {...formProps}
      >
        {children}
      </form>
    </Form>
  );
}

GenericForm.displayName = "GenericForm";
