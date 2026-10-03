import { BaseSkeleton } from "@/components/reusable-ui-blocks/placeholder/skeletons/BaseSkeleton";
export default function Loading() {
  return (
    <output
      aria-label="Loading page"
      className="mx-auto block max-w-4xl space-y-6 px-4 py-24"
    >
      <BaseSkeleton className="h-24" />
      <BaseSkeleton className="h-12" />
      <BaseSkeleton className="h-48" />
    </output>
  );
}
