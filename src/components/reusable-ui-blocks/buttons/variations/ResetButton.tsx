import { RotateCcw } from "lucide-react";
import { BaseButton, type BaseButtonProps } from "../BaseButton";

type ResetButtonProps = Omit<BaseButtonProps, "intent"> & {
  size?: "sm" | "md" | "lg";
};

export function ResetButton({ size = "md", ...props }: ResetButtonProps) {
  return (
    <BaseButton
      {...props}
      type="button"
      intent="primary-light"
      className="bg-primary/10 rounded-full"
      size={size}
    >
      <span className="flex items-center gap-2">
        <RotateCcw className="size-4" />
        <>Reset</>
      </span>
    </BaseButton>
  );
}
