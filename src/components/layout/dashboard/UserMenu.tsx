"use client";

import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { PremiumBadge } from "@/components/modules/shared/PremiumBadge";
import { BaseAvatar } from "@/components/reusable-ui-blocks/images/variations/avatar/BaseAvatar";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/auth.hook";
import { routes } from "@/routes";
import type { User } from "@/types/auth.type";

const itemClass =
  "flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2.5 text-sm outline-none data-highlighted:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export function UserMenu({ user }: { user: User }) {
  const logout = useLogout();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open account menu"
          className="rounded-full"
        >
          <BaseAvatar src={user.avatarUrl} name={user.name} size="sm" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 rounded-md bg-popover p-1 text-popover-foreground shadow-float"
        >
          <DropdownMenu.Label className="space-y-2 p-3">
            <p className="break-words text-sm font-medium">{user.name}</p>
            <p className="break-all text-xs font-normal text-muted-foreground">
              {user.email}
            </p>
            {user.isPremium && <PremiumBadge />}
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href={routes.profile}>
              <UserRound className="size-4" aria-hidden="true" />
              Profile
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={itemClass}
            disabled={logout.isPending}
            onSelect={() => logout.mutate()}
          >
            <LogOut className="size-4" aria-hidden="true" />
            {logout.isPending ? "Logging out..." : "Log out"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
