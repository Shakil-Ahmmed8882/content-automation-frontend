import Link from "next/link";
import { routes } from "@/routes";
import type { UpcomingFeature } from "@/types/upcoming-feature.type";
import { FeatureImage } from "./FeatureImage";
import { FeatureStatusBadge } from "./FeatureStatusBadge";

export function FeatureCard({ feature }: { feature: UpcomingFeature }) {
  return (
    <Link
      href={routes.upcomingFeatureDetail(feature.slug)}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
    >
      <FeatureImage
        src={feature.imageUrl}
        title={feature.title}
        className="aspect-video w-full"
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <FeatureStatusBadge status={feature.status} />
        <h2 className="text-lg font-semibold tracking-[-0.02em]">
          {feature.title}
        </h2>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {feature.shortDescription}
        </p>
      </div>
    </Link>
  );
}
