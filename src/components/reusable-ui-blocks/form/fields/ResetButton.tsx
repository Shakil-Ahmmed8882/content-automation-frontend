"use client";

import { useFormContext } from "react-hook-form";

import { Button, cn } from "../primitives";

/*=========================================================
// ResetButton — clears back to the form's initialValues.
//
// Calls form.reset() from context by default, so it needs no
// ref and no handler. Pass `onReset` only when clearing has
// to do something extra (close a drawer, clear a preview).
=========================================================*/

type TResetButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "type" | "children"
> & {
  label?: string;
  /** Replaces the default form.reset() entirely. */
  onReset?: () => void;
  width?: "full" | "auto";
};

export function ResetButton(props: TResetButtonProps) {
  const {
    label = "Reset",
    onReset,
    width = "auto",
    variant = "outline",
    disabled = false,
    className,
    ...buttonProps
  } = props;

  const form = useFormContext();

  const handleClick = () => {
    if (onReset) return onReset();
    form.reset();
  };

  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled}
      onClick={handleClick}
      className={cn(width === "full" ? "w-full" : "w-auto", className)}
      {...buttonProps}
    >
      {label}
    </Button>
  );
}

ResetButton.displayName = "ResetButton";
