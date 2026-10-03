import type { Variants } from "framer-motion";
import type { DrawerPageDirection, DrawerSide } from "../types";

/**
 * A single symmetric ease used for BOTH enter and exit so the drawer disappears
 * exactly the way it appears — same curve, same speed, just reversed. A gentle
 * standard ease-in-out (no long decelerating tail) keeps the slide readable end
 * to end without the resting-frame sub-pixel shimmer of a heavy ease-out.
 */
const EASE = [0.4, 0.0, 0.2, 1.0] as const;

/** Default open/close duration in seconds at speed 1. Scale via the `duration` prop. */
export const DRAWER_DEFAULT_DURATION = 0.3;

/**
 * Fixed px slide distances (not %) so travel reads the same at any panel width.
 * Exit slides 100px FURTHER than enter so on close it clearly travels away — but
 * over the SAME duration, so the speed still matches the open (no slow drag). The
 * opacity fade spans the full duration in lock step with the slide in BOTH
 * directions, so open and close stay aligned and balanced — no stall, no snap.
 */
const ENTER_OFFSET = 120; // px
const EXIT_OFFSET = 220; // px — 100 more than enter

function offsetFor(side: DrawerSide, offset: number) {
  return {
    right: { x: offset, y: 0 },
    left: { x: -offset, y: 0 },
    top: { x: 0, y: -offset },
    bottom: { x: 0, y: offset },
  }[side];
}

/**
 * Panel enter/exit. Same `duration` and easing both ways, with opacity spanning
 * the full duration (linear) in lock step with the slide — so appearing and
 * disappearing stay aligned and feel balanced. The only difference is distance:
 * exit travels a bit further so it glides away on close. The panel is
 * pre-promoted to its own GPU layer (translateZ(0) + will-change) so it never
 * promotes/tears-down mid-animation.
 */
export function getPanelVariants(
  side: DrawerSide,
  duration = DRAWER_DEFAULT_DURATION,
): Variants {
  const slideAndFade = {
    x: { duration, ease: EASE },
    y: { duration, ease: EASE },
    opacity: { duration, ease: "linear" as const },
  };

  return {
    // 0.001 (not 0) → the layer is painted/composited on frame 1, avoiding the
    // browser materializing a 0-opacity element on the first non-zero frame.
    hidden: { ...offsetFor(side, ENTER_OFFSET), opacity: 0.001 },
    visible: { x: 0, y: 0, opacity: 1, transition: slideAndFade },
    exit: {
      ...offsetFor(side, EXIT_OFFSET),
      opacity: 0.001,
      transition: slideAndFade,
    },
  };
}

/** Backdrop — opacity only, same timing both ways so it tracks the panel. */
export function getOverlayVariants(
  duration = DRAWER_DEFAULT_DURATION,
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration, ease: "linear" } },
    exit: { opacity: 0, transition: { duration, ease: "linear" } },
  };
}

/**
 * In-panel page transition. Only runs when navigating between pages via
 * goTo/goBack — NOT on first open (the panel slide covers that), so a
 * single-page drawer never double-animates on arrival.
 */
export const drawerPageVariants: Variants = {
  enter: (dir: DrawerPageDirection) => ({
    opacity: 0,
    x: dir === "forward" ? 60 : dir === "backward" ? -60 : 0,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  exit: (dir: DrawerPageDirection) => ({
    opacity: 0,
    x: dir === "forward" ? -60 : dir === "backward" ? 60 : 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  }),
};
