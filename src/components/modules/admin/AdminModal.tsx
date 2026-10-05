"use client";

import type { ReactNode } from "react";
import { MultipageModal } from "@/components/reusable-ui-blocks/modal/multipage-modal/MultipageModal";

/**
 * Dark-token frame around MultipageModal. The shared modal ships a white panel,
 * so the panel colours are overridden here instead of editing the shared block.
 * `children` must only be passed while the modal is open.
 */
export function AdminModal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <MultipageModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      initialPageId="form"
      overlayDismiss="never"
      className="!bg-card !text-card-foreground border border-border"
    >
      <MultipageModal.Page id="form" maxWidth="max-w-[560px]">
        <div className="space-y-5">
          <div>
            <h2 className="text-display-sm tracking-[-0.04em]">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {children}
        </div>
      </MultipageModal.Page>
    </MultipageModal>
  );
}
