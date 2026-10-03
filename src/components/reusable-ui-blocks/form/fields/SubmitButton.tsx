"use client";

import { useFormState } from "react-hook-form";

import { Button, cn } from "../primitives";

/*=========================================================
// SubmitButton — submits the enclosing <GenericForm>.
//
// Reads isSubmitting from form state on its own, so an async
// onSubmit disables the button and swaps the label without
// any wiring at the call site. Pass `isLoading` explicitly
// only to reflect something the form doesn't know about
// (a mutation that continues after submit resolves).
=========================================================*/

type TSubmitButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "type" | "children"
> & {
  label?: string;
  loadingLabel?: string;
  /** Overrides the form's own isSubmitting when provided. */
  isLoading?: boolean;
  width?: "full" | "auto";
};

export function SubmitButton(props: TSubmitButtonProps) {
  const {
    label = "Save Changes",
    loadingLabel = "Saving...",
    isLoading,
    width = "full",
    disabled = false,
    className,
    ...buttonProps
  } = props;

  const { isSubmitting } = useFormState();
  const busy = isLoading ?? isSubmitting;

  return (
    <Button
      type="submit"
      disabled={busy || disabled}
      className={cn(width === "full" ? "w-full" : "w-auto", className)}
      {...buttonProps}
    >
      {busy ? loadingLabel : label}
    </Button>
  );
}

SubmitButton.displayName = "SubmitButton";
