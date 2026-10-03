import { useIsMounted } from "../../hooks/useIsMounted";

type CustomSuspenseProps = {
  isLoading: boolean | undefined;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * CustomSuspense Component:
 * - Handles loading state for asynchronous components.
 * - Displays a fallback UI while data is loading.
 * - Uses a default or custom fallback skeleton.
 */

export const CustomSuspense = ({
  isLoading,
  fallback,
  children,
}: CustomSuspenseProps) => {
  const isMounted = useIsMounted();

  const defaultFallback = <SuspenseFallback />;

  const shouldShowFallback = !isMounted || isLoading;

  return shouldShowFallback ? (fallback ?? defaultFallback) : children;
};

/**
 * SuspenseFallback Component:
 * - Provides a simple loading skeleton UI.
 * - Displays placeholder elements with spacing.
 */

function SuspenseFallback() {
  return (
    <div className="space-y-3 space-x-4 px-3 pt-6">
      {/* <BaseSkel className="h-4 w-full" /> */}
      loading...
    </div>
  );
}
