import type { ReactNode } from "react";

// ── Navigation direction (drives slide animation) ───────────────────────────

export type PageDirection = "forward" | "backward" | "idle";

// ── Per-page payload store (pageId → arbitrary data) ────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PagePayloads = Record<string, any>;

// ── Reducer state ───────────────────────────────────────────────────────────

export type MultipageModalState = {
  history: string[];
  direction: PageDirection;
  payloads: PagePayloads;
};

// ── Reducer actions ─────────────────────────────────────────────────────────

export type MultipageModalAction =
  | { type: "OPEN"; pageId: string; payload?: unknown }
  | {
      type: "GO_TO";
      pageId: string;
      payload?: unknown;
      direction?: PageDirection;
    }
  | { type: "GO_BACK" }
  | { type: "CLOSE" };

// ── Public controls returned by useMultipageModal() ─────────────────────────

export type MultipageModalControls = {
  /** Open the modal on a specific page, optionally carrying a typed payload */
  open: (pageId: string, payload?: unknown) => void;
  /** Navigate to a page, optionally carrying a typed payload and overriding the direction */
  goTo: (
    pageId: string,
    payload?: unknown,
    options?: { direction?: PageDirection },
  ) => void;
  /** Go back to the previous page */
  goBack: () => void;
  /** Close the modal entirely */
  close: () => void;
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** The ID of the currently visible page */
  currentPageId: string | null;
  /** Whether there is a previous page to go back to */
  canGoBack: boolean;
  /** Current animation direction */
  direction: PageDirection;
  /** Retrieve the payload stored for a given pageId */
  getPayload: (pageId: string) => unknown;
};

// ── Props for the <MultipageModal.Page> sub-component ───────────────────────

export type MultipageModalPageProps = {
  /** Unique page identifier */
  id: string;
  /** Label shown on the back button when this page is active */
  backTitle?: string;
  /** Tailwind max-width class (default: "max-w-[610px]") */
  maxWidth?: string;
  /** Set true to hide the close (×) button on this specific page */
  hideCloseButton?: boolean;
  /** Page content */
  children: ReactNode;
};
