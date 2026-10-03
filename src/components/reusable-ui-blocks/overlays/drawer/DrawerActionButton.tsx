"use client";

import type { ReactNode } from "react";
import { BaseButton } from "@/components/reusable-ui-blocks/buttons/BaseButton";
import { useTranslation } from "@/lib/i18n";

/*=========================================================
// The primary action in a DrawerShell footer. Built on BaseButton so
// every drawer's CTA is one component, not a per-flow raw <button>.
//
// The className below reconciles BaseButton's cva defaults with the
// drawer spec — kept here, in ONE place, so every drawer inherits it
// rather than each call site re-deriving the same overrides:
//   shrink-0                 base has none; without it the button
//                            shrinks below its label in a flex footer
//   px-8                     size="lg" gives px-6
//   text-base                size="lg" gives text-lg
//   font-semibold            base gives font-medium, intent gives font-normal
//   text-primary-foreground  intent="primary" gives text-white
//   hover:bg-primary-hover   intent="primary" gives hover:bg-primary/90
//   transition-colors        base gives transition-all, which would also
//                            animate layout props
//   disabled:pointer-events-auto  base kills pointer events when disabled,
//                            which suppresses the not-allowed cursor
//
// !leading-6 — NOT leading-6 — is load-bearing. baseButtonVariants' base
// string contains `!leading-0`, and tailwind-merge does NOT treat an
// important utility and its plain counterpart as the same group:
//   twMerge("!leading-0", "leading-6")  -> "!leading-0 leading-6"  (0 wins)
//   twMerge("!leading-0", "!leading-6") -> "!leading-6"            (6 wins)
// A plain `leading-6` here would silently render line-height: 0.
//
// Deliberately NOT overridden, both inherited from BaseButton as a net
// gain over the raw button this replaced: the focus-visible ring (the
// old button had no keyboard-focus affordance at all) and
// active:bg-primary/80 (a pressed state it also lacked).
=========================================================*/
const DRAWER_ACTION_CLASS =
  "shrink-0 px-8 font-proxima-nova text-base !leading-6 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:pointer-events-auto";

type Props = {
  disabled?: boolean;
  label?: string;
  fullWidth?: boolean;
  /** `submit` when the drawer page is wrapped in a real <form>. */
  type?: "button" | "submit";
  onClick?: () => void;
  children?: ReactNode;
};

export function DrawerActionButton(props: Props) {
  const {
    disabled,
    label,
    fullWidth,
    type = "button",
    onClick,
    children,
  } = props;
  const { t } = useTranslation();

  return (
    <BaseButton
      type={type}
      intent="primary"
      shape="round"
      size="lg"
      fullWidth={fullWidth}
      disabled={disabled}
      onClick={onClick}
      className={DRAWER_ACTION_CLASS}
    >
      {children ?? label ?? t("continue", "Continue")}
    </BaseButton>
  );
}
