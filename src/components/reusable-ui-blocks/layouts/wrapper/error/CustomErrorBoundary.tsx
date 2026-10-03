import { DefaultErrorUI } from "./error-ui-variations/DefaultErrorUI";

type CustomErrorBoundaryProps = {
  isError: boolean | undefined;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * CustomErrorBoundary Component:
 * - Handles known/derived error state (e.g. TanStack Query's `isError`).
 * - Displays a fallback UI when isError is true.
 * - Uses a default or custom fallback error screen.
 */

export const CustomErrorBoundary = ({
  isError,
  fallback,
  children,
}: CustomErrorBoundaryProps) => {
  const defaultFallback = <DefaultErrorUI />;

  return isError ? (fallback ?? defaultFallback) : children;
};
