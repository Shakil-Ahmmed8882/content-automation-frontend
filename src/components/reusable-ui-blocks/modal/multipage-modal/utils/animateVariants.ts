import type { Variants } from "framer-motion";
import type { PageDirection } from "../types";

/**
 * params:
 * - dir: page navigation direction ("forward" | "backward" | null)
 *
 * what we do with it:
 * - decide how the page enters the screen (from left, right, or neutral)
 * - decide how the page exits the screen in opposite direction
 * - keep center state stable with no movement (x = 0, scale = 1)
 *
 * what we return:
 * - Framer Motion Variants object used to animate page transitions
 * - defines enter, center, and exit animation states
 */

export const pageVariants: Variants = {
  enter: (dir: PageDirection) => ({
    opacity: 0,
    x: dir === "forward" ? 80 : dir === "backward" ? -80 : 0,
    scale: 0.97,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  exit: (dir: PageDirection) => ({
    opacity: 0,
    x: dir === "forward" ? -80 : dir === "backward" ? 80 : 0,
    scale: 0.97,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  }),
};
