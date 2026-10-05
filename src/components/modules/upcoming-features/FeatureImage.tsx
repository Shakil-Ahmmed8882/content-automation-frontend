import { BaseImage } from "@/components/reusable-ui-blocks/images/BaseImage";
import { cn } from "@/lib/utils";

export function FeatureImage({
  src,
  title,
  className,
}: {
  src: string | null;
  title: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center bg-muted text-4xl font-semibold text-muted-foreground",
          className,
        )}
      >
        {title.trim().charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <BaseImage
      src={src}
      alt={title}
      className={cn("bg-muted", className)}
      imgClass="bg-muted"
    />
  );
}
