"use client";

import { makeSelectorContext } from "@/modules/shared/context/makeSelectorContext";
import { useContextSelector } from "@/modules/shared/context/useContextSelector";
import type { MultipageModalControls } from "../types";
import { useMultipageModal } from "./useMultipageModal";

// ── Context + Provider ──────────────────────────────────────────────────────

export const {
  Context: MultipageModalContext,
  Provider: MultipageModalProvider,
} = makeSelectorContext<MultipageModalControls>("MultipageModal");

// ── Logic hook (called inside Root — never by consumers) ────────────────────

type MultipageModalHelperOptions = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialPageId?: string;
};

export const useMultipageModalContextHelper = (
  options?: MultipageModalHelperOptions,
) => useMultipageModal(options);

// ── Selector hook — use inside any descendant of <MultipageModal> ───────────

export const useMultipageModalSelector = () => ({
  open: useContextSelector(
    MultipageModalContext,
    "MultipageModal",
    (s) => s.open,
  ),
  goTo: useContextSelector(
    MultipageModalContext,
    "MultipageModal",
    (s) => s.goTo,
  ),
  goBack: useContextSelector(
    MultipageModalContext,
    "MultipageModal",
    (s) => s.goBack,
  ),
  close: useContextSelector(
    MultipageModalContext,
    "MultipageModal",
    (s) => s.close,
  ),
  isOpen: useContextSelector(
    MultipageModalContext,
    "MultipageModal",
    (s) => s.isOpen,
  ),
  currentPageId: useContextSelector(
    MultipageModalContext,
    "MultipageModal",
    (s) => s.currentPageId,
  ),
  canGoBack: useContextSelector(
    MultipageModalContext,
    "MultipageModal",
    (s) => s.canGoBack,
  ),
  direction: useContextSelector(
    MultipageModalContext,
    "MultipageModal",
    (s) => s.direction,
  ),
  getPayload: useContextSelector(
    MultipageModalContext,
    "MultipageModal",
    (s) => s.getPayload,
  ),
});

// ── Typed payload hook — call inside the target page component ───────────────
//
// Usage:
//   const payload = useMultipageModalPayload<{ errorCode: string }>("error-page");
//
// Returns the payload cast to T, or undefined if none was passed.

export function useMultipageModalPayload<T>(pageId: string): T | undefined {
  const getPayload = useContextSelector(
    MultipageModalContext,
    "MultipageModal",
    (s) => s.getPayload,
  );
  return getPayload(pageId) as T | undefined;
}
