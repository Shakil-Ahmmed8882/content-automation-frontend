"use client";

import { RotateCcw } from "lucide-react";
import { BaseSkeleton } from "@/components/reusable-ui-blocks/placeholder/skeletons/BaseSkeleton";
import { Button } from "@/components/ui/button";
import { useAuthCooldown } from "@/hooks/auth.hook";
import { toApiError } from "@/lib/api-error";
import { ProfileAlert } from "./ProfileAlert";

export function ProfileLoadingSkeleton() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6" aria-busy="true">
      <header className="space-y-3">
        <BaseSkeleton className="h-4 w-24" />
        <BaseSkeleton className="h-10 w-48" />
        <BaseSkeleton className="h-5 w-full max-w-md" />
      </header>
      {[0, 1, 2, 3, 4].map((item) => (
        <section
          key={item}
          aria-label="Loading profile section"
          className="rounded-lg bg-card p-5 shadow-card sm:p-6"
        >
          <BaseSkeleton className="mb-5 h-5 w-32" />
          <div className="space-y-3">
            <BaseSkeleton className="h-12 w-full" />
            <BaseSkeleton className="h-12 w-3/4" />
          </div>
        </section>
      ))}
    </main>
  );
}

export function ProfileErrorState({
  error,
  retry,
  pending,
}: {
  error: unknown;
  retry: () => void;
  pending: boolean;
}) {
  const cooldown = useAuthCooldown();
  return (
    <main className="mx-auto flex min-h-96 w-full max-w-3xl items-center">
      <div className="w-full rounded-lg bg-card p-6 shadow-card">
        <ProfileAlert>
          <p className="font-medium">Couldn't load your profile.</p>
          <p className="mt-1 text-muted-foreground">
            {toApiError(error).userMessage}
          </p>
        </ProfileAlert>
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          disabled={pending || cooldown > 0}
          aria-busy={pending}
          onClick={retry}
        >
          <RotateCcw aria-hidden="true" />
          {cooldown > 0 ? `Try again in ${cooldown}s` : "Try again"}
        </Button>
      </div>
    </main>
  );
}

export function EmptyProfileState({
  retry,
  pending,
}: {
  retry: () => void;
  pending: boolean;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4">
      <ProfileAlert variant="info">
        No profile data was returned. Try reloading the page.
      </ProfileAlert>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        aria-busy={pending}
        onClick={retry}
      >
        <RotateCcw aria-hidden="true" />
        Retry
      </Button>
    </main>
  );
}
