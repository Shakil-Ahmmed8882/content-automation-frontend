"use client";

import { NoResultFoundWrapper } from "@/components/reusable-ui-blocks/placeholder/no-results-found-wrapper/NoResultFoundWrapper";
import { useProfile } from "@/hooks/user.hook";
import type { UserProfile } from "@/types/user.type";
import { AccountInfoCard } from "./AccountInfoCard";
import { ChangePasswordCard } from "./ChangePasswordCard";
import { DangerZone } from "./DangerZone";
import { IdentityCard } from "./IdentityCard";
import {
  EmptyProfileState,
  ProfileErrorState,
  ProfileLoadingSkeleton,
} from "./ProfilePageStates";
import { SessionCard } from "./SessionCard";

function ProfileContent({ profile }: { profile: UserProfile }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="min-w-0">
        <p className="eyebrow mb-3">Account hub</p>
        <h1 className="break-words text-display-lg tracking-[-0.04em]">
          Profile
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage your account details, security settings, billing entry points,
          and account lifecycle.
        </p>
      </header>
      <IdentityCard profile={profile} />
      <AccountInfoCard profile={profile} />
      <ChangePasswordCard profile={profile} />
      <SessionCard />
      <DangerZone />
    </div>
  );
}

export default function ProfilePageClient() {
  const profile = useProfile();
  if (profile.isPending) return <ProfileLoadingSkeleton />;
  if (profile.isError) {
    return (
      <ProfileErrorState
        error={profile.error}
        pending={profile.isFetching}
        retry={() => void profile.refetch()}
      />
    );
  }
  return (
    <NoResultFoundWrapper
      data={profile.data ? [profile.data] : []}
      fallback={
        <EmptyProfileState
          pending={profile.isFetching}
          retry={() => void profile.refetch()}
        />
      }
    >
      <ProfileContent profile={profile.data} />
    </NoResultFoundWrapper>
  );
}
