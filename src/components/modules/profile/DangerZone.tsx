"use client";

import { ShieldAlert } from "lucide-react";
import { useId, useState } from "react";
import { MultipageModal } from "@/components/reusable-ui-blocks/modal/multipage-modal/MultipageModal";
import { useMultipageModalSelector } from "@/components/reusable-ui-blocks/modal/multipage-modal/provider/MultipageModalContext";
import {
  ErrorModal,
  Modal_Keys,
  SuccessModal,
} from "@/components/reusable-ui-blocks/modal/multipage-modal/variations/successError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthCooldown } from "@/hooks/auth.hook";
import { useDeleteAccount } from "@/hooks/user.hook";
import { toApiError } from "@/lib/api-error";
import { ProfileAlert } from "./ProfileAlert";
import { ProfileSection } from "./ProfileSection";

const WARNING_PAGE_ID = "delete-account-warning";
const REDIRECT_DELAY_MS = 900;

type DeleteOutcomePayload = {
  title: string;
  message: string;
};

function DeleteModalTrigger() {
  const { open } = useMultipageModalSelector();
  return (
    <Button
      type="button"
      variant="destructive"
      onClick={() => open(WARNING_PAGE_ID)}
    >
      <ShieldAlert aria-hidden="true" />
      Delete account
    </Button>
  );
}

function DeleteWarningPage() {
  const headingId = useId();
  const descriptionId = useId();
  const inputId = useId();
  const mutation = useDeleteAccount({ redirectDelayMs: REDIRECT_DELAY_MS });
  const cooldown = useAuthCooldown();
  const { close, goTo } = useMultipageModalSelector();
  const [confirmation, setConfirmation] = useState("");
  const confirmed = confirmation === "DELETE";

  async function confirmDelete() {
    if (!confirmed || mutation.isPending || cooldown) return;
    try {
      await mutation.mutateAsync();
      goTo(Modal_Keys.success, {
        title: "Account deleted",
        message: "Your account was deactivated. Redirecting you home now.",
      } satisfies DeleteOutcomePayload);
    } catch (failure) {
      const error = toApiError(failure);
      goTo(Modal_Keys.error, {
        title: "Deletion failed",
        message: error.userMessage,
      } satisfies DeleteOutcomePayload);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      className="space-y-6 text-foreground"
    >
      <div className="space-y-2 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive-text">
          <ShieldAlert className="size-5" aria-hidden="true" />
        </div>
        <h2 id={headingId} className="text-display-sm tracking-[-0.04em]">
          Delete your account?
        </h2>
        <p id={descriptionId} className="text-sm text-muted-foreground">
          Your account will be deactivated and you'll be logged out. Your email
          stays reserved. This can't be undone from the app.
        </p>
      </div>
      <div className="rounded-sm border border-border bg-muted p-3 text-sm text-muted-foreground">
        Posts, connections, and execution history stay on the server, but your
        account can no longer be used to sign in.
      </div>
      <div className="grid gap-2">
        <Label htmlFor={inputId}>Type DELETE to confirm</Label>
        <Input
          id={inputId}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          disabled={mutation.isPending}
          aria-describedby={`${inputId}-help`}
        />
        <p id={`${inputId}-help`} className="text-sm text-muted-foreground">
          The delete request is only sent after this exact confirmation.
        </p>
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={mutation.isPending}
          onClick={close}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={!confirmed || mutation.isPending || cooldown > 0}
          aria-busy={mutation.isPending}
          onClick={() => void confirmDelete()}
        >
          {mutation.isPending ? "Deleting..." : "Delete account"}
        </Button>
      </div>
    </div>
  );
}

function SuccessOutcomePage() {
  const payload = useMultipageModalSelector().getPayload(Modal_Keys.success) as
    | DeleteOutcomePayload
    | undefined;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-success-title"
      aria-describedby="delete-account-success-description"
    >
      <SuccessModal
        title={payload?.title ?? "Account deleted"}
        message={payload?.message ?? "Redirecting you home now."}
        actions={
          <p
            id="delete-account-success-description"
            className="text-center text-sm text-muted-foreground"
            aria-live="polite"
          >
            Redirecting...
          </p>
        }
      />
      <span id="delete-account-success-title" className="sr-only">
        {payload?.title ?? "Account deleted"}
      </span>
    </div>
  );
}

function ErrorOutcomePage() {
  const payload = useMultipageModalSelector().getPayload(Modal_Keys.error) as
    | DeleteOutcomePayload
    | undefined;
  const message = payload?.message ?? "Something went wrong. Please try again.";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-error-title"
      aria-describedby="delete-account-error-description"
    >
      <div role="alert">
        <ErrorModal
          title={payload?.title ?? "Deletion failed"}
          message={message}
        />
      </div>
      <span id="delete-account-error-title" className="sr-only">
        {payload?.title ?? "Deletion failed"}
      </span>
      <span id="delete-account-error-description" className="sr-only">
        {message}
      </span>
    </div>
  );
}

function DeleteAccountModal() {
  return (
    <MultipageModal initialPageId={WARNING_PAGE_ID} overlayDismiss="at-root">
      <DeleteModalTrigger />
      <MultipageModal.Page id={WARNING_PAGE_ID} maxWidth="max-w-[560px]">
        <DeleteWarningPage />
      </MultipageModal.Page>
      <MultipageModal.Page
        id={Modal_Keys.error}
        backTitle="Back to confirmation"
        maxWidth="max-w-[640px]"
      >
        <ErrorOutcomePage />
      </MultipageModal.Page>
      <MultipageModal.Page
        id={Modal_Keys.success}
        hideCloseButton
        maxWidth="max-w-[640px]"
      >
        <SuccessOutcomePage />
      </MultipageModal.Page>
    </MultipageModal>
  );
}

export function DangerZone() {
  return (
    <ProfileSection
      title="Danger zone"
      description="Deleting your account deactivates it and signs you out."
    >
      <div className="space-y-4">
        <ProfileAlert variant="info">
          <p>
            Open the confirmation dialog to review the consequences before any
            delete request is sent.
          </p>
        </ProfileAlert>
        <DeleteAccountModal />
      </div>
    </ProfileSection>
  );
}
