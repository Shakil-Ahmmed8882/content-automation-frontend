import type { QueryClient } from "@tanstack/react-query";

export const sessionQueryKey = ["session"] as const;

export function clearSessionCache(client: QueryClient) {
  // Keep the session query so mounted observers receive the guest transition.
  client.setQueryData(sessionQueryKey, null);
  client.removeQueries({
    predicate: (query) => query.queryKey[0] !== sessionQueryKey[0],
  });
  client.getMutationCache().clear();
}
