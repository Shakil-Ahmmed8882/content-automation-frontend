"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type {
  DrawerAction,
  DrawerControls,
  DrawerPageDirection,
  DrawerState,
} from "../types";

// ── Reducer ─────────────────────────────────────────────────────────────────

const initialState: DrawerState = {
  history: [],
  direction: "idle",
  payloads: {},
};

function reducer(state: DrawerState, action: DrawerAction): DrawerState {
  switch (action.type) {
    case "OPEN":
      return {
        history: [action.pageId],
        direction: "idle",
        payloads:
          action.payload !== undefined
            ? { [action.pageId]: action.payload }
            : {},
      };

    case "GO_TO":
      // Skip if already on this page (prevents duplicate history entries).
      if (state.history[state.history.length - 1] === action.pageId)
        return state;
      return {
        history: [...state.history, action.pageId],
        direction: action.direction ?? "forward",
        payloads:
          action.payload !== undefined
            ? { ...state.payloads, [action.pageId]: action.payload }
            : state.payloads,
      };

    case "GO_BACK":
      if (state.history.length <= 1) return initialState;
      return {
        history: state.history.slice(0, -1),
        direction: "backward",
        payloads: state.payloads,
      };

    case "CLOSE":
      return initialState;
  }
}

// ── Hook ────────────────────────────────────────────────────────────────────

type DrawerOptions = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialPageId?: string;
};

/**
 * Drawer controller. Works in two modes:
 *
 * - Controlled: pass `open` + `onOpenChange`. The parent owns the boolean; this
 *   hook mirrors it into an internal page-history stack so descendants can still
 *   navigate between pages and read payloads.
 * - Uncontrolled: omit `open`. The drawer is open whenever its history is
 *   non-empty; consumers drive it purely through `open()` / `close()`.
 *
 * Either way, the returned controls (open/goTo/goBack/close/getPayload) are the
 * single source any child component uses to drive the drawer — no prop drilling.
 */
export function useDrawer(options?: DrawerOptions): DrawerControls {
  const [state, dispatch] = useReducer(reducer, initialState);

  const isControlled = options?.open !== undefined;
  const isInternallyOpen = state.history.length > 0;
  const isOpen = isControlled ? options!.open! : isInternallyOpen;

  // Track the previous `open` value to react to transitions only.
  const prevOpenRef = useRef<boolean | undefined>(undefined);

  // ── Sync a controlled `open` prop into the internal history ─────────────
  //
  //   false → true : seed `initialPageId` as the history root — but only when
  //                  history is empty. If open()/goTo() already dispatched in
  //                  the same flush (batched before effects), we skip so the
  //                  explicit navigation wins.
  //   true  → false: wipe history so the next open starts clean.
  useEffect(() => {
    const prevOpen = prevOpenRef.current;
    const currOpen = options?.open;
    prevOpenRef.current = currOpen;

    if (!isControlled) return;

    if (prevOpen && !currOpen) {
      dispatch({ type: "CLOSE" });
      return;
    }

    if (
      !prevOpen &&
      currOpen &&
      options?.initialPageId &&
      state.history.length === 0
    ) {
      dispatch({ type: "OPEN", pageId: options.initialPageId });
    }
  }, [
    options?.open,
    options?.initialPageId,
    isControlled,
    state.history.length,
  ]);

  const close = useCallback(() => {
    dispatch({ type: "CLOSE" });
    options?.onOpenChange?.(false);
  }, [options]);

  const open = useCallback(
    (pageId: string, payload?: unknown) => {
      dispatch({ type: "OPEN", pageId, payload });
      options?.onOpenChange?.(true);
    },
    [options],
  );

  const goTo = useCallback(
    (
      pageId: string,
      payload?: unknown,
      opts?: { direction?: DrawerPageDirection },
    ) =>
      dispatch({ type: "GO_TO", pageId, payload, direction: opts?.direction }),
    [],
  );

  const goBack = useCallback(() => {
    if (state.history.length <= 1) {
      close();
    } else {
      dispatch({ type: "GO_BACK" });
    }
  }, [state.history.length, close]);

  // Synchronous fallback: on the first render after `open` flips true the
  // effect has not run yet, so history is still []. Fall back to
  // initialPageId so the active page renders immediately without a flash.
  const currentPageId =
    state.history[state.history.length - 1] ??
    (isOpen && options?.initialPageId ? options.initialPageId : null);

  const canGoBack = state.history.length > 1;

  const getPayload = useCallback(
    (pageId: string) => state.payloads[pageId],
    [state.payloads],
  );

  return useMemo(
    () => ({
      open,
      goTo,
      goBack,
      close,
      isOpen,
      currentPageId,
      canGoBack,
      direction: state.direction,
      getPayload,
    }),
    [
      open,
      goTo,
      goBack,
      close,
      isOpen,
      currentPageId,
      canGoBack,
      state.direction,
      getPayload,
    ],
  );
}
