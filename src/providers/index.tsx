"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import QueryProvider from "./query.provider";
import SessionProvider from "./session.provider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider />
      {children}
      <Toaster theme="dark" position="top-right" />
    </QueryProvider>
  );
}
