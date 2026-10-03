"use client";

import {
  environmentManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: (count, error) =>
          count < 1 &&
          rateLimit.getSnapshot() <= Date.now() &&
          error instanceof ApiError &&
          (error.status === 0 || error.status >= 500),
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false, networkMode: "always" },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (environmentManager.isServer()) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export default function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
