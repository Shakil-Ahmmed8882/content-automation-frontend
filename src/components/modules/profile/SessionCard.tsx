"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthCooldown, useLogout } from "@/hooks/auth.hook";
import { ProfileSection } from "./ProfileSection";

export function SessionCard() {
  const logout = useLogout();
  const cooldown = useAuthCooldown();
  return (
    <ProfileSection
      title="Session"
      description="Log out of this browser without changing your account."
    >
      <Button
        type="button"
        variant="outline"
        disabled={logout.isPending || cooldown > 0}
        aria-busy={logout.isPending}
        onClick={() => logout.mutate()}
      >
        <LogOut aria-hidden="true" />
        {logout.isPending ? "Logging out..." : "Log out"}
      </Button>
    </ProfileSection>
  );
}
