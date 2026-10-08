"use client";

import { type ReactNode, useEffect, useRef } from "react";
import {
  Tabs,
  useTabs,
} from "@/components/reusable-ui-blocks/tabs/TabsProvider";
import type { Tab } from "@/components/reusable-ui-blocks/tabs/tabs.type";
import {
  HorizontalScroller,
  type HorizontalScrollerHandle,
} from "@/components/ui/HorizontalScroller";
import { cn } from "@/lib/utils";

type ScrollableTabsHeaderProps = {
  title?: ReactNode;
  tabs?: Tab[];
  right?: ReactNode;
  className?: string;
};
//====================================
//====================================
//====================================
export function ScrollableTabsHeader(props: ScrollableTabsHeaderProps) {
  const { title = "", tabs = [], right, className } = props;
  const scrollerRef = useRef<HorizontalScrollerHandle>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const { activeTabs } = useTabs();
  const activeId = activeTabs[0];

  useEffect(() => {
    if (!activeId) return;
    const el = itemRefs.current.get(activeId);
    scrollerRef.current?.scrollChildIntoView(el ?? null);
  }, [activeId]);

  // No `max-w-*` here on purpose. This used to carry `max-w-225` (900px) while
  // call sites appended `xl:max-w-275`, so the strip was capped at 900px below
  // `xl` and 1100px above it inside a full-width card — the tab list clipped at
  // ~2/3 of the card with the remaining tabs unreachable.
  //
  // Note the cap could NOT have been fixed by merging classes: `max-w-225` is
  // unprefixed and `xl:max-w-275` is `xl:`-prefixed, so tailwind-merge keeps
  // both (correctly — they apply at different viewport ranges). Deleting the
  // base cap is what fixes it. `cn()` is used below because it is the project
  // convention and it does help a caller override the *same* utility, but it
  // was not the fix here. Width now comes from `HorizontalScroller`'s own
  // `w-full max-w-full min-w-0`.
  return (
    <div
      className={cn(
        "border-b border-border p-8 flex flex-col gap-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[32px] leading-[1.2] font-semibold tracking-[-0.04em] text-foreground">
          {title}
        </h1>
        {right}
      </div>
      <HorizontalScroller ref={scrollerRef} spacing="md" align="center">
        <Tabs className="flex items-center gap-3 flex-nowrap">
          {tabs.map((tab) => (
            <Tabs.Item
              key={tab.id}
              tab={tab}
              ref={(node) => {
                if (node) itemRefs.current.set(tab.id, node);
                else itemRefs.current.delete(tab.id);
              }}
            >
              {tab.value}
            </Tabs.Item>
          ))}
        </Tabs>
      </HorizontalScroller>
    </div>
  );
}
