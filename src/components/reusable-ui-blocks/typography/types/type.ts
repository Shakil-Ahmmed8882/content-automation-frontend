import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import type { headingVariants } from "../Heading";

export type HeadingProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof headingVariants> &
  Omit<HTMLAttributes<HTMLHeadingElement>, "color">;
