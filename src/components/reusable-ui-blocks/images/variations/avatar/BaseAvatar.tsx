"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getInitials } from "@/lib/utils";

import type { AvatarSize, BaseAvatarProps } from "./types/avatar.type";

const SIZE_MAP: Record<AvatarSize, { box: string; text: string }> = {
  xs: { box: "size-6", text: "text-[10px]" },
  sm: { box: "size-8", text: "text-xs" },
  md: { box: "size-10", text: "text-sm" },
  lg: { box: "size-12", text: "text-base" },
  xl: { box: "size-16", text: "text-lg" },
};

/*=========================================================
// BaseAvatar — circular avatar. Falls back to initials
// (or empty) on broken/missing URLs. Optional tooltip
// shows the user's name.
=========================================================*/
export const BaseAvatar = (props: BaseAvatarProps) => {
  const {
    src,
    name,
    alt,
    size = "md",
    isLoading = false,
    className,
    tooltip = false,
    ring = false,
    initialsCount = 1,
  } = props;

  const [broken, setBroken] = useState(false);
  const sizing = SIZE_MAP[size];
  const showInitials = !src || broken;

  const initials = name
    ? getInitials(name).slice(0, initialsCount ?? undefined)
    : "";

  const base = (
    <div
      className={cn(
        "relative inline-flex items-center  justify-center overflow-hidden rounded-full font-proxima-nova shrink-0 select-none",
        "bg-primary/10 text-primary ring-2 ring-primary/20",
        ring && "ring-2 ring-primary",
        sizing.box,
        sizing.text,
        className,
      )}
      aria-label={name || alt}
    >
      {isLoading ? (
        <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
      ) : showInitials ? (
        <span className="font-semibold">{initials}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? undefined}
          alt={alt || name || ""}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
    </div>
  );

  if (!tooltip || !name) return base;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{base}</TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
