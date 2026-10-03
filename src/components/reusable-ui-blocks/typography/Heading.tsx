import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HeadingProps } from "./types/type";

export const headingVariants = cva("", {
  variants: {
    as: {
      h1: "text-3xl font-bold tracking-tight",
      h2: "text-2xl font-semibold tracking-tight",
      h3: "text-xl font-medium tracking-tight",
    },
    color: {
      default: "text-text dark:text-text-dark",
      muted: "text-neutral-dark dark:text-neutral-dark-dark",
      green: "text-green-600 dark:text-green-400",
      primary: "text-primary dark:text-primary-dark",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    weight: {
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    color: "default",
    as: "h1",
    align: "left",
  },
});

const Heading = (props: HeadingProps) => {
  const {
    as = "h1",
    color,
    align,
    className,
    children,
    weight,
    ...rest
  } = props;
  const Component = as as "h1" | "h2" | "h3";
  return (
    <Component
      className={cn(headingVariants({ as, color, align, weight }), className)}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default Heading;
