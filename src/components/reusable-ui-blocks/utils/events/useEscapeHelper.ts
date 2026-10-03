import { useEffect } from "react";

/**
 * params:
 * - isOpen: tells if modal is currently open
 * - canGoBack: tells if user can go back to previous page
 * - goBack: function to move to previous page
 * - close: function to close the modal
 *
 * what we do with it:
 * - when modal is open, listen for keyboard events
 * - if user presses Escape:
 *   - go back if history exists
 *   - otherwise close the modal
 * - remove the listener when modal closes or dependencies change
 *
 * what we return:
 * - nothing (this is a side-effect hook that only manages Escape key behavior)
 */

export function useEscapeHandler(
  isOpen: boolean,
  canGoBack: boolean,
  goBack: () => void,
  close: () => void,
) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      canGoBack ? goBack() : close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, canGoBack, goBack, close]);
}
