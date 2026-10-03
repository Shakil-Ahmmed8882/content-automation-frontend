"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import QueryProvider from "./query.provider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster theme="dark" position="top-right" />
    </QueryProvider>
  );
}
