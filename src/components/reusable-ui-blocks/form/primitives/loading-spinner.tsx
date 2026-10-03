import { cn } from "./host";

/*=========================================================
// loading-spinner — inline busy indicator for fields that
// resolve something async (TextField/TextareaField `loading`).
// Token-driven so it inherits the host theme in light + dark.
=========================================================*/

type TLoadingSpinnerProps = {
  className?: string;
};

export function LoadingSpinner(props: TLoadingSpinnerProps) {
  const { className } = props;

  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground",
        className,
      )}
    />
  );
}
