"use client";

import { ArrowRight, Crown, Link2, PenSquare, Workflow } from "lucide-react";
import Link from "next/link";
import { PremiumBadge } from "@/components/modules/shared/PremiumBadge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/auth.hook";
import { routes } from "@/routes";
import { PostsList } from "../posts/PostsList";
import {
  ConnectionsSummaryCard,
  RecentExecutionsCard,
} from "./DashboardWidgets";

const quickLinks = [
  {
    title: "Create a post",
    description: "Write once, choose your destinations.",
    href: routes.create,
    icon: PenSquare,
  },
  {
    title: "Manage connections",
    description: "Link and manage your social accounts.",
    href: routes.connections,
    icon: Link2,
  },
  {
    title: "Track executions",
    description: "See what published and what needs attention.",
    href: routes.executions,
    icon: Workflow,
  },
];

export default function DashboardOverview() {
  const session = useSession();
  if (!session.data) return null;
  const user = session.data;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="eyebrow mb-3">Overview</p>
          <h1 className="break-words text-display-lg tracking-[-0.04em]">
            Welcome back, {user.name}.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your publishing workspace, all in one place.
          </p>
        </div>
        <Button asChild>
          <Link href={routes.create}>
            <PenSquare aria-hidden="true" />
            Create post
          </Link>
        </Button>
      </header>
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-lg bg-card p-5 shadow-card sm:p-6">
        <div className="space-y-2">
          {user.isPremium ? (
            <PremiumBadge />
          ) : (
            <p className="eyebrow">Free account</p>
          )}
          <h2 className="text-base">
            {user.isPremium
              ? "You're part of Premium."
              : "Make room for what's next."}
          </h2>
          <p className="text-sm text-muted-foreground">
            {user.isPremium
              ? "Explore upcoming features and your Premium membership."
              : "Publish to your connected platforms. Upgrade for access to the upcoming-features roadmap."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link
            href={user.isPremium ? routes.upcomingFeatures : routes.payment}
          >
            <Crown aria-hidden="true" />
            {user.isPremium ? "View upcoming features" : "Explore Premium"}
          </Link>
        </Button>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-lg bg-card p-5 shadow-card transition-shadow hover:shadow-float focus-visible:outline-2 focus-visible:outline-ring"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
              <ArrowRight className="size-4" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-sm">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ConnectionsSummaryCard />
        <RecentExecutionsCard />
      </div>
      <PostsList />
    </>
  );
}
