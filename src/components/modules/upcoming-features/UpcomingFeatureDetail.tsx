"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ShowIf } from "@/components/reusable-ui-blocks/guard/ShowIf";
import { useUpcomingFeature } from "@/hooks/upcoming-feature.hook";
import { routes } from "@/routes";
import { FeatureImage } from "./FeatureImage";
import {
  FeatureDetailLoading,
  FeatureNotFound,
  FeaturesError,
} from "./FeatureStates";
import { FeatureStatusBadge } from "./FeatureStatusBadge";
import { UpgradeGate } from "./UpgradeGate";

export default function UpcomingFeatureDetail({ slug }: { slug: string }) {
  const query = useUpcomingFeature(slug);
  const feature = query.data;

  const gate = query.forbidden;
  const loading = !gate && !feature && (!query.accessKnown || query.isPending);
  const notFound = !gate && !feature && query.notFound;
  const failed = !gate && !feature && !notFound && query.isError;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={routes.upcomingFeatures}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All upcoming features
      </Link>

      <ShowIf condition={gate}>
        <UpgradeGate />
      </ShowIf>
      <ShowIf condition={loading}>
        <FeatureDetailLoading />
      </ShowIf>
      <ShowIf condition={notFound}>
        <FeatureNotFound />
      </ShowIf>
      <ShowIf condition={failed}>
        <FeaturesError
          title="Couldn't load this feature."
          error={query.error}
          pending={query.isFetching}
          retry={() => void query.refetch()}
        />
      </ShowIf>
      {feature && !gate ? (
        <article className="space-y-5">
          <FeatureImage
            src={feature.imageUrl}
            title={feature.title}
            className="aspect-video w-full rounded-lg border border-border"
          />
          <FeatureStatusBadge status={feature.status} />
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {feature.title}
          </h1>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
            {feature.description}
          </p>
        </article>
      ) : null}
    </div>
  );
}
