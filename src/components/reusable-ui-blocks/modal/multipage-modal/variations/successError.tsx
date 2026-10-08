"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { BaseButton } from "@/components/reusable-ui-blocks/buttons/BaseButton";
import { SUCCESS_ERROR_MODAL_KEYS } from "@/config/cache-tags/MODAL_KEYS";
import { MultipageModal } from "../MultipageModal";
import { useMultipageModalSelector } from "../provider/MultipageModalContext";
import { CloseIcon } from "./assets/CloseIcon";
import successGif from "./assets/success.gif";

/** Re-exported from the central MODAL_KEYS registry (kept for existing imports). */
export const Modal_Keys = SUCCESS_ERROR_MODAL_KEYS;

/**
 * Optional overrides for the success/error pages. When the modal is opened as
 * a controlled component from outside its own tree (so no page payload can be
 * seeded), the caller passes title/message directly instead of via getPayload.
 */
type StatusModalProps = {
  title?: string;
  message?: string;
  /**
   * Overrides the single default "Close" button — e.g. a flow that needs
   * "Need Another" + "Home" side by side (supplies create-request, design.md
   * Decision 10). Defaults to `undefined` so every existing call site (~20)
   * that never passes this keeps the single Close button unchanged.
   */
  actions?: ReactNode;
};

/**
 * Success page for the MultipageModal. Prefers explicit title/message props
 * (used when the modal is driven as a controlled component), then falls back
 * to the page payload keyed "success", then to generic copy. The success
 * illustration is a statically-imported gif so the component is fully
 * self-contained and does not depend on any file in the public directory.
 */
export function SuccessModal(props: StatusModalProps = {}) {
  const { close, getPayload } = useMultipageModalSelector();
  const successPayload = getPayload("success") as
    | { message: string; title?: string; actions?: ReactNode }
    | undefined;
  const title = props.title ?? successPayload?.title;
  const message = props.message ?? successPayload?.message;
  const actions = props.actions ?? successPayload?.actions;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-[120px] w-[152px] mt-6">
        <Image
          src={successGif}
          alt="Success"
          fill
          className="object-contain"
          unoptimized
        />
      </div>

      <div className="flex flex-col gap-3 items-center text-center w-full">
        <h2 className="text-[32px] leading-[1.2] font-semibold tracking-[-0.04em] text-foreground">
          {title || "Successful"}
        </h2>
        <p className="text-base leading-normal font-normal text-muted-foreground">
          {message || "You have successfully completed the action."}
        </p>
      </div>

      {actions ?? (
        <BaseButton
          intent={"primary-light"}
          onClick={close}
          size={"xl"}
          className="w-full rounded-sm border border-border bg-transparent py-4 text-base leading-normal font-semibold text-foreground transition-colors hover:bg-accent"
        >
          Close
        </BaseButton>
      )}
    </div>
  );
}

// ============================================================================
// Error Modal
// ============================================================================

export interface SubmitBidErrorPayload {
  message: string;
}

/**
 * Error page for the MultipageModal. Prefers explicit title/message props
 * (used when the modal is driven as a controlled component), then falls back
 * to the page payload keyed "error", then to generic copy. Shows a
 * self-contained inline close-circle icon so no external asset is required.
 */
export function ErrorModal(props: StatusModalProps = {}) {
  const { getPayload, close } = useMultipageModalSelector();
  const errorPayload = getPayload("error") as
    | { message: string; title?: string }
    | undefined;
  const title = props.title ?? errorPayload?.title;
  const message = props.message ?? errorPayload?.message;

  return (
    <div className="flex flex-col items-center gap-6 ">
      <CloseIcon />

      <div className="flex flex-col gap-3 items-center text-center w-full">
        <h2 className="text-[32px] leading-[1.2] font-semibold tracking-[-0.04em] text-foreground">
          {title || "Failed"}
        </h2>
        <p className="text-base leading-normal font-normal text-muted-foreground">
          {message || "An error occurred while submitting your request."}
        </p>
      </div>

      <div className="flex gap-3 w-full">
        <BaseButton
          intent={"primary-light"}
          onClick={close}
          size={"xl"}
          className="w-full rounded-sm border border-border bg-transparent py-4 text-base leading-normal font-semibold text-foreground transition-colors hover:bg-accent"
        >
          Close
        </BaseButton>
      </div>
    </div>
  );
}

// ============================================================================
// Success / Error result pages — shared fallback
// ============================================================================

/**
 * The common success + error result pages for ANY MultipageModal flow.
 * Called as a FUNCTION (not a component) so the Page nodes inline directly
 * into the parent MultipageModal's children and stay visible to getActivePage().
 *
 * Drop it inside any <MultipageModal> once, then from any action just
 * `goTo(Modal_Keys.success, { message })` / `goTo(Modal_Keys.error, { message })`.
 */
export function successErrorModalPages() {
  return (
    <>
      <MultipageModal.Page
        id={Modal_Keys.success}
        hideCloseButton
        maxWidth="max-w-[640px]"
      >
        <SuccessModal />
      </MultipageModal.Page>

      <MultipageModal.Page
        id={Modal_Keys.error}
        backTitle="Back"
        hideCloseButton
        maxWidth="max-w-[640px]"
      >
        <ErrorModal />
      </MultipageModal.Page>
    </>
  );
}
