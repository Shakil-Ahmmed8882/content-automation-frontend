"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/components/reusable-ui-blocks/utils/scroll/useScrollLock";
import { useEscapeHandler } from "../../utils/events/useEscapeHelper";
import {
  MultipageModalProvider,
  useMultipageModalContextHelper,
} from "./provider/MultipageModalContext";
import type { MultipageModalPageProps } from "./types";
import { pageVariants } from "./utils/animateVariants";
import { getActivePage } from "./utils/getActivePage";

type RootProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialPageId?: string;
  children: ReactNode;
  className?: string;
  /**
   * Hide the close (×) button for the whole modal. Shown by default; pass false
   * explicitly is the same as omitting. A page can still opt out on its own via
   * <MultipageModal.Page hideCloseButton />; either flag hides it.
   */
  hideCloseButton?: boolean;
  /**
   * What a click on the overlay (outside the panel) does.
   *
   * - `"at-root"` (default) — closes only while the user is on the FIRST page.
   *   Once they have navigated deeper (`canGoBack`), a stray click is IGNORED:
   *   throwing away three steps of a wizard because of one mis-click is never
   *   what the user meant. They can still leave via ×, Cancel, or Escape.
   * - `"always"` — closes from any page (the old behaviour).
   * - `"never"` — only the explicit controls close it.
   */
  overlayDismiss?: "at-root" | "always" | "never";
};

// ── Page sub-component (marker — never renders on its own) ──────────────────
export function Page(_props: MultipageModalPageProps) {
  return null;
}

