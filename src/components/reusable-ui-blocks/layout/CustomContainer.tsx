import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CustomContainerVariant = "standard" | "fluid";

interface CustomContainerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CustomContainerVariant;
}

export const CustomContainer = forwardRef<HTMLDivElement, CustomContainerProps>(
  ({ variant = "standard", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          variant === "fluid" ? "container-fluid" : "container",
          className,
        )}
        {...props}
      />
    );
  },
);

CustomContainer.displayName = "CustomContainer";
