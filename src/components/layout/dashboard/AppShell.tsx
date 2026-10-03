"use client";

import { Menu } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Drawer } from "@/components/reusable-ui-blocks/overlays/drawer/Drawer";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/auth.hook";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";

export function AppShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    const resize = () => {
      if (window.matchMedia("(min-width: 960px)").matches) setOpen(false);
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("resize", resize);
    };
  }, []);
  if (!session.data) return null;
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-card min-[960px]:block">
        <Sidebar user={session.data} />
      </aside>
      <div className="min-w-0 min-[960px]:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="min-[960px]:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
            >
              <Menu />
            </Button>
            <span className="text-sm text-muted-foreground">
              Your workspace
            </span>
          </div>
          <UserMenu user={session.data} />
        </header>
        {offline && (
          <output className="block border-b border-border bg-warning/10 px-4 py-3 text-sm text-warning">
            You're offline. Changes cannot be saved until you reconnect.
          </output>
        )}
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1400px] space-y-8 px-4 py-8 outline-none sm:px-6 lg:px-8"
        >
          {children}
        </main>
      </div>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        initialPageId="navigation"
        side="left"
        width={{ base: "min(320px, calc(100vw - 32px))" }}
        ariaLabel="Main navigation"
      >
        <Drawer.Page id="navigation">
          <div className="h-full pt-12">
            <Sidebar user={session.data} onNavigate={() => setOpen(false)} />
          </div>
        </Drawer.Page>
      </Drawer>
    </div>
  );
}
