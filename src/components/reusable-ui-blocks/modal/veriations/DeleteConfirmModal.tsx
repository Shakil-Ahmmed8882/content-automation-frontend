"use client";

import { BaseButton } from "@/components/reusable-ui-blocks/buttons/BaseButton";
import {
  GenericModalWrapper,
  useModalTitleId,
} from "@/components/reusable-ui-blocks/modal/GenericModalWrapper";
import Heading from "@/components/reusable-ui-blocks/typography/Heading";

interface DeleteShiftScheduleProps {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
  open?: boolean;
}

function ConfirmTitle({ children }: { children: string }) {
  const titleId = useModalTitleId();
  return (
    <Heading
      as="h2"
      align="center"
      weight="semibold"
      id={titleId}
      className="font-proxima-nova !text-[28px] !leading-[1.2] !tracking-[-0.04em] text-foreground"
    >
      {children}
    </Heading>
  );
}

export function DeleteConfirmModal(props: DeleteShiftScheduleProps) {
  const {
    title = "Delete",
    message = "Are you sure you want to delete the schedule?",
    confirmLabel = "Delete",
    cancelLabel = "Keep",
    loading = false,
    onConfirm,
    onClose,
    open = true,
  } = props;
  return (
    <GenericModalWrapper open={open} onOpenChange={onClose}>
      <GenericModalWrapper.Content className="!max-w-[510px]">
        <div className="flex flex-col gap-6 justify-center w-full text-center">
          {/* Title + description */}
          <div className="flex flex-col gap-2 w-full">
            <ConfirmTitle>{title}</ConfirmTitle>
            <p className="font-proxima-nova text-base leading-6 text-muted-foreground text-center w-full">
              {message}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-6 w-full">
            <BaseButton
              intent="bordered"
              fullWidth
              shape="round"
              size="lg"
              className="!py-4 font-proxima-nova font-semibold"
              onClick={onConfirm}
              isLoading={loading}
              disabled={loading}
            >
              {confirmLabel}
            </BaseButton>

            {/* Cancel takes focus first so Enter never confirms a destructive action by accident. */}
            <BaseButton
              intent="primary"
              fullWidth
              shape="round"
              size="lg"
              className="!py-4 font-proxima-nova font-semibold"
              onClick={onClose}
              data-autofocus
            >
              {cancelLabel}
            </BaseButton>
          </div>
        </div>
      </GenericModalWrapper.Content>
    </GenericModalWrapper>
  );
}
