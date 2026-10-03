"use client";

import {
  type Context,
  useContextSelector as useLibContextSelector,
} from "use-context-selector";

/**
 * Typed context selector hook.
 * Reads from the context and extracts a single field via `selector`.
 *
 * Backed by `use-context-selector`, so a consumer only re-renders when the
 * selected value referentially changes — unrelated context updates no longer
 * cause a re-render. The 3-arg signature is preserved so existing callers stay
 * unchanged.
 */
export function useContextSelector<T, R>(
  context: Context<T | null>,
  displayName: string,
  selector: (state: T) => R,
): R {
  return useLibContextSelector(context, (value) => {
    if (value === null) {
      throw new Error(
        `use${displayName}Selector must be used within <${displayName}Provider>`,
      );
    }
    return selector(value);
  });
}
