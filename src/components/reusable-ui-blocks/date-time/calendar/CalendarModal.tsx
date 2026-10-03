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
              <p className="font-proxima-nova text-xs font-medium uppercase tracking-wide text-[#999]">
                Selected date
              </p>
              <p className="font-proxima-nova text-[22px] font-bold text-[#141414]">
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
              "flex-1 rounded-md text-sm font-semibold text-[#141414] select-none",
            week: "mt-2 flex w-full",
            day: "group/day relative flex-1 aspect-square h-full p-0 text-center select-none",
            // Pushed down to sit clear of the × button and given right padding
            // so the next-month arrow never lands under it.
            nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 pr-1",
            button_previous:
              "inline-flex items-center justify-center size-9 rounded-md p-0 select-none text-[#141414] hover:bg-[#f5f5f5] transition-colors aria-disabled:opacity-50 cursor-pointer",
            button_next:
              "inline-flex items-center justify-center size-9 rounded-md p-0 select-none text-[#141414] hover:bg-[#f5f5f5] transition-colors aria-disabled:opacity-50 cursor-pointer",
            caption_label: "font-semibold text-base text-[#141414] select-none",
            // Bolder, near-black text (was the thin/washed-out default) so day
            // numbers read clearly against the white modal. min-w-0 removes the
            // base min-width:--cell-size floor so a column can shrink below the
            // cell size on narrow screens instead of overflowing the modal.
            day_button:
              "w-full min-w-0 text-[12px] sm:text-[14px] font-semibold text-[#141414] cursor-pointer",
          }}
        />

        {/* Footer — Cancel + Save. 2 columns from sm up, stacked (2 rows) on
				    small devices. */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#f0f0f0]">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full rounded-[60px] bg-[#fafafa] px-6 py-3 font-proxima-nova font-semibold text-[16px] text-[#141414] cursor-pointer hover:bg-[#f0f0f0] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-[60px] bg-[#ff124b] px-6 py-3 font-proxima-nova font-semibold text-[16px] text-white cursor-pointer hover:bg-[#e00040] transition-colors"
          >
            Save
          </button>
        </div>
      </MultipageModal.Page>
    </MultipageModal>
  );
}
