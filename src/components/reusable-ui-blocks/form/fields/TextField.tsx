"use client";

import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { type FieldValues, useFormContext } from "react-hook-form";

import {
  Button,
  cn,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
  Input,
  LoadingSpinner,
} from "../primitives";
import type { TBaseFieldProps } from "../types/form.type";
import { FieldLabel } from "./FieldLabel";

/*=========================================================
// TextField — single-line input.
//
// The pill/54px look below IS this project's base input
// design (Metro InHouse design tokens — see design-system), not a
// generic shadcn default: every TextField ships this look
// out of the box, so callers pass only `name`/`label`/`type`
// and never repeat these classes. Porting this module to a
// different brand means editing the *_CLASS literals here —
// same one-file-touch as `primitives/host.ts` for wiring.
//
// The label/required/message/action *ClassName props still
// exist purely as an escape hatch for the rare page that needs
// to diverge from the base (README.md §8) — passing them
// overrides, never required for the common case.
//
// @example
// <TextField name="email" label="Email" type="email" required />
=========================================================*/

const BASE_INPUT_CLASS =
  "h-14 w-full rounded-[60px] border-[#F0F0F0] px-5 py-4 font-proxima-nova text-base placeholder:text-[#8F8F8F] focus-visible:ring-primary/50";
const BASE_LABEL_CLASS =
  "items-start gap-0.5 font-proxima-nova text-base font-normal leading-6 text-dark";
const BASE_REQUIRED_CLASS = "ml-0 text-primary";
const BASE_MESSAGE_CLASS = "pl-2";
const BASE_ACTION_CLASS =
  "absolute! right-5! top-1/2! h-auto! w-auto! -translate-y-1/2! rounded-none! bg-transparent! p-0! text-primary! hover:bg-transparent! cursor-pointer";

type TTextFieldProps<T extends FieldValues> = TBaseFieldProps<T> & {
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
  placeholder?: string;
  readOnly?: boolean;
  autoComplete?: string;
  /** Trailing icon button — a clear/search/generate affordance, or a password-visibility toggle. */
  action?: () => void;
  icon?: ReactNode;
  /** Spinner inside the input, e.g. while an availability check runs. */
  loading?: boolean;
  /** Escape hatch — overrides the base pill input style. Rarely needed. */
  inputClassName?: string;
  labelClassName?: string;
  requiredClassName?: string;
  messageClassName?: string;
  actionClassName?: string;
};

export function TextField<T extends FieldValues>(props: TTextFieldProps<T>) {
  const {
    name,
    label,
    type = "text",
    placeholder,
    required = false,
    disabled = false,
    readOnly = false,
    autoComplete,
    description,
    action,
    icon = <XIcon className="size-4 text-muted-foreground" />,
    loading = false,
    className,
    inputClassName,
    labelClassName,
    requiredClassName,
    messageClassName,
    actionClassName,
  } = props;

  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel
            label={label}
            required={required}
            className={cn(BASE_LABEL_CLASS, labelClassName)}
            requiredClassName={cn(BASE_REQUIRED_CLASS, requiredClassName)}
          />

          <div className="relative flex items-center">
            <FormControl>
              <Input
                {...field}
                /*
								// A number input hands back a string. Coerce here so
								// z.number() sees a number instead of failing on "42".
								*/
                value={field.value ?? ""}
                onChange={(event) => {
                  if (type !== "number") return field.onChange(event);
                  const raw = event.target.value;
                  field.onChange(raw === "" ? undefined : Number(raw));
                }}
                /*
								// A FOCUSED number input increments/decrements on wheel, so
								// scrolling a page or a drawer over one silently rewrites the
								// value the user already entered — and the change looks like it
								// came from nowhere. Blurring is the fix rather than
								// preventDefault: React registers wheel passively at the root,
								// so preventDefault there is ignored. The wheel then scrolls
								// the page, which is what the gesture meant.
								*/
                onWheel={(event) => {
                  if (type === "number") event.currentTarget.blur();
                }}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                autoComplete={autoComplete}
                className={cn(
                  BASE_INPUT_CLASS,
                  (action || loading) && "pr-14",
                  inputClassName,
                )}
              />
            </FormControl>

            {loading ? <LoadingSpinner className="absolute right-5" /> : null}

            {action && !loading ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={action}
                disabled={disabled}
                className={cn(BASE_ACTION_CLASS, actionClassName)}
              >
                {icon}
              </Button>
            ) : null}
          </div>

          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : null}
          <FormMessage
            className={cn(BASE_MESSAGE_CLASS, "text-xs", messageClassName)}
          />
        </FormItem>
      )}
    />
  );
}

TextField.displayName = "TextField";
