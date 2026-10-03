"use client";

import { createContext } from "use-context-selector";

/**
 * Factory that creates a typed Context + a thin Provider wrapper.
 * The Provider simply forwards the `value` prop — all logic lives
 * in the companion `useFeatureNameContextHelper` hook.
 *
 * The context is created via `use-context-selector` so that consumers reading
 * it through `useContextSelector` only re-render when the specific slice they
 * select changes, instead of on every context value update (the default React
 * context behavior). The public shape ({ Context, Provider }) is unchanged, so
 * no consumer of this factory needs to be modified.
 */
export function makeSelectorContext<T>(displayName: string) {
  const Context = createContext<T | null>(null);
  Context.displayName = displayName;

  function Provider({
    value,
    children,
  }: {
    value: T;
    children: React.ReactNode;
  }) {
    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  Provider.displayName = `${displayName}Provider`;

  return { Context, Provider } as const;
}
