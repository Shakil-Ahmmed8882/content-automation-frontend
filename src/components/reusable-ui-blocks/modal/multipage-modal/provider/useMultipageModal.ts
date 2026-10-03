"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type {
  MultipageModalAction,
  MultipageModalControls,
  MultipageModalState,
  PageDirection,
} from "../types";

// ── Reducer ─────────────────────────────────────────────────────────────────

const initialState: MultipageModalState = {
  history: [],
  direction: "idle",
  payloads: {},
};

function reducer(
  state: MultipageModalState,
  action: MultipageModalAction,
): MultipageModalState {
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
      // Skip if already on this page (prevents duplicate history entries)
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

type MultipageModalOptions = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialPageId?: string;
};

export function useMultipageModal(
  options?: MultipageModalOptions,
): MultipageModalControls {
  const [state, dispatch] = useReducer(reducer, initialState);

  const isControlled = options?.open !== undefined;
  const isInternallyOpen = state.history.length > 0;
  const isOpen = isControlled ? options!.open! : isInternallyOpen;

  // Track previous `open` value to detect transitions only.
  const prevOpenRef = useRef<boolean | undefined>(undefined);

  // ── Sync controlled `open` prop into internal history ───────────────────
  //
  // Two transitions we care about:
  //   false → true  : seed `initialPageId` as the history root — but ONLY
  //                   when history is empty. If goTo() already dispatched
  //                   GO_TO in the same flush (it's batched before effects),
  //                   history.length > 0 and we skip, leaving navigation intact.
  //   true  → false : wipe history so the next open starts clean.
  //
  // Including state.history.length in deps is intentional and safe here:
  // the OPEN guard (`history.length === 0`) means re-runs caused by GO_TO /
  // GO_BACK never dispatch anything — they are cheap no-ops.
  useEffect(() => {
    const prevOpen = prevOpenRef.current;
    const currOpen = options?.open;
    prevOpenRef.current = currOpen;

    if (!isControlled) return;

    // true → false: wipe history for a clean re-open.
    if (prevOpen && !currOpen) {
      dispatch({ type: "CLOSE" });
      return;
    }

    // false → true (or undefined → true on first mount): seed initialPageId.
    // Guard: skip if history already has entries — goTo() beat the effect.
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

  // goTo: unconditionally navigate to any page. Never closes the modal.
  // Works regardless of current history state.
  const goTo = useCallback(
    (
      pageId: string,
      payload?: unknown,
      options?: { direction?: PageDirection },
    ) =>
      dispatch({
        type: "GO_TO",
        pageId,
        payload,
        direction: options?.direction,
      }),
    [],
  );

  const goBack = useCallback(() => {
    if (state.history.length <= 1) {
      close();
    } else {
      dispatch({ type: "GO_BACK" });
    }
  }, [state.history.length, close]);

  // Synchronous fallback: on the first render after `open` flips true, the
  // useEffect hasn't fired yet so history is still []. Fall back to
  // initialPageId so getActivePage can find the page and render immediately.
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
