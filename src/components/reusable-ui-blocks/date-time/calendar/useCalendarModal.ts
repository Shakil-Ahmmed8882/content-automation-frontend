"use client";

import { useCallback, useState } from "react";

/**
 * Owns the open/close state for a CalendarModal and nothing else — the picked
 * date itself is left to the caller (pass it into `selected`/`onSelect` on the
 * modal). Kept this thin so any field, anywhere, can wire up a date picker with
 * one hook call.
 */
export function useCalendarModal() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, open, close, onOpenChange: setIsOpen };
}
