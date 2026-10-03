import { useEffect, useRef } from "react";

// Matches the modal's own exit transition (backdrop + content layer both use
// `transition={{ duration: 0.2 }}` in MultipageModal.tsx). Unlocking scroll
// must wait for that fade to actually finish, not fire the instant `open`
// flips to false — see the close-path note below.
const EXIT_ANIMATION_MS = 200;

/**
 * params:
 * - open: tells if the modal is currently open
 *
 * what we do with it:
 * - when open, lock the page scroll in place
 * - store current scroll position before locking
 * - freeze body so background cannot move
 * - compensate for the vanished scrollbar with padding, so the layout
 *   doesn't shake — without ever making body itself a scrollable element
 * - on close, wait for the modal's own exit-fade to finish before restoring
 *   scroll, so the background page doesn't snap back underneath a modal
 *   that's still visibly fading out
 * - bring user back to the exact scroll position
 *
 * what we return:
 * - nothing (this hook only controls page scroll behavior)
 */
export const useScrollLock = (open: boolean) => {
  const unlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;

    // Opening always cancels any pending delayed-unlock from a previous
    // close that hasn't fired yet (e.g. rapid close→reopen).
    if (unlockTimeoutRef.current !== null) {
      clearTimeout(unlockTimeoutRef.current);
      unlockTimeoutRef.current = null;
    }

    const scrollY = window.scrollY;
    // Width of the real scrollbar track that's about to disappear once body
    // leaves normal flow. 0 on platforms/browsers with overlay scrollbars.
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    // `position: fixed` takes body out of normal flow, so the page's real
    // scrollbar vanishes and the viewport "gains" its width back — every
    // fixed-width/centered layout shifts sideways by that amount (the
    // "shake"). Compensating with `overflow-y: scroll` on this now-fixed
    // body was wrong: it made body itself an ordinary scrollable box with
    // its own scrollbar, which rendered as a bar floating above the modal
    // instead of behaving like the page's real (native, chrome-level)
    // scrollbar. Reserving the same width via `padding-right` keeps the
    // layout width stable without turning body into a scrollable element.
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    if (scrollbarWidth > 0)
      document.body.style.paddingRight = `${scrollbarWidth}px`;

    const unlock = () => {
      const y = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.paddingRight = "";
      window.scrollTo(0, parseInt(y || "0") * -1);
    };

    return () => {
      // `open` just flipped to false — the modal's own AnimatePresence
      // exit fade is only starting now, still ~200ms from finishing.
      // Unlocking immediately restores the page's real scroll/layout
      // while that fade is still visibly playing on top of it, which
      // reads as a stutter/resistance right at the moment of closing.
      // Deferring by the same duration lets the fade finish first.
      unlockTimeoutRef.current = setTimeout(unlock, EXIT_ANIMATION_MS);
    };
  }, [open]);
};
