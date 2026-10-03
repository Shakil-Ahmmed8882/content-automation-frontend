"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEscapeHandler } from "@/components/reusable-ui-blocks/utils/events/useEscapeHelper";
import { useScrollLock } from "@/components/reusable-ui-blocks/utils/scroll/useScrollLock";
import { cn } from "@/lib/utils";
import { DrawerProvider } from "./provider/DrawerContext";
import { useDrawer } from "./provider/useDrawer";
import type {
  DrawerControls,
  DrawerPageProps,
  DrawerSide,
  DrawerSize,
} from "./types";
import {
  DRAWER_DEFAULT_DURATION,
  drawerPageVariants,
  getOverlayVariants,
  getPanelVariants,
} from "./utils/drawerVariants";
import { getActiveDrawerPage } from "./utils/getActiveDrawerPage";
import { resolveDrawerSize } from "./utils/resolveDrawerSize";

// ── Page sub-component (marker — never renders on its own) ───────────────────

export function Page(_props: DrawerPageProps) {
  return null;
}

// ── Root ──────────────────────────────────────────────────────────────────

type RootProps = {
  /** Controlled open state. Omit to run uncontrolled (driven via open()/close()). */
  open?: boolean;
  /** Called whenever the drawer wants to open/close (esc, overlay, close btn). */
  onOpenChange?: (open: boolean) => void;
  /** Page id shown first when the drawer opens. */
  initialPageId?: string;
  /** An externally-created controller from useDrawer(); overrides open/onOpenChange. */
  controller?: DrawerControls;
  /** Side the panel slides in from. Default "right". */
  side?: DrawerSide;
  /**
   * Panel size along its axis (width for left/right, height for top/bottom).
   *
   * Accepts a preset ("third" | "half" | "twoThird" | "full"), any CSS length
   * ("480px", "40rem", "50%"), OR a responsive object keyed by breakpoint:
   *   width={{ base: "full", md: "half", xl: "third" }}
   *
   * A SINGLE value is mobile-first by default and expands in three bands:
   * "full" on phones, "half" from `md` (tablets and laptops), then the value
   * you passed from `xl` up, where a wide desktop has room for it. Pass a
   * responsive object to opt out and control every breakpoint yourself.
   * Default "half" (→ full on mobile, half from md up).
   */
  width?: DrawerSize;
  /**
   * Backdrop style. Default "dim" — the same flat dark overlay the
   * MultipageModal uses (bg-black/40, no blur). Use "blur" for a frosted
   * backdrop, or pass a className string for full control.
   */
  overlay?: "dim" | "blur" | string;
  /** Click on the backdrop closes the drawer. Default true. */
  closeOnOverlayClick?: boolean;
  /** Open/close duration in seconds. Lower = snappier. Default 0.4. */
  duration?: number;
  /**
   * Whether the drawer owns vertical scroll for its content. Default true —
   * the scrollbar sits at the panel's right edge and covers all content, so
   * children never need their own scroll region (and can use position:sticky).
   */
  scroll?: boolean;
  /** Extra classes for the panel. */
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
};

const OVERLAY_PRESETS: Record<string, string> = {
  dim: "bg-background/70",
  blur: "bg-background/70 backdrop-blur-sm",
};

const SIDE_ANCHOR: Record<DrawerSide, string> = {
  right: "inset-y-0 right-0 h-full",
  left: "inset-y-0 left-0 h-full",
  top: "inset-x-0 top-0 w-full",
  bottom: "inset-x-0 bottom-0 w-full",
};

