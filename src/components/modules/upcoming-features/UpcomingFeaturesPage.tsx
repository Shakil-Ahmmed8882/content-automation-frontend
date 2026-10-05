"use client";

import { PremiumBadge } from "@/components/modules/shared/PremiumBadge";
import { ShowIf } from "@/components/reusable-ui-blocks/guard/ShowIf";
import { useUpcomingFeatures } from "@/hooks/upcoming-feature.hook";
import { FeatureCard } from "./FeatureCard";
import { FeaturesEmpty, FeaturesError, FeaturesLoading } from "./FeatureStates";
import { UpgradeGate } from "./UpgradeGate";

export default function UpcomingFeaturesPage() {
  const features = useUpcomingFeatures();
  const data = features.data ?? [];
  const showGate = features.forbidden;
  const showLoading =
    !showGate && (!features.accessKnown || features.isPending);
  const showError = !showGate && !showLoading && features.isError;
  const showEmpty =
    !showGate && !showLoading && !showError && data.length === 0;
  const showList = !showGate && !showLoading && !showError && data.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <p className="eyebrow">Roadmap</p>
          <PremiumBadge />
        </div>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Upcoming features
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            A look at what we are planning to build next.
          </p>
        </div>
      </header>

      <ShowIf condition={showGate}>
        <UpgradeGate />
      </ShowIf>
      <ShowIf condition={showLoading}>
        <FeaturesLoading />
      </ShowIf>
      <ShowIf condition={showError}>
        <FeaturesError
          title="Couldn't load upcoming features."
          error={features.error}
          pending={features.isFetching}
          retry={() => void features.refetch()}
        />
      </ShowIf>
      <ShowIf condition={showEmpty}>
        <FeaturesEmpty />
      </ShowIf>
      <ShowIf condition={showList}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </ShowIf>
    </div>
  );
}
