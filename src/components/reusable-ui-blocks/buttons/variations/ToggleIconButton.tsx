import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseButton, type BaseButtonProps } from "../BaseButton";

type ToggleIconButtonProps = Omit<
  BaseButtonProps,
  "onClick" | "children" | "intent" | "shape" | "size"
> & {
  active: boolean;
  onToggle: () => void;
  icon: LucideIcon;
  /** className applied to the icon when active. Default: "fill-primary text-primary" */
  activeClassName?: string;
  /** className applied to the icon when inactive. Default: "text-[#a0a0a0]" */
  inactiveClassName?: string;
  /** className applied to the icon regardless of state. Default: "size-4" */
  iconClassName?: string;
  /** className applied to the button container only when active. Default: "" (no-op) */
  activeContainerClassName?: string;
  /**
   * Stops the click from bubbling/navigating — on by default since every
   * current usage lives inside a clickable card/Link.
   */
  stopPropagation?: boolean;
  "aria-label": string;
};

export function ToggleIconButton({
  active,
  onToggle,
  icon: Icon,
  activeClassName = "fill-primary text-primary",
  inactiveClassName = "text-[#a0a0a0]",
  iconClassName = "size-4",
  activeContainerClassName = "",
  stopPropagation = true,
  className,
  ...props
}: ToggleIconButtonProps) {
  return (
    <BaseButton
      type="button"
      size="icon"
      shape="round"
      intent="default"
      onClick={(e) => {
        if (stopPropagation) {
          e.preventDefault();
          e.stopPropagation();
        }
        onToggle();
      }}
      className={cn(
        "h-auto w-auto p-2 transition-colors hover:bg-[#f5f5f5]",
        className,
        active && activeContainerClassName,
      )}
      {...props}
    >
      <Icon
        className={cn(
          iconClassName,
          active ? activeClassName : inactiveClassName,
        )}
      />
    </BaseButton>
  );
}