function Root(props: RootProps) {
  const {
    open,
    onOpenChange,
    initialPageId,
    controller,
    side = "right",
    width = "half",
    overlay = "dim",
    closeOnOverlayClick = true,
    duration = DRAWER_DEFAULT_DURATION,
    scroll = true,
    className,
    ariaLabel = "Drawer",
    children,
  } = props;

  // Prefer an externally-supplied controller; otherwise create one here.
  const internal = useDrawer({ open, onOpenChange, initialPageId });
  const drawer = controller ?? internal;

  const { isOpen, currentPageId, canGoBack, direction, goBack, close } = drawer;

  // Respect the OS "reduce motion" setting — collapse to a near-instant fade.
  const prefersReducedMotion = useReducedMotion();
  const resolvedDuration = prefersReducedMotion ? 0.001 : duration;

  // Panel layer ref so we can release will-change after the enter settles.
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Lock the page scroll WITHOUT hiding the scrollbar (position:fixed +
  // overflow-y:scroll) so the parent layout never shifts when the drawer opens.
  useScrollLock(isOpen);
  useEscapeHandler(isOpen, canGoBack, goBack, close);

  // While closing, `currentPageId` flips to null before the exit animation
  // finishes. Remember the last resolved page so the panel animates away with
  // its content intact instead of blanking mid-transition.
  const resolvedPage = getActiveDrawerPage(children, currentPageId);
  const [lastPage, setLastPage] = useState(resolvedPage);

  useEffect(() => {
    if (resolvedPage) setLastPage(resolvedPage);
  }, [resolvedPage]);

  const activePage = resolvedPage ?? lastPage;

  const isHorizontal = side === "left" || side === "right";

  // Responsive sizing lives in a scoped stylesheet (inline styles can't hold
  // media queries): --drawer-size is set per breakpoint and the panel reads it.
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { className: sizeClassName, css: sizeCss } = resolveDrawerSize(
    width,
    isHorizontal ? "horizontal" : "vertical",
    instanceId,
  );

  const panelVariants = getPanelVariants(side, resolvedDuration);
  const overlayVariants = getOverlayVariants(resolvedDuration);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DrawerProvider value={drawer}>
        {/* Non-Page children (e.g. inline triggers) render in place so they can
			    call the controls via useDrawerSelector. Only the panel is portalled. */}
        {children}

        {typeof document !== "undefined"
          ? createPortal(
              <AnimatePresence>
                {isOpen && activePage && (
                  <motion.div
                    key="drawer-root"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 1 }}
                    className="fixed inset-0 z-999999"
                  >
                    {/* Responsive size rules for this drawer instance */}
                    <style>{sizeCss}</style>

                    {/* Backdrop */}
                    <motion.div
                      variants={overlayVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onClick={closeOnOverlayClick ? close : undefined}
                      className={cn(
                        "absolute inset-0",
                        OVERLAY_PRESETS[overlay] ?? overlay,
                      )}
                      aria-hidden="true"
                    />

                    {/* Panel — slides in from `side`, fading in as it arrives.
									    Pre-promoted to its own GPU layer (translateZ + will-change)
									    so the layer exists from frame 1 and never jitters. */}
                    <Dialog.Content
                      asChild
                      forceMount
                      aria-label={ariaLabel}
                      aria-describedby={undefined}
                      onInteractOutside={(event) => event.preventDefault()}
                      onEscapeKeyDown={(event) => event.preventDefault()}
                      onOpenAutoFocus={() => {
                        previousFocus.current =
                          document.activeElement instanceof HTMLElement
                            ? document.activeElement
                            : null;
                      }}
                      onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        previousFocus.current?.focus();
                      }}
                    >
                      <motion.div
                        ref={panelRef}
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onAnimationComplete={(def) => {
                          if (def === "visible" && panelRef.current) {
                            panelRef.current.style.willChange = "auto";
                          }
                        }}
                        style={{
                          willChange: "transform, opacity",
                          transform: "translateZ(0)",
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                        }}
                        className={cn(
                          "absolute flex flex-col bg-card text-card-foreground shadow-modal outline-none",
                          SIDE_ANCHOR[side],
                          sizeClassName,
                          className,
                        )}
                        role="dialog"
                        aria-modal="true"
                      >
                        <PanelChrome
                          activePage={activePage}
                          canGoBack={canGoBack}
                          goBack={goBack}
                          close={close}
                        />

                        {/* Scroll owner: the drawer's scrollbar lives here, at the panel's
										    right edge, under the fixed chrome. Also the sticky context for
										    any position:sticky children. */}
                        <AnimatePresence mode="wait" custom={direction}>
                          <motion.div
                            key={currentPageId}
                            custom={direction}
                            variants={drawerPageVariants}
                            initial={direction === "idle" ? false : "enter"}
                            animate="center"
                            exit="exit"
                            className={cn(
                              "flex h-full flex-col overflow-x-hidden",
                              scroll
                                ? "overflow-y-auto overscroll-contain scrollbar-thin-primary"
                                : "overflow-hidden",
                            )}
                          >
                            {activePage.props.children}
                          </motion.div>
                        </AnimatePresence>
                      </motion.div>
                    </Dialog.Content>
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body,
            )
          : null}
      </DrawerProvider>
    </Dialog.Root>
  );
}

// ── Panel chrome: back + close buttons ──────────────────────────────────────

type PanelChromeProps = {
  activePage: NonNullable<ReturnType<typeof getActiveDrawerPage>>;
  canGoBack: boolean;
  goBack: () => void;
  close: () => void;
};

function PanelChrome(props: PanelChromeProps) {
  const { activePage, canGoBack, goBack, close } = props;

  return (
    <>
      {canGoBack && activePage.props.backTitle && (
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="absolute left-4 top-4 z-40 flex h-10 items-center gap-1 rounded-sm bg-card px-3 text-xs font-medium text-foreground shadow-card transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
        >
          <ChevronLeft className="size-3.5" />
          <span>{activePage.props.backTitle}</span>
        </button>
      )}

      {!activePage.props.hideCloseButton && (
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 z-40 flex size-10 items-center justify-center rounded-sm bg-card text-foreground shadow-card transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
        >
          <X className="size-5" />
        </button>
      )}
    </>
  );
}

// ── Compound export ─────────────────────────────────────────────────────────

export const Drawer = Object.assign(Root, { Page });
