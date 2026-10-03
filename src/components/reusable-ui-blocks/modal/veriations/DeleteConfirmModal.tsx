"use client";

import { BaseButton } from "@/components/reusable-ui-blocks/buttons/BaseButton";
import { GenericModalWrapper } from "@/components/reusable-ui-blocks/modal/GenericModalWrapper";
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
            <Heading
              as="h2"
              align="center"
              weight="bold"
              className="font-proxima-nova !text-[40px] !leading-[1.2] text-[#141414]"
            >
              {title}
            </Heading>
            <p className="font-proxima-nova text-base leading-6 text-[#666] text-center w-full">
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

            <BaseButton
              intent="primary"
              fullWidth
              shape="round"
              size="lg"
              className="!py-4 font-proxima-nova font-semibold"
              onClick={onClose}
            >
              {cancelLabel}
            </BaseButton>
          </div>
        </div>
      </GenericModalWrapper.Content>
    </GenericModalWrapper>
  );
}
