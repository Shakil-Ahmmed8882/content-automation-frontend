"use client";

import { format } from "date-fns";
import { SmoothResizeWrapper } from "@/components/reusable-ui-blocks/layouts/wrapper/smooth-resize";
import { MultipageModal } from "@/components/reusable-ui-blocks/modal/multipage-modal/MultipageModal";
import { Calendar } from "@/components/ui/calendar";

type TCalendarModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  /**
   * Month the calendar should open on. Defaults to today so every caller opens
   * on the current month unless it explicitly asks for something else (e.g. the
   * month of an already-selected date).
   */
  defaultMonth?: Date;
  /**
   * Called when the user clicks Save. The pick already propagated via onSelect
   * as they clicked, so Save is a confirm-and-close; the caller can hook extra
   * commit logic here. Defaults to just closing.
   */
  onSave?: () => void;
};

/**
 * Reusable, context-independent date picker: the same shadcn Calendar UI, but
 * opened inside the single-page MultipageModal instead of a small Popover — a
 * big, horizontally-wide surface with the calendar as its child content, filling
 * the modal rather than sitting cramped inside it.
 *
 * Picking a date does NOT close the modal — the caller decides when to close
 * (the × button or an outside click, both wired by MultipageModal itself). This
 * lets a page keep the calendar open across multiple picks if it wants to.
 *
 * Does nothing beyond reporting the picked date via onSelect; the caller owns
 * the selected-date state, so this can be dropped into any field anywhere.
 *
 * NOTE on classNames: shadcn's <Calendar> spreads its base classNames map and
 * then `...classNames` LAST (see src/components/ui/calendar.tsx), so any key we
 * pass here fully REPLACES that element's base classes rather than merging with
 * them — every override below re-states the base classes it needs (layout,
 * spacing, rounding) alongside the actual fix, or that element silently loses
 * its default styling entirely.
 */
export function CalendarModal(props: TCalendarModalProps) {
  const {
    open,
    onOpenChange,
    selected,
    onSelect,
    disabled,
    defaultMonth,
    onSave,
  } = props;

  function handleCancel() {
    onOpenChange(false);
  }

  function handleSave() {
    if (onSave) onSave();
    else onOpenChange(false);
  }

  return (
    <MultipageModal
      open={open}
      onOpenChange={onOpenChange}
      initialPageId="calendar"
      hideCloseButton
    >
      <MultipageModal.Page id="calendar" maxWidth="max-w-[650px]">
        <SmoothResizeWrapper>
          {/* Selected-date header. Wrapped so it grows in / shrinks out smoothly
				    (no abrupt jump) as a date is picked or cleared. */}

          {selected ? (
            <div className="pb-4 text-center">
              <p className="eyebrow">Selected date</p>
              <p className="text-[22px] font-semibold tracking-[-0.04em] text-foreground">
                {format(selected, "d MMMM yyyy")}
              </p>
            </div>
          ) : null}
        </SmoothResizeWrapper>

        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          defaultMonth={defaultMonth ?? new Date()}
          disabled={disabled}
          // The nav row is absolutely positioned at top-0 of this box; the ×
          // button is hidden here (Cancel replaces it), so no top clearance is
          // needed. Cell size scales with the breakpoint (smaller on phones) —
          // combined with the min-w-0 day-button override below, the 7 columns
          // always shrink to fit the modal instead of overflowing.
          className="w-full overflow-hidden [--cell-size:2rem] sm:[--cell-size:2.5rem] md:[--cell-size:3.25rem]"
          classNames={{
            // w-fit → w-full: the calendar's own root defaults to shrink-to-fit,
            // which is the actual cause of the dead space on the right — the
            // 600px modal was correct, the calendar inside it just wasn't
            // stretching to use that width.
            root: "w-full",
            months: "relative flex w-full flex-col gap-4",
            month: "flex w-full flex-col gap-4",
            table: "w-full border-collapse",
            weekdays: "flex w-full",
            weekday:
              "flex-1 rounded-md text-sm font-medium text-muted-foreground select-none",
            week: "mt-2 flex w-full",
            day: "group/day relative flex-1 aspect-square h-full p-0 text-center select-none",
            // Pushed down to sit clear of the × button and given right padding
            // so the next-month arrow never lands under it.
            nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 pr-1",
            button_previous:
              "inline-flex size-9 cursor-pointer items-center justify-center rounded-md p-0 text-foreground transition-colors outline-none select-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:opacity-50",
            button_next:
              "inline-flex size-9 cursor-pointer items-center justify-center rounded-md p-0 text-foreground transition-colors outline-none select-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:opacity-50",
            caption_label:
              "font-semibold text-base text-foreground select-none",
            // Foreground-coloured day numbers so they read clearly on the dark card. min-w-0 removes the
            // base min-width:--cell-size floor so a column can shrink below the
            // cell size on narrow screens instead of overflowing the modal.
            day_button:
              "w-full min-w-0 cursor-pointer text-[12px] font-medium text-foreground sm:text-[14px]",
          }}
        />

        {/* Footer — Cancel + Save. 2 columns from sm up, stacked (2 rows) on
				    small devices. */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full cursor-pointer rounded-sm border border-border px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-full cursor-pointer rounded-sm bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Save
          </button>
        </div>
      </MultipageModal.Page>
    </MultipageModal>
  );
}
