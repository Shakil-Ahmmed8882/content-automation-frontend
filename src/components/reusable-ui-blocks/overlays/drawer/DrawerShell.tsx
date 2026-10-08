"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*=========================================================
// Shared chrome for every drawer-based flow: a sticky title bar, a
// scrolling body, and a sticky footer holding the primary action.
//
// Lives next to the Drawer primitive rather than inside any one feature
// module, because more than one module consumes it and a feature-local
// home would force a dependency between unrelated features.
//
// NO close button here — the Drawer's own PanelChrome renders it at
// top-right. The header keeps pr-16 clear so the two never overlap.
=========================================================*/
type Props = {
  title: string;
  subtitle?: ReactNode;
  /** Sticks to the header rather than scrolling away (e.g. a search field). */
  headerExtra?: ReactNode;
  /**
   * Collapses the title/subtitle away once the body scrolls, leaving only
   * `headerExtra` pinned. For pages whose header carries a second row — a
   * title plus a search field is otherwise a third of the panel, stuck.
   */
  condenseTitleOnScroll?: boolean;
  /**
   * Moves vertical scroll from the Drawer's panel onto this shell's BODY, so
   * the header and footer sit outside the scrolling element and cannot move
   * at all — a stronger guarantee than `position: sticky`, which still lives
   * inside the scrollport and depends on its containing block behaving.
   *
   * Safe alongside the Drawer's own scroll owner: the shell becomes exactly
   * the panel's height, so the outer container has nothing left to overflow
   * and never shows a second scrollbar.
   */
  ownScroll?: boolean;
  /** Drops the title below the drawer's own floating back button. */
  hasBackButton?: boolean;
  /** Centers the title/subtitle block instead of the default left alignment. */
  centerTitle?: boolean;
  footer?: ReactNode;
  children: ReactNode;
};

export function DrawerShell(props: Props) {
  const {
    title,
    subtitle,
    headerExtra,
    condenseTitleOnScroll,
    ownScroll,
    hasBackButton,
    centerTitle,
    footer,
    children,
  } = props;

  const [isCondensed, setIsCondensed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /*
   * A zero-height sentinel at the very top of the body: once it leaves the
   * viewport the body has scrolled under the header, which is the cue to
   * condense. Watching a sentinel rather than a scroll offset means no
   * hard-coded header height — the trigger stays correct when the title
   * wraps or the subtitle is absent.
   */
  useEffect(() => {
    if (!condenseTitleOnScroll) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) =>
      setIsCondensed(!entries[0].isIntersecting),
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [condenseTitleOnScroll]);

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        ownScroll ? "h-full" : "min-h-full",
      )}
    >
      {/* One sticky block, not two: a second `sticky top-0` sibling would need
			    to know this header's exact height to offset itself. With ownScroll the
			    header is outside the scrolling element, so sticky is not needed. */}
      <header
        className={cn(
          "z-10 flex w-full shrink-0 flex-col border-b border-border-extra-light bg-card px-6 pb-5",
          !ownScroll && "sticky top-0",
          // PanelChrome floats its back button at top-4 / left-4, over the
          // page — without this the title sits underneath it. It keeps
          // floating there when condensed, so the padding stays too.
          hasBackButton ? "pt-16" : "pt-5",
        )}
      >
        {/* grid-rows 1fr→0fr is what makes the collapse animatable: an auto
				    height cannot be transitioned, and a max-height guess would either
				    clip a wrapped title or ease against dead space. */}
        <div
          className={cn(
            "grid",
            condenseTitleOnScroll &&
              "transition-[grid-template-rows,opacity] duration-200",
            isCondensed
              ? "grid-rows-[0fr] opacity-0"
              : "grid-rows-[1fr] opacity-100",
          )}
          aria-hidden={isCondensed}
        >
          <div className="overflow-hidden">
            <div
              className={cn(
                "flex min-w-0 flex-col gap-1 pr-16",
                // Centering within a right-only pr-16 would sit left of true
                // center — mirror it on the left too so the title centers
                // between the floating back and close buttons.
                centerTitle && "items-center pl-16 text-center",
              )}
            >
              <h2 className="min-w-0 font-proxima-nova text-2xl leading-[1.4] font-semibold tracking-[-0.04em] text-foreground">
                {title}
              </h2>
              {subtitle ? (
                <p className="font-proxima-nova text-sm leading-5 text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {headerExtra ? (
          // The gap collapses with the title — kept as a margin rather than the
          // header's `gap-4` so nothing is left behind once the row is gone.
          <div
            className={cn(
              condenseTitleOnScroll && "transition-[margin] duration-200",
              isCondensed ? "mt-0" : "mt-4",
            )}
          >
            {headerExtra}
          </div>
        ) : null}
      </header>

      <div
        className={cn(
          "flex w-full flex-1 flex-col px-6 py-5",
          // min-h-0 is load-bearing: without it a flex-1 child refuses to
          // shrink below its content height and never scrolls.
          ownScroll &&
            "min-h-0 overflow-y-auto overscroll-contain scrollbar-thin-primary",
        )}
      >
        {condenseTitleOnScroll ? (
          <div ref={sentinelRef} aria-hidden className="h-px w-full shrink-0" />
        ) : null}
        {children}
      </div>

      {footer ? (
        <footer
          className={cn(
            "z-10 flex w-full shrink-0 items-center border-t border-border-extra-light bg-card px-6 py-4",
            !ownScroll && "sticky bottom-0",
          )}
        >
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
