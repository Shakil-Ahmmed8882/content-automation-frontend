import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

//  Base CVA setup
export const baseButtonVariants = cva(
  "  inline-flex !leading-0 items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50  disabled:pointer-events-none cursor-pointer",
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg ",
        xl: "h-13 px-6 text-lg ",
        icon: "h-10 w-10 p-2",
      },
      shape: {
        default: "rounded-md text-[15px] sm:text-base",
        round: "rounded-full",
        square: "rounded-none",
      },
      intent: {
        default: "",
        primary:
          "bg-primary text-white hover:bg-primary/90 active:bg-primary/80 font-normal",
        "primary-light":
          "bg-primary-light text-primary hover:bg-primary-light/90 active:bg-primary-light/80",
        secondary: "",
        ghost:
          "border border-primary text-primary bg-transparent hover:bg-primary-light/10 active:bg-primary-light/20",
        bordered:
          " border border-primary text-primary hover:bg-primary/10 active:bg-primary/20",
        disabled:
          "bg-gray-200  text-gray-500 cursor-not-allowed hover:bg-gray-200 active:bg-gray-200",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "default",
      intent: "default",
      fullWidth: false,
    },
  },
);

//  Props
export interface BaseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof baseButtonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

//  Component
export const BaseButton = React.forwardRef<HTMLButtonElement, BaseButtonProps>(
  (
    {
      className,
      size,
      shape,
      intent,
      fullWidth,
      asChild = false,
      isLoading,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? "span" : "button";

    return (
      <Comp
        ref={ref}
        className={cn(
          baseButtonVariants({ size, shape, intent, fullWidth }),
          className,
          "relative", // ensure spinner can be absolutely positioned
        )}
        disabled={isLoading || props.disabled} // disable button when loading
        {...props}
      >
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin h-5 w-5" />
          </span>
        )}
        {/* Hide content when loading for better UX */}
        <span className={cn(isLoading && "invisible")}>{props.children}</span>
      </Comp>
    );
  },
);

BaseButton.displayName = "BaseButton";
