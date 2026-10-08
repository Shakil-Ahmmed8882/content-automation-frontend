import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

//  Base CVA setup
export const baseButtonVariants = cva(
  "  inline-flex !leading-0 items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50  disabled:pointer-events-none cursor-pointer",
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
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary/80 font-medium",
        "primary-light":
          "bg-primary-subtle text-primary hover:bg-accent active:bg-accent/80",
        secondary: "",
        ghost:
          "border border-primary text-primary bg-transparent hover:bg-primary-subtle active:bg-accent",
        bordered:
          " border border-primary text-primary hover:bg-primary/10 active:bg-primary/20",
        disabled:
          "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted active:bg-muted",
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
