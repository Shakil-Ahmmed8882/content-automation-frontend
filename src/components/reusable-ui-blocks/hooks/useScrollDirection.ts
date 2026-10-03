"use client";

import { type RefObject, useEffect, useState } from "react";

type ScrollDirection = "up" | "down";

type Options = {
  /** Ignore direction flips smaller than this many px (anti-jitter). Default 6. */
  threshold?: number;
  /** Always report "up" while within this many px of the top. Default 8. */
  topOffset?: number;
};

type ScrollDirectionState = {
  /** Latest committed scroll direction. Starts "up" so headers show initially. */
  direction: ScrollDirection;
  /** True while the scroller is at (or very near) the top. */
  atTop: boolean;
};

/**
 * Finds the nearest scrollable ancestor of `ref` and reports whether the user is
 * scrolling up or down within it. Built for auto-hiding headers: hide on "down",
 * reveal on "up". Direction is committed only after moving past `threshold` px so
 * small wiggles do not flip it, and it is forced to "up" near the top so the
 * header is always visible when the user is at the start of the list.
 *
 * `ref` should point at any element rendered INSIDE the scroll container (e.g.
 * the sticky bar itself); the hook walks up the DOM to find the scroller, so the
 * caller does not need a direct handle on the drawer's internal scroll element.
 */
export function useScrollDirection(
  ref: RefObject<HTMLElement | null>,
  options?: Options,
): ScrollDirectionState {
  const { threshold = 6, topOffset = 8 } = options ?? {};

  const [state, setState] = useState<ScrollDirectionState>({
    direction: "up",
    atTop: true,
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const scroller = findScrollableAncestor(node);
    if (!scroller) return;

    let lastY = scroller.scrollTop;
    let ticking = false;

    const evaluate = () => {
      ticking = false;
      const currentY = scroller.scrollTop;
      const atTop = currentY <= topOffset;
      const delta = currentY - lastY;

      if (atTop) {
        lastY = currentY;
        setState((prev) =>
          prev.direction === "up" && prev.atTop
            ? prev
            : { direction: "up", atTop: true },
        );
        return;
      }

      if (Math.abs(delta) < threshold) {
        // Not enough movement to commit a flip; only sync the atTop flag.
        setState((prev) =>
          prev.atTop === false ? prev : { ...prev, atTop: false },
        );
        return;
      }

      const direction: ScrollDirection = delta > 0 ? "down" : "up";
      lastY = currentY;
      setState((prev) =>
        prev.direction === direction && prev.atTop === false
          ? prev
          : { direction, atTop: false },
      );
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(evaluate);
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [ref, threshold, topOffset]);

  return state;
}

function findScrollableAncestor(node: HTMLElement): HTMLElement | null {
  // Match by overflow style only — NOT by current scrollHeight, which may not
  // exceed clientHeight yet while a skeleton/empty state is showing. We still
  // want the listener attached so it reacts the moment content grows.
  let current: HTMLElement | null = node.parentElement;
  while (current) {
    const overflowY = getComputedStyle(current).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return current;
    current = current.parentElement;
  }
  return null;
}
