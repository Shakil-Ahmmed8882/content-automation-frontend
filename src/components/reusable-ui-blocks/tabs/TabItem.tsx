"use client";

import * as React from "react";
import { useTabs } from "./TabsProvider";
import type { TabsItemProps } from "./tabs.type";

// -------------------------------
// TabsItem component renders one clickable tab button
// -------------------------------
export const TabsItem = React.forwardRef<HTMLDivElement, TabsItemProps>(
  (props, ref) => {
    const TAB_BASE_CLASSES =
      "flex items-center gap-2 px-4 py-2 rounded-full border-[1.5px] font-proxima-nova text-base leading-6 whitespace-nowrap shrink-0";
    const { tab, onClick, children, className, ...rest } = props;
    const { activeTabs, setActiveTabs, multiple, valueAs = "id" } = useTabs();

    // figure out tab identifier we care about
    const tabValue = valueAs === "id" ? tab.id : tab.value || tab.id;

    const isActive = activeTabs.includes(tabValue);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();

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

    return (
      <div
        {...rest}
        ref={ref}
        onClick={handleClick}
        className={`

                ${className}
                ${TAB_BASE_CLASSES}
                text-sm sm:text-base
                cursor-pointer
                ${isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-secondary-foreground hover:bg-accent"}
                `}
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
