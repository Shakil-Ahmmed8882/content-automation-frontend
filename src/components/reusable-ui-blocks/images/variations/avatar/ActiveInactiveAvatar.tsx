"use client";

import { cn } from "@/lib/utils";

import { BaseAvatar } from "./BaseAvatar";
import type {
  ActiveInactiveAvatarProps,
  AvatarSize,
} from "./types/avatar.type";

const DOT_SIZE: Record<AvatarSize, string> = {
  xs: "size-1.5",
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3",
  xl: "size-3.5",
};

/*=========================================================
// ActiveInactiveAvatar — BaseAvatar with a status dot.
// `status="active"` → green, otherwise gray.
=========================================================*/
export const ActiveInactiveAvatar = (props: ActiveInactiveAvatarProps) => {
  const {
    status = "inactive",
    showStatus = true,
    size = "md",
    className,
    ...rest
  } = props;

  const isActive = status === "active";

  return (
    <div className={cn("relative inline-block shrink-0", className)}>
      <BaseAvatar size={size} {...rest} />
      {showStatus && (
        <span
          aria-label={isActive ? "active" : "inactive"}
          className={cn(
            "absolute right-0 bottom-0 rounded-full ring-2 ring-white",
            DOT_SIZE[size],
            isActive ? "bg-emerald-500" : "bg-gray-400",
          )}
        />
      )}
    </div>
  );
};
