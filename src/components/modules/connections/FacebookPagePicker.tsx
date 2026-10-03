"use client";

import { AlertCircle, Link2, RotateCcw } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { BaseButton } from "@/components/reusable-ui-blocks/buttons/BaseButton";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/reusable-ui-blocks/form/primitives";
import { MultipageModal } from "@/components/reusable-ui-blocks/modal/multipage-modal/MultipageModal";
import { NoResultFoundWrapper } from "@/components/reusable-ui-blocks/placeholder/no-results-found-wrapper/NoResultFoundWrapper";
import { BaseSkeleton } from "@/components/reusable-ui-blocks/placeholder/skeletons/BaseSkeleton";
import {
  useFacebookPages,
  useSelectFacebookPage,
} from "@/hooks/connection.hook";
import { toApiError } from "@/lib/api-error";
import { apiMessage } from "./connection-ui.helpers";

function PickerSkeleton() {
  return (
    <output aria-label="Loading Facebook Pages" className="block space-y-3">
      {[0, 1, 2].map((item) => (
        <BaseSkeleton key={item} className="h-14 w-full" />
      ))}
    </output>
  );
}

function isExpiredSelection(error: unknown) {
  const normalized = toApiError(error);
  return (
    normalized.status === 400 &&
    normalized.message
      .toLowerCase()
      .includes("no facebook page selection in progress")
  );
}

export function FacebookPagePicker({
  open,
  onClose,
  onRestart,
}: {
  open: boolean;
  onClose: () => void;
  onRestart: () => Promise<void>;
}) {
  const [selectedPageId, setSelectedPageId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const optionIdPrefix = useId();
  const pages = useFacebookPages(open);
  const selectPage = useSelectFacebookPage();
  const selectedPage = useMemo(
    () => pages.data?.find((page) => page.id === selectedPageId),
    [pages.data, selectedPageId],
  );

  useEffect(() => {
    if (open) {
      setSelectedPageId("");
      setFormError(null);
    }
  }, [open]);

  async function submit() {
    if (!selectedPageId || selectPage.isPending) return;
    setFormError(null);
    try {
      await selectPage.mutateAsync(selectedPageId);
      toast.success(
        selectedPage
          ? `Facebook Page connected: ${selectedPage.name}.`
          : "Facebook Page connected.",
      );
      onClose();
    } catch (error) {
      const message = apiMessage(error);
      setFormError(message);
      toast.error(message);
    }
  }

  async function restart() {
    try {
      await onRestart();
    } catch (error) {
      toast.error(apiMessage(error));
    }
  }

  return (
    <MultipageModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      initialPageId="choose-page"
      className="!bg-card !text-foreground"
      overlayDismiss="at-root"
    >
      <MultipageModal.Page id="choose-page" maxWidth="max-w-[560px]">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="eyebrow">Facebook</p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">
              Choose a Facebook Page
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick the Page this workspace should publish to. You can disconnect
              it later from the Connections page.
            </p>
          </div>

          {pages.isPending ? (
            <PickerSkeleton />
          ) : pages.isError ? (
            <div
              role="alert"
              className="rounded-lg border border-border bg-muted p-4"
            >
              {isExpiredSelection(pages.error) ? (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <AlertCircle
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-warning"
                    />
                    <div>
                      <p className="font-medium">Selection expired</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Connect Facebook again to choose a Page.
                      </p>
                    </div>
                  </div>
                  <BaseButton
                    type="button"
                    onClick={restart}
                    className="h-10 rounded-sm bg-primary px-4 text-sm text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    Connect Facebook
                  </BaseButton>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {apiMessage(pages.error)}
                  </p>
                  <BaseButton
                    type="button"
                    onClick={() => void pages.refetch()}
                    disabled={pages.isFetching}
                    className="h-10 rounded-sm border border-border bg-background px-4 text-sm text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <RotateCcw aria-hidden="true" className="size-4" />
                    Try again
                  </BaseButton>
                </div>
              )}
            </div>
          ) : (
            <NoResultFoundWrapper
              data={pages.data ?? []}
              fallback={
                <div className="rounded-lg border border-border bg-muted p-5 text-center">
                  <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-md bg-card text-muted-foreground">
                    <Link2 aria-hidden="true" className="size-5" />
                  </div>
                  <p className="font-medium">No Facebook Pages found</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You need to be an admin of a Facebook Page to connect.
                  </p>
                  <BaseButton
                    type="button"
                    onClick={() => void pages.refetch()}
                    disabled={pages.isFetching}
                    className="mt-4 h-10 rounded-sm border border-border bg-background px-4 text-sm text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    Try again
                  </BaseButton>
                </div>
              }
            >
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">
                  Choose a Facebook Page
                </legend>
                <RadioGroup
                  value={selectedPageId}
                  onValueChange={setSelectedPageId}
                  aria-label="Choose a Facebook Page"
                >
                  {(pages.data ?? []).map((page, index) => {
                    const optionId = `${optionIdPrefix}-${index}`;
                    return (
                      <label
                        key={page.id}
                        htmlFor={optionId}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-4 text-sm transition-[background-color,border-color] duration-150 hover:bg-accent has-[[data-state=checked]]:border-ring"
                      >
                        <RadioGroupItem id={optionId} value={page.id} />
                        <span className="min-w-0 truncate">{page.name}</span>
                      </label>
                    );
                  })}
                </RadioGroup>
              </fieldset>
            </NoResultFoundWrapper>
          )}

          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <BaseButton
              type="button"
              onClick={onClose}
              disabled={selectPage.isPending}
              className="h-10 rounded-sm border border-border bg-background px-4 text-sm text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            >
              Cancel
            </BaseButton>
            <BaseButton
              type="button"
              onClick={submit}
              disabled={
                !selectedPageId ||
                selectPage.isPending ||
                pages.isPending ||
                pages.isError ||
                (pages.data ?? []).length === 0
              }
              isLoading={selectPage.isPending}
              aria-busy={selectPage.isPending}
              className="h-10 rounded-sm bg-primary px-4 text-sm text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-ring"
            >
              Connect this Page
            </BaseButton>
          </div>
        </div>
      </MultipageModal.Page>
    </MultipageModal>
  );
}
