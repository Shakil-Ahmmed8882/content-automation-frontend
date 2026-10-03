"use client";

import { type CSSProperties, type ReactNode, useId } from "react";

import { cn } from "@/lib/utils";

import { useSmoothResize } from "./useSmoothResize";

export interface SmoothResizeWrapperProps {
  children: ReactNode;
  /**
   * Transition duration in ms.
   * @default 260
   */
  duration?: number;
  /**
   * CSS easing function.
   * @default 'cubic-bezier(0.4, 0, 0.2, 1)'  (Material / Linear-style ease)
   */
  easing?: string;
  /**
   * Cross-fade content opacity alongside the height animation.
   * Useful for large height deltas where a sudden content flash would be jarring.
   * @default false
   */
  fadeContent?: boolean;
  /** Extra classes applied to the outer shell element. */
  className?: string;
  /** Extra classes applied to the inner content wrapper. */
  contentClassName?: string;
  /** Inline style overrides for the outer shell. */
  style?: CSSProperties;
}

/**
 * SmoothResizeWrapper
 *
 * A zero-dependency wrapper that intercepts sudden height changes caused by
 * any child content mutation — accordion expand, async data load, conditional
 * render, tab switch, form appearance, list growth — and smoothly animates the
 * layout transition instead of letting it snap.
 *
 * Architecture notes:
 * - Two-div model: `shell` (controlled height) wraps `content` (natural height).
 * - ResizeObserver on `content` fires whenever the inner layout changes.
 * - We write a px height to `shell`, apply a CSS transition, then restore
 *   `height: auto` after `transitionend` so the element stays responsive.
 * - Reduced motion: honours `prefers-reduced-motion` via the `@media` query
 *   below — the animation simply does not run, layout is still correct.
 * - SSR safe: all DOM work is gated inside `useEffect` / event callbacks.
 *
 * Usage:
 * ```tsx
 * <SmoothResizeWrapper>
 *   <ExpandableContent />
 * </SmoothResizeWrapper>
 *
 * <SmoothResizeWrapper duration={200} easing="ease-out" fadeContent>
 *   {tab === 'a' ? <TabA /> : <TabB />}
 * </SmoothResizeWrapper>
 * ```
 */
export function SmoothResizeWrapper({
  children,
  duration = 260,
  easing = "cubic-bezier(0.4, 0, 0.2, 1)",
  fadeContent = false,
  className,
  contentClassName,
  style,
}: SmoothResizeWrapperProps) {
  const { shellRef, contentRef } = useSmoothResize({
    duration,
    easing,
    fadeContent,
  });

  // aria-live region id — lets screen readers know when content changes without
  // re-reading the entire region on every tick.
  const regionId = useId();

  return (
    <div
      ref={shellRef}
      className={cn("smooth-resize-shell", className)}
      style={style}
      // Screen readers: politely announce content changes.
      aria-live="polite"
      aria-atomic="false"
      id={regionId}
    >
      <div
        ref={contentRef}
        className={cn("smooth-resize-content", contentClassName)}
      >
        {children}
      </div>
    </div>
  );
}
