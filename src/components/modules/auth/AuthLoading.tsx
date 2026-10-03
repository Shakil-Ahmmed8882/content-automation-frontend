import { BaseSkeleton } from "@/components/reusable-ui-blocks/placeholder/skeletons/BaseSkeleton";

export default function AuthLoading() {
  return (
    <output
      className="w-full max-w-sm space-y-6 rounded-lg bg-card p-8 shadow-float"
      aria-label="Checking your session"
    >
      <BaseSkeleton className="h-7 w-2/3 motion-reduce:animate-none" />
      <BaseSkeleton className="h-4 w-full motion-reduce:animate-none" />
      <BaseSkeleton className="h-10 w-full motion-reduce:animate-none" />
      <BaseSkeleton className="h-10 w-full motion-reduce:animate-none" />
      <span className="sr-only">Checking your session...</span>
    </output>
  );
}
