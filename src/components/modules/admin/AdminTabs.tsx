"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { routes } from "@/routes";

const tabs = [
  { label: "Platforms", href: routes.adminPlatforms },
  { label: "Users", href: routes.adminUsers },
  { label: "Audit logs", href: routes.adminAuditLogs },
  { label: "Upcoming features", href: routes.adminUpcomingFeatures },
] as const;

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin sections"
      className="flex gap-1 overflow-x-auto border-b border-border"
    >
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
