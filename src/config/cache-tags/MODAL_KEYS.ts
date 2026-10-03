/*=========================================================
// MODAL_KEYS — page ids for MultipageModal flows.
//
// Each modal flow gets its OWN object (not one shared blob), so
// different pages can name their pages by their own conventions
// and evolve independently. Import the specific one you need and
// drive navigation with goTo(<KEYS>.<page>) instead of hardcoded
// string ids.
=========================================================*/

/** Shared success / error result pages (used by successErrorModalPages()). */
export const SUCCESS_ERROR_MODAL_KEYS = {
  success: "success",
  error: "error",
} as const;

/** Order-timeline "Mark as Complete" flow (manager panel, bid-negotiation). */
export const ORDER_TIMELINE_MODAL_KEYS = {
  ratingModal: "rating-modal",
} as const;

/** "Leave a Rate" flow (vendor profile — select an order, then rate it). */
export const LEAVE_A_RATE_MODAL_KEYS = {
  selectRequest: "leave-a-rate-select-request",
  rateRequest: "leave-a-rate-rate-request",
} as const;

/** "Compare All Bids" flow (open-for-bids request detail — bids comparison table). */
export const COMPARE_ALL_BIDS_MODAL_KEYS = {
  compareAllBids: "compare-all-bids",
} as const;
