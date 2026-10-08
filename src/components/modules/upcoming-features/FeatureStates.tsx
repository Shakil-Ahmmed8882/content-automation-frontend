import { RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { CenteredError } from "@/components/modules/shared/CenteredError";
import { BaseSkeleton } from "@/components/reusable-ui-blocks/placeholder/skeletons/BaseSkeleton";
import { CardSkeletonV2 } from "@/components/reusable-ui-blocks/placeholder/skeletons/CardSkeletons";
import { Button } from "@/components/ui/button";
import { toApiError } from "@/lib/api-error";
import { routes } from "@/routes";

export function FeaturesLoading() {
  return (
    <output
      aria-label="Loading upcoming features"
      className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
    >
      {[0, 1, 2].map((item) => (
        <CardSkeletonV2 key={item} />
      ))}
    </output>
  );
}

export function FeatureDetailLoading() {
  return (
    <output aria-label="Loading feature" className="block space-y-5">
      <BaseSkeleton className="aspect-video w-full" />
      <BaseSkeleton className="h-6 w-32" />
      <BaseSkeleton className="h-9 w-2/3" />
      <BaseSkeleton className="h-24 w-full" />
    </output>
  );
}

export function FeaturesEmpty() {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Sparkles aria-hidden="true" className="size-5" />
      </div>
      <h2 className="text-lg font-semibold tracking-[-0.02em]">
        Nothing announced yet.
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        New upcoming features will show up here as soon as they are published.
      </p>
    </div>
  );
}

export function FeaturesError({
  error,
  retry,
  pending,
  title,
}: {
  error: unknown;
  retry: () => void;
  pending: boolean;
  title: string;
}) {
  const api = toApiError(error);
  return (
    <CenteredError title={title} message={api.message || api.userMessage}>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={retry}
      >
        <RotateCcw aria-hidden="true" className="size-4" />
        {pending ? "Retrying..." : "Try again"}
      </Button>
    </CenteredError>
  );
}

export function FeatureNotFound() {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center shadow-card">
      <p className="eyebrow">404</p>
      <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
        Feature not found
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This feature doesn't exist or is no longer available.
      </p>
      <Button asChild className="mt-5">
        <Link href={routes.upcomingFeatures}>Back to upcoming features</Link>
      </Button>
    </div>
  );
}
