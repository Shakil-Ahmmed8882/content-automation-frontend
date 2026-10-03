"use client";

import { useCallback, useEffect, useRef } from "react";

export interface SmoothResizeOptions {
  duration?: number;
  easing?: string;
  fadeContent?: boolean;
}

interface ResizeState {
  rafId: number | null;
  /** The px height currently written to the shell. null = shell is at auto (only at mount) */
  pinnedHeight: number | null;
  transitioning: boolean;
  ro: ResizeObserver | null;
  /** Guards the very first RO callback after mount — we seed silently */
  seeded: boolean;
}

/**
 * Core animation engine for SmoothResizeWrapper.
 *
 * The critical insight that makes both directions animate:
 *
 * After mount we immediately pin the shell to the content's measured px height
 * and KEEP it pinned at all times. We only write `height: auto` momentarily
 * during the very first measurement, then discard it. From that point on the
 * shell is ALWAYS at an explicit px value.
 *
 * Why this matters for GROW (the broken direction):
 *   When content grows, React has already committed the DOM before our
 *   ResizeObserver fires. If the shell is at `height: auto` the browser already
 *   reflowed it to the new height — there is no "from" value, so no animation
 *   occurs. By keeping the shell pinned at the OLD px value, the shell is still
 *   at the previous height when RO fires, giving the browser a real from→to pair
 *   to interpolate.
 *
 * Why shrink already animated (partially):
 *   `overflow: hidden` clipped the growing content, so the shell could animate
 *   down to the new smaller height — there was always a valid "from" value.
 *   But even shrink was broken if the shell had already snapped to auto.
 *
 * Nested wrappers:
 *   A child wrapper expanding triggers its own shell animation, which causes the
 *   child's outer size to grow progressively. The parent's RO fires repeatedly
 *   as the child animates, redirecting the parent's own transition to track the
 *   child's growth — producing a smooth cascade. This works correctly because
 *   both parent and child shells stay pinned.
 */
export function useSmoothResize(options: SmoothResizeOptions = {}) {
  const {
    duration = 260,
    easing = "cubic-bezier(0.4, 0, 0.2, 1)",
    fadeContent = false,
  } = options;

  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const state = useRef<ResizeState>({
    rafId: null,
    pinnedHeight: null,
    transitioning: false,
    ro: null,
    seeded: false,
  });

  const applyTransition = useCallback(
    (targetHeight: number) => {
      const shell = shellRef.current;
      if (!shell) return;

      const st = state.current;

      // Clip SYNCHRONOUSLY the instant a mutation is observed — before the next
      // paint. Otherwise there is a one-frame window where new/taller content is
      // already in the DOM but the shell is still pinned at the old height with
      // visible overflow, so the content flashes at full size and only THEN
      // collapses-and-grows. Pinning height + hiding overflow here keeps the
      // shell locked at its current size until the rAF animates it.
      if (st.pinnedHeight !== null) {
        shell.style.overflow = "hidden";
        shell.style.height = `${st.pinnedHeight}px`;
      }

      // Absorb rapid mutations — keep only the latest target.
      if (st.rafId !== null) {
        cancelAnimationFrame(st.rafId);
        st.rafId = null;
      }

      st.rafId = requestAnimationFrame(() => {
        st.rafId = null;
        const s = shellRef.current;
        if (!s) return;

        // Skip sub-pixel noise.
        if (
          st.pinnedHeight !== null &&
          Math.abs(st.pinnedHeight - targetHeight) < 1
        ) {
          return;
        }

        // If we're mid-transition the shell is already at a px value (pinned).
        // Snapshot the *rendered* height (not the target we wrote) as the new
        // "from", force a style flush, then redirect to the new target.
        if (st.transitioning) {
          const live = s.getBoundingClientRect().height;
          s.style.transition = "none";
          s.style.height = `${live}px`;
          // Flush — makes the browser commit the above before we re-apply transition.
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          s.offsetHeight;
        }

        st.pinnedHeight = targetHeight;
        st.transitioning = true;

        s.style.willChange = "height";
        s.style.overflow = "hidden";
        s.style.transition = `height ${duration}ms ${easing}${fadeContent ? `, opacity ${duration}ms ${easing}` : ""}`;
        s.style.height = `${targetHeight}px`;
      });
    },
    [duration, easing, fadeContent],
  );

  const handleTransitionEnd = useCallback((e: TransitionEvent) => {
    const shell = shellRef.current;
    if (!shell || e.target !== shell || e.propertyName !== "height") return;

    const st = state.current;
    st.transitioning = false;

    // After transition completes we stay at the pinned px value — we do NOT
    // restore `height: auto`. Staying pinned is what enables grow animations.
    //
    // We do clear overflow so child dropdowns/tooltips aren't clipped, and
    // clear will-change to free the GPU layer.
    shell.style.overflow = "";
    shell.style.willChange = "";
    shell.style.transition = "";
    // height remains at the pinned px value intentionally.
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    const content = contentRef.current;
    if (!shell || !content) return;

    const st = state.current;

    // ── Seed ─────────────────────────────────────────────────────────────────
    // Measure the natural height once, pin the shell to it, then never let the
    // shell go back to `auto`. This is the "always pinned" invariant.
    const initialHeight = content.getBoundingClientRect().height;
    st.pinnedHeight = initialHeight;
    shell.style.height = `${initialHeight}px`;
    st.seeded = true;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const measured =
        entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;

      applyTransition(measured);
    });

    ro.observe(content);
    st.ro = ro;

    shell.addEventListener("transitionend", handleTransitionEnd);

    return () => {
      ro.disconnect();
      st.ro = null;
      st.seeded = false;
      shell.removeEventListener("transitionend", handleTransitionEnd);

      if (st.rafId !== null) {
        cancelAnimationFrame(st.rafId);
        st.rafId = null;
      }
    };
  }, [applyTransition, handleTransitionEnd]);

  return { shellRef, contentRef };
}
