import { History } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/routes";
import type { UserProfile } from "@/types/user.type";
import { InfoRow } from "./InfoRow";
import { PremiumStatus } from "./PremiumStatus";
import { ProfileSection } from "./ProfileSection";
import { formatDate, providerLabel } from "./profile.utils";

export function AccountInfoCard({ profile }: { profile: UserProfile }) {
  return (
    <ProfileSection
      title="Account"
      description="Your email is read-only. Account access is resolved by the backend."
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={profile.email} readOnly />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Role" value={profile.role.replaceAll("_", " ")} />
          <InfoRow label="Member since" value={formatDate(profile.createdAt)} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Sign-in methods</p>
          <div className="flex flex-wrap gap-2">
            {profile.providers.length > 0 ? (
              profile.providers.map((provider) => (
                <span
                  key={provider}
                  className="rounded-sm border border-border bg-muted px-2 py-1 text-xs text-muted-foreground"
                >
                  {providerLabel(provider)}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                No linked sign-in methods reported.
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-sm border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <PremiumStatus profile={profile} />
          <Link
            href={routes.paymentHistory}
            className="inline-flex items-center gap-2 rounded-sm text-sm text-link hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <History className="size-4" aria-hidden="true" />
            View payment history
          </Link>
        </div>
      </div>
    </ProfileSection>
  );
}
