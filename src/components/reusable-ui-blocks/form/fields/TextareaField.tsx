"use client";

import { type LucideIcon, XIcon } from "lucide-react";
import { type FieldValues, useFormContext } from "react-hook-form";

import {
  Button,
  cn,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
  LoadingSpinner,
  Textarea,
} from "../primitives";
import type { TBaseFieldProps } from "../types/form.type";
import { FieldLabel } from "./FieldLabel";

/*=========================================================
// TextareaField — multi-line input.
//
// @example
// <TextareaField name="notes" label="Notes" autoResize rows={4} />
=========================================================*/

type TTextareaFieldProps<T extends FieldValues> = TBaseFieldProps<T> & {
  placeholder?: string;
  rows?: number;
  /** Let the user drag the resize handle. Off by default. */
  resizable?: boolean;
  /** Grow with content (CSS field-sizing, no JS measuring). On by default. */
  autoResize?: boolean;
  action?: () => void;
  Icon?: LucideIcon;
  loading?: boolean;
  inputClassName?: string;
};

export function TextareaField<T extends FieldValues>(
  props: TTextareaFieldProps<T>,
) {
  const {
    name,
    label,
    placeholder,
    rows,
    required = false,
    disabled = false,
    resizable = false,
    autoResize = true,
    description,
    action,
    Icon = XIcon,
    loading = false,
    className,
    inputClassName,
  } = props;

  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel label={label} required={required} />

          <div className="relative flex items-start">
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder={placeholder}
                rows={rows}
                disabled={disabled}
                className={cn(
                  "w-full",
                  autoResize ? "field-sizing-content" : "field-sizing-fixed",
                  !resizable && "resize-none",
                  (action || loading) && "pr-10",
                  inputClassName,
                )}
              />
            </FormControl>

            {loading ? (
              <LoadingSpinner className="absolute top-3 right-3" />
            ) : null}

            {action && !loading ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={action}
                disabled={disabled}
                className="absolute top-1 right-1"
              >
                <Icon className="size-4 text-muted-foreground" />
              </Button>
            ) : null}
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

TextareaField.displayName = "TextareaField";
