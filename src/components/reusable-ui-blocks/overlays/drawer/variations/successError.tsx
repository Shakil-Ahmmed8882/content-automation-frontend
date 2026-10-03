"use client";

import Image from "next/image";
import { BaseButton } from "@/components/reusable-ui-blocks/buttons/BaseButton";
import { CloseIcon } from "@/components/reusable-ui-blocks/modal/multipage-modal/variations/assets/CloseIcon";
import successGif from "@/components/reusable-ui-blocks/modal/multipage-modal/variations/assets/success.gif";
import { SUCCESS_ERROR_MODAL_KEYS } from "@/config/cache-tags/MODAL_KEYS";
import { Drawer } from "../Drawer";
import { useDrawerSelector } from "../provider/DrawerContext";

/*=========================================================
// Drawer counterpart of multipage-modal/variations/successError.tsx — same
// ids, same content, built on useDrawerSelector / Drawer.Page.
//
// Lives beside the Drawer primitive rather than inside a feature module: it
// started life in staff-schedule as the only drawer flow needing a terminal
// state, and Notice's create/edit drawer is the second consumer. A second
// module importing it from the first would make two unrelated features
// depend on each other, so it moved here. `staff-schedule/shared/
// bulkDrawerSuccessError.tsx` now re-exports from this file, unchanged for
// its callers.
//
// The ids come from the shared registry (SUCCESS_ERROR_MODAL_KEYS) and are
// safe to share with the modal version: they are page-id strings, resolved
// only among the children of whichever overlay registers them.
=========================================================*/

export const Drawer_Status_Keys = SUCCESS_ERROR_MODAL_KEYS;

type StatusDrawerProps = {
  title?: string;
  message?: string;
};

export function SuccessDrawerContent(props: StatusDrawerProps = {}) {
  const { close, getPayload } = useDrawerSelector();
  const successPayload = getPayload(SUCCESS_ERROR_MODAL_KEYS.success) as
    | { message: string; title?: string }
    | undefined;
  const title = props.title ?? successPayload?.title;
  const message = props.message ?? successPayload?.message;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
      <div className="relative h-[120px] w-[152px]">
        <Image
          src={successGif}
          alt="Success"
          fill
          className="object-contain"
          unoptimized
        />
      </div>

      <div className="flex w-full flex-col items-center gap-3 text-center">
        <h2 className="font-proxima-nova text-[28px] leading-[1.2] font-bold text-[#141414]">
          {title || "Successful"}
        </h2>
        <p className="font-proxima-nova text-base leading-normal font-normal text-[#666]">
          {message || "You have successfully completed the action."}
        </p>
      </div>

      {/* Not `fullWidth`: everything else on this page is a centred column of
			    intrinsic width (the illustration, the heading, the sentence), so a
			    button stretched edge to edge was the one element fighting it — and
			    it grew with the panel, which since the drawer went half-viewport at
			    `md` meant a Close button several hundred pixels wide. `min-w-40`
			    keeps it a comfortable target without pinning it to the panel. */}
      <BaseButton
        intent="primary-light"
        onClick={close}
        size="xl"
        className="min-w-40 font-proxima-nova font-semibold"
      >
        Close
      </BaseButton>
    </div>
  );
}

export function ErrorDrawerContent(props: StatusDrawerProps = {}) {
  const { getPayload, close } = useDrawerSelector();
  const errorPayload = getPayload(SUCCESS_ERROR_MODAL_KEYS.error) as
    | { message: string; title?: string }
    | undefined;
  const title = props.title ?? errorPayload?.title;
  const message = props.message ?? errorPayload?.message;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
      <CloseIcon />

      <div className="flex w-full flex-col items-center gap-3 text-center">
        <h2 className="font-proxima-nova text-[28px] leading-[1.2] font-bold text-[#141414]">
          {title || "Failed"}
        </h2>
        <p className="font-proxima-nova text-base leading-normal font-normal text-[#666]">
          {message || "An error occurred while submitting your request."}
        </p>
      </div>

      {/* Not `fullWidth`: everything else on this page is a centred column of
			    intrinsic width (the illustration, the heading, the sentence), so a
			    button stretched edge to edge was the one element fighting it — and
			    it grew with the panel, which since the drawer went half-viewport at
			    `md` meant a Close button several hundred pixels wide. `min-w-40`
			    keeps it a comfortable target without pinning it to the panel. */}
      <BaseButton
        intent="primary-light"
        onClick={close}
        size="xl"
        className="min-w-40 font-proxima-nova font-semibold"
      >
        Close
      </BaseButton>
    </div>
  );
}

/**
 * Drop inside any <Drawer> once, then from any action just
 * `goTo(Drawer_Status_Keys.success, { message })` / `.error`.
 *
 * ⚠️ Called as a FUNCTION, not rendered as a component — same trap as
 * MultipageModal's successErrorModalPages(): a wrapping component hides the
 * Page markers from getActiveDrawerPage's children scan and no page resolves.
 */
export function successErrorDrawerPages() {
  return (
    <>
      <Drawer.Page id={Drawer_Status_Keys.success} hideCloseButton>
        <SuccessDrawerContent />
      </Drawer.Page>

      <Drawer.Page
        id={Drawer_Status_Keys.error}
        backTitle="Back"
        hideCloseButton
      >
        <ErrorDrawerContent />
      </Drawer.Page>
    </>
  );
}