// ── Root component ──────────────────────────────────────────────────────────
function Root(props: RootProps) {
  const {
    open,
    onOpenChange,
    initialPageId,
    children,
    className,
    hideCloseButton,
    overlayDismiss = "at-root",
  } = props;

  const controller = useMultipageModalContextHelper({
    open,
    onOpenChange,
    initialPageId,
  });
  const { isOpen, currentPageId, canGoBack, direction, goBack, close } =
    controller;

  // ── Scroll lock ──
  useScrollLock(isOpen);
  useEscapeHandler(isOpen, canGoBack, goBack, close);

  // Guard the overlay: deep in a flow, an outside click must not wipe out the
  // steps already taken. See `overlayDismiss` on RootProps.
  const canDismissOnOverlay =
    overlayDismiss === "always" || (overlayDismiss === "at-root" && !canGoBack);

  const handleOverlayClick = () => {
    if (!canDismissOnOverlay) return;
    close();
  };

  // ── Find the active page among children ──
  const activePage = getActivePage(children, currentPageId);

  // Non-Page children (e.g. trigger buttons) render in-place inside the
  // provider so they can call goTo/close via useMultipageModalSelector.
  // Only the overlay + panel are portalled to document.body.
  return (
    <MultipageModalProvider value={controller}>
      {/* Render non-Page children in-place (visible on screen) */}
      {children}

      {/* Portal: backdrop + animated panel — only visible when isOpen */}
      {typeof document !== "undefined"
        ? createPortal(
            <>
              {/* Single backdrop */}
              <AnimatePresence>
                {isOpen && activePage && (
                  <motion.div
                    key="multipage-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[99999] bg-black/40"
                    aria-hidden="true"
                  />
                )}
              </AnimatePresence>

              {/* Content layer */}
              <AnimatePresence>
                {isOpen && activePage && (
                  <motion.div
                    key="multipage-modal-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999999] overflow-hidden"
                    onClick={handleOverlayClick}
                  >
                    <div className="scrollbar-hide flex h-full w-full items-center justify-center overflow-y-auto py-6 pointer-events-none">
                      <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                          key={currentPageId}
                          custom={direction}
                          variants={pageVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          tabIndex={-1}
                          className={`${className} relative w-full rounded-2xl p-3 md:py-9 md:px-8  bg-white shadow-2xl pointer-events-auto my-auto outline-none ${activePage.props.maxWidth ?? "max-w-[750px]"}`}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          {/* Close button — shown by default; hidden if either the modal-level
													    or the active page's hideCloseButton is set */}
                          {!hideCloseButton &&
                            !activePage.props.hideCloseButton && (
                              <button
                                type="button"
                                onClick={close}
                                aria-label="Close"
                                className="absolute right-3 top-2.5 z-10 cursor-pointer text-secondary"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="26"
                                  height="26"
                                  viewBox="0 0 26 26"
                                  fill="none"
                                >
                                  <path
                                    d="M17.7075 9.7075L14.4138 13L17.7075 16.2925C17.8004 16.3854 17.8741 16.4957 17.9244 16.6171C17.9747 16.7385 18.0006 16.8686 18.0006 17C18.0006 17.1314 17.9747 17.2615 17.9244 17.3829C17.8741 17.5043 17.8004 17.6146 17.7075 17.7075C17.6146 17.8004 17.5043 17.8741 17.3829 17.9244C17.2615 17.9747 17.1314 18.0006 17 18.0006C16.8686 18.0006 16.7385 17.9747 16.6171 17.9244C16.4957 17.8741 16.3854 17.8004 16.2925 17.7075L13 14.4137L9.70751 17.7075C9.6146 17.8004 9.5043 17.8741 9.3829 17.9244C9.26151 17.9747 9.1314 18.0006 9.00001 18.0006C8.86861 18.0006 8.7385 17.9747 8.61711 17.9244C8.49572 17.8741 8.38542 17.8004 8.29251 17.7075C8.1996 17.6146 8.12589 17.5043 8.07561 17.3829C8.02533 17.2615 7.99945 17.1314 7.99945 17C7.99945 16.8686 8.02533 16.7385 8.07561 16.6171C8.12589 16.4957 8.1996 16.3854 8.29251 16.2925L11.5863 13L8.29251 9.7075C8.10486 9.51986 7.99945 9.26536 7.99945 9C7.99945 8.73464 8.10486 8.48014 8.29251 8.2925C8.48015 8.10486 8.73464 7.99944 9.00001 7.99944C9.26537 7.99944 9.51987 8.10486 9.70751 8.2925L13 11.5863L16.2925 8.2925C16.3854 8.19959 16.4957 8.12589 16.6171 8.07561C16.7385 8.02532 16.8686 7.99944 17 7.99944C17.1314 7.99944 17.2615 8.02532 17.3829 8.07561C17.5043 8.12589 17.6146 8.19959 17.7075 8.2925C17.8004 8.38541 17.8741 8.49571 17.9244 8.6171C17.9747 8.7385 18.0006 8.8686 18.0006 9C18.0006 9.1314 17.9747 9.2615 17.9244 9.3829C17.8741 9.50429 17.8004 9.61459 17.7075 9.7075ZM26 13C26 15.5712 25.2376 18.0846 23.8091 20.2224C22.3807 22.3603 20.3503 24.0265 17.9749 25.0104C15.5995 25.9944 12.9856 26.2518 10.4638 25.7502C7.94208 25.2486 5.6257 24.0105 3.80762 22.1924C1.98953 20.3743 0.751405 18.0579 0.249797 15.5362C-0.251811 13.0144 0.0056327 10.4006 0.989572 8.02512C1.97351 5.64968 3.63975 3.61935 5.77759 2.1909C7.91543 0.762437 10.4288 0 13 0C16.4467 0.00363977 19.7512 1.37445 22.1884 3.81163C24.6256 6.24882 25.9964 9.5533 26 13ZM24 13C24 10.8244 23.3549 8.69767 22.1462 6.88873C20.9375 5.07979 19.2195 3.66989 17.2095 2.83733C15.1995 2.00476 12.9878 1.78692 10.854 2.21136C8.72022 2.6358 6.76021 3.68345 5.22183 5.22183C3.68345 6.7602 2.63581 8.72022 2.21137 10.854C1.78693 12.9878 2.00477 15.1995 2.83733 17.2095C3.66989 19.2195 5.07979 20.9375 6.88873 22.1462C8.69767 23.3549 10.8244 24 13 24C15.9164 23.9967 18.7123 22.8367 20.7745 20.7745C22.8367 18.7123 23.9967 15.9164 24 13Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </button>
                            )}

                          {/* Back button — visible when there is history */}
                          {canGoBack && activePage.props.backTitle && (
                            <button
                              type="button"
                              onClick={goBack}
                              className="!mb-3  z-10 flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium text-[#141414] bg-[#f5f5f5] hover:bg-[#f0f0f0] transition-colors cursor-pointer font-proxima-nova "
                              aria-label="Go back"
                            >
                              <ChevronLeft className="size-3.5" />{" "}
                              <span>{activePage.props.backTitle}</span>
                            </button>
                          )}

                          {activePage.props.children}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>,
            document.body,
          )
        : null}
    </MultipageModalProvider>
  );
}

// ── Compound export ─────────────────────────────────────────────────────────

export const MultipageModal = Object.assign(Root, { Page });

/**
 * ─────────────────────────────────────────────────────────────
 * MultipageModal — Usage Guide (Reusable System)
 * ─────────────────────────────────────────────────────────────
 *
 * This is a "mini-router inside a modal".
 * Each page is identified by a string id.
 * Navigation + state is fully internal (history-based).
 *
 * ─────────────────────────────────────────────────────────────
 * STEP 1 — OPEN THE MODAL
 * ─────────────────────────────────────────────────────────────
 *
 * 1. <MultipageModal open={isOpen} onOpenChange={setIsOpen} />
 *
 * 2. Programmatic open:
 *    controller.open("page-id", payload?)
 *
 * What happens:
 * - Modal becomes visible
 * - History starts with initialPageId OR provided pageId
 *
 * Payload (optional):
 * - You can pass data while opening a page
 * - Stored per page id internally
 *
 * Example:
 *    open("single-schedule-create", { shiftId: 10 })
 *
 * ─────────────────────────────────────────────────────────────
 * STEP 2 — NAVIGATION FUNCTIONS
 * ─────────────────────────────────────────────────────────────
 *
 * All navigation is history-based (like browser routing).
 *
 * 1. goTo(pageId, payload?)
 *    - Push new page into history
 *    - Never closes modal
 *    - Can attach payload for that page
 *
 *    Example:
 *      goTo("shift-running", { abcd: "conflict-123" })
 *
 *
 * 2. goBack()
 *    - Pops last page from history
 *    - If only 1 page left → modal closes
 *
 *    Think: browser back button inside modal
 *
 *
 * 3. close()
 *    - Hard reset
 *    - Clears history completely
 *    - Closes modal
 *
 *
 * 4. open(pageId, payload?)
 *    - Resets modal + opens fresh
 *    - Replaces history root
 *
 * ─────────────────────────────────────────────────────────────
 * STEP 3 — PAYLOAD SYSTEM
 * ─────────────────────────────────────────────────────────────
 *
 * Payload = per-page memory slot.
 *
 * When you do:
 *    goTo("shift-running", { abcd: "X" })
 *
 * Internally:
 * - Stored as:
 *     payloads["shift-running"] = { abcd: "X" }
 *
 * How to read it:
 *
 *    const payload = useMultipageModalPayload("shift-running")
 *
 * Use case:
 * - Passing API context between pages
 * - Avoid prop drilling
 * - Keep modal steps independent
 *
 * Rule:
 * - Payload is tied to PAGE ID, not navigation stack index
 *
 * ─────────────────────────────────────────────────────────────
 * STEP 4 — HOW PAGES WORK
 * ─────────────────────────────────────────────────────────────
 *
 * Pages are NOT components in normal sense.
 * They are "route slots".
 *
 * Required structure:
 *
 *    <MultipageModal>
 *      <MultipageModal.Page id="A" />
 *      <MultipageModal.Page id="B" />
 *    </MultipageModal>
 *
 * Rules:
 * - Page must be DIRECT child of MultipageModal
 * - id must be unique
 * - Only active page renders
 *
 * Internally:
 * - currentPageId = top of history stack
 * - system selects matching Page by id
 *
 * ─────────────────────────────────────────────────────────────
 * THINKING MODEL
 * ─────────────────────────────────────────────────────────────
 *
 * Treat this like:
 *
 *   "React Router inside a modal"
 *
 * but:
 * - local scope
 * - history-based
 * - payload-aware
 * - portal-rendered
 *
 * ─────────────────────────────────────────────────────────────
 * HARD RULES (DON’T BREAK THESE)
 * ─────────────────────────────────────────────────────────────
 *
 * ❌ Don’t wrap <MultipageModal.Page> inside other components
 * ❌ Don’t reuse same page id twice
 * ❌ Don’t treat payload as global state (it is page-scoped)
 *
 * ✔ Always think in:
 *    Page ID + Navigation + Payload
 */
