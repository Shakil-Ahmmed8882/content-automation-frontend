"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTabs } from "./TabsProvider";
import type { TabsItemProps } from "./tabs.type";

const TAB_BASE_CLASSES =
  "flex items-center gap-2 px-4 py-2 rounded-full border-[1.5px] font-proxima-nova text-base leading-6 whitespace-nowrap shrink-0";

// -------------------------------
// TabsItem component renders one clickable tab.
//
// It is a `role="tab"` inside the `role="tablist"` rendered by <Tabs>:
// the active tab is the only one in the tab order (roving tabindex), the
// arrow keys / Home / End move focus between tabs, and Enter / Space select.
// -------------------------------
export const TabsItem = React.forwardRef<HTMLDivElement, TabsItemProps>(
  (props, ref) => {
    const { tab, onClick, onKeyDown, children, className, ...rest } = props;
    const { activeTabs, setActiveTabs, multiple, valueAs = "id" } = useTabs();

    // figure out tab identifier we care about
    const tabValue = valueAs === "id" ? tab.id : tab.value || tab.id;

    const isActive = activeTabs.includes(tabValue);
    // Roving tabindex: when nothing in the list is active, the first tab must
    // still be reachable, so the group never becomes a keyboard dead end.
    const isTabStop = isActive || activeTabs.length === 0;

    const select = () => {
      // decide new active tabs after click.
      // invariant: at least one tab must remain selected — if a toggle
      // would leave the selection empty, we keep the current state.
      const newTabs = (() => {
        if (multiple) {
          if (tabValue === "all") return ["all"];
          const filtered = activeTabs.includes("all") ? [] : activeTabs;
          if (filtered.includes(tabValue)) {
            const next = filtered.filter((t) => t !== tabValue);
            return next.length === 0 ? activeTabs : next;
          }
          return [...filtered, tabValue];
        }
        // single-select: the only active tab cannot be toggled off
        if (activeTabs.includes(tabValue)) return activeTabs;
        return [tabValue];
      })();

      // nothing changed — skip state churn and the onClick callback
      if (
        newTabs.length === activeTabs.length &&
        newTabs.every((t, i) => t === activeTabs[i])
      ) {
        return;
      }

      // update context and call optional click callback
      setActiveTabs(newTabs);
      onClick?.(newTabs);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
        return;
      }

      const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
      if (!keys.includes(event.key)) return;

      const list = event.currentTarget.closest('[role="tablist"]');
      const tabs = list
        ? Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'))
        : [];
      const index = tabs.indexOf(event.currentTarget);
      if (index === -1) return;

      event.preventDefault();
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
              tabs.length;
      tabs[nextIndex]?.focus();
    };

    return (
      <div
        {...rest}
        ref={ref}
        role="tab"
        aria-selected={isActive}
        tabIndex={isTabStop ? 0 : -1}
        onClick={(event) => {
          event.preventDefault();
          select();
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          TAB_BASE_CLASSES,
          "cursor-pointer text-sm outline-none transition-colors select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-base",
          isActive
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-secondary text-secondary-foreground hover:bg-accent",
          className,
        )}
      >
        {/* optional leading icon — accepts any JSX node */}
        {tab.icon ? (
          <span className="inline-flex items-center justify-center shrink-0">
            {tab.icon}
          </span>
        ) : null}
        {children}
      </div>
    );
  },
);

TabsItem.displayName = "TabsItem";
