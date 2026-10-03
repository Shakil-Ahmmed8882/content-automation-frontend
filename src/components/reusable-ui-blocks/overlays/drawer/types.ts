import type { ReactNode } from "react";

// ── Side the drawer slides in from ──────────────────────────────────────────

export type DrawerSide = "left" | "right" | "top" | "bottom";

// ── Panel size ──────────────────────────────────────────────────────────────

/** A size preset or any raw CSS length ("480px", "40rem", "50%"). */
export type DrawerSizeValue =
  | "third"
  | "half"
  | "twoThird"
  | "full"
  | (string & {});

/** Tailwind's default breakpoints. `base` = mobile-first (no min-width). */
export type DrawerBreakpoint = "base" | "sm" | "md" | "lg" | "xl";

/**
 * Per-breakpoint sizing. Every key is optional; a breakpoint with no value
 * inherits the nearest smaller one. `base` defaults to "full" so small screens
 * get a full-bleed drawer unless told otherwise.
 *
 * Supplying this object OPTS OUT of the single-value full → half → size ramp
 * (see `resolveDrawerSize`), so declare an `md` step yourself if the drawer
 * should still be half-width on a tablet or laptop.
 */
export type DrawerResponsiveSize = Partial<
  Record<DrawerBreakpoint, DrawerSizeValue>
>;

export type DrawerSize = DrawerSizeValue | DrawerResponsiveSize;

// ── Navigation direction (drives the in-panel page slide animation) ─────────

export type DrawerPageDirection = "forward" | "backward" | "idle";

// ── Per-page payload store (pageId → arbitrary data) ────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DrawerPayloads = Record<string, any>;

// ── Reducer state ───────────────────────────────────────────────────────────

export type DrawerState = {
  history: string[];
  direction: DrawerPageDirection;
  payloads: DrawerPayloads;
};

// ── Reducer actions ─────────────────────────────────────────────────────────

export type DrawerAction =
  | { type: "OPEN"; pageId: string; payload?: unknown }
  | {
      type: "GO_TO";
      pageId: string;
      payload?: unknown;
      direction?: DrawerPageDirection;
    }
  | { type: "GO_BACK" }
  | { type: "CLOSE" };

// ── Public controls returned by useDrawer() ─────────────────────────────────

export type DrawerControls = {
  /** Open the drawer on a specific page, optionally carrying a typed payload */
  open: (pageId: string, payload?: unknown) => void;
  /** Navigate to a page, optionally carrying a payload and overriding the direction */
  goTo: (
    pageId: string,
    payload?: unknown,
    options?: { direction?: DrawerPageDirection },
  ) => void;
  /** Go back to the previous page — closes the drawer if it is the only page */
  goBack: () => void;
  /** Close the drawer entirely (clears history) */
  close: () => void;
  /** Whether the drawer is currently open */
  isOpen: boolean;
  /** The id of the currently visible page */
  currentPageId: string | null;
  /** Whether there is a previous page to go back to */
  canGoBack: boolean;
  /** Current in-panel animation direction */
  direction: DrawerPageDirection;
  /** Retrieve the payload stored for a given pageId */
  getPayload: (pageId: string) => unknown;
};

// ── Props for the <Drawer.Page> sub-component ───────────────────────────────

export type DrawerPageProps = {
  /** Unique page identifier */
  id: string;
  /** Label shown on the back button when this page is active (omit to hide it) */
  backTitle?: string;
  /** Hide the close (×) button on this specific page */
  hideCloseButton?: boolean;
  /** Page content */
  children: ReactNode;
};
