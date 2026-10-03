"use client";

import { makeSelectorContext } from "@/modules/shared/context/makeSelectorContext";
import { useContextSelector } from "@/modules/shared/context/useContextSelector";
import type { DrawerControls } from "../types";

// ── Context + Provider ──────────────────────────────────────────────────────

export const { Context: DrawerContext, Provider: DrawerProvider } =
  makeSelectorContext<DrawerControls>("Drawer");

// ── Selector hook — call inside any descendant of <Drawer> ──────────────────
//
// Each field is its own subscription, so a component that only reads `close`
// does not re-render when the current page or payloads change.

export const useDrawerSelector = () => ({
  open: useContextSelector(DrawerContext, "Drawer", (s) => s.open),
  goTo: useContextSelector(DrawerContext, "Drawer", (s) => s.goTo),
  goBack: useContextSelector(DrawerContext, "Drawer", (s) => s.goBack),
  close: useContextSelector(DrawerContext, "Drawer", (s) => s.close),
  isOpen: useContextSelector(DrawerContext, "Drawer", (s) => s.isOpen),
  currentPageId: useContextSelector(
    DrawerContext,
    "Drawer",
    (s) => s.currentPageId,
  ),
  canGoBack: useContextSelector(DrawerContext, "Drawer", (s) => s.canGoBack),
  direction: useContextSelector(DrawerContext, "Drawer", (s) => s.direction),
  getPayload: useContextSelector(DrawerContext, "Drawer", (s) => s.getPayload),
});

// ── Typed payload hook — call inside the target page component ──────────────
//
// Usage:
//   const payload = useDrawerPayload<{ vendorId: number }>("edit-vendor");

export function useDrawerPayload<T>(pageId: string): T | undefined {
  const getPayload = useContextSelector(
    DrawerContext,
    "Drawer",
    (s) => s.getPayload,
  );
  return getPayload(pageId) as T | undefined;
}
