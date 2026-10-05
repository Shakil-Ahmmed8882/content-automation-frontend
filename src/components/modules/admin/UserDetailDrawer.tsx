"use client";

import { useState } from "react";
import { DrawerShell } from "@/components/reusable-ui-blocks/overlays/drawer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminUser,
  useSetAdminUserPremium,
  useSetAdminUserRole,
  useSetAdminUserStatus,
} from "@/hooks/admin-user.hook";
import { toApiError } from "@/lib/api-error";
import type { AdminRole, AdminUser } from "@/types/admin.type";
import {
  AdminBadge,
  AdminErrorState,
  AdminListSkeleton,
  formatAdminDateTime,
} from "./AdminShared";

const roles: AdminRole[] = ["USER", "ADMIN", "SUPER_ADMIN"];

type Confirm =
  | { kind: "block" | "unblock" | "grant" | "revoke" }
  | { kind: "role"; role: AdminRole };

function confirmCopy(confirm: Confirm, name: string) {
  switch (confirm.kind) {
    case "block":
      return {
        text: `Block ${name}? They can't log in and any active session stops working on its next request.`,
        label: "Block user",
      };
    case "unblock":
      return { text: `Unblock ${name}?`, label: "Unblock user" };
    case "grant":
      return {
        text: `Grant Premium to ${name}? This doesn't create a payment.`,
        label: "Grant Premium",
      };
    case "revoke":
      return {
        text: `Revoke Premium from ${name}? They'll lose access to Upcoming features.`,
        label: "Revoke Premium",
      };
    case "role":
      return {
        text: `Change ${name}'s role to ${confirm.role}?`,
        label: "Change role",
      };
  }
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-extra-light py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

function UserDetailBody({
  user,
  viewerId,
  viewerIsSuperAdmin,
}: {
  user: AdminUser;
  viewerId: string;
  viewerIsSuperAdmin: boolean;
}) {
  const status = useSetAdminUserStatus();
  const premium = useSetAdminUserPremium();
  const roleMutation = useSetAdminUserRole();
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [roleDraft, setRoleDraft] = useState<AdminRole>(user.role);
  const busy = status.isPending || premium.isPending || roleMutation.isPending;
  const isSelf = user.id === viewerId;
  const locked = user.isDeleted;

  async function run(action: Confirm) {
    try {
      if (action.kind === "block" || action.kind === "unblock") {
        await status.mutateAsync({
          id: user.id,
          status: action.kind === "block" ? "BLOCKED" : "ACTIVE",
        });
      } else if (action.kind === "grant" || action.kind === "revoke") {
        await premium.mutateAsync({
          id: user.id,
          isPremium: action.kind === "grant",
        });
      } else if (action.kind === "role") {
        await roleMutation.mutateAsync({ id: user.id, role: action.role });
      }
      setConfirm(null);
    } catch {
      // Hooks toast the backend message; keep the confirm open to retry.
    }
  }

  const copy = confirm ? confirmCopy(confirm, user.name) : null;

  return (
    <div className="space-y-6">
      <dl>
        <DetailRow label="Email">{user.email}</DetailRow>
        <DetailRow label="Email verified">
          {user.emailVerified ? "Yes" : "No"}
        </DetailRow>
        <DetailRow label="Role">
          <AdminBadge tone="info">{user.role}</AdminBadge>
        </DetailRow>
        <DetailRow label="Status">
          <AdminBadge tone={user.status === "ACTIVE" ? "success" : "danger"}>
            {user.status === "ACTIVE" ? "Active" : "Blocked"}
          </AdminBadge>
        </DetailRow>
        <DetailRow label="Premium">
          {user.isPremium ? "Yes" : "No"}
        </DetailRow>
        <DetailRow label="Premium since">
          {formatAdminDateTime(user.premiumSince)}
        </DetailRow>
        <DetailRow label="Deleted">
          {user.isDeleted ? <AdminBadge tone="danger">Deleted</AdminBadge> : "No"}
        </DetailRow>
        <DetailRow label="Joined">{formatAdminDateTime(user.createdAt)}</DetailRow>
        <DetailRow label="User ID">
          <span className="font-mono text-xs break-all">{user.id}</span>
        </DetailRow>
      </dl>

      {locked ? (
        <p className="text-sm text-muted-foreground">
          This account was deleted. Actions are disabled.
        </p>
      ) : null}

      <div className="space-y-3">
        <p className="eyebrow">Actions</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy || locked || isSelf}
            title={isSelf ? "You can't change your own status." : undefined}
            onClick={() =>
              setConfirm({ kind: user.status === "ACTIVE" ? "block" : "unblock" })
            }
          >
            {user.status === "ACTIVE" ? "Block user" : "Unblock user"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || locked}
            onClick={() =>
              setConfirm({ kind: user.isPremium ? "revoke" : "grant" })
            }
          >
            {user.isPremium ? "Revoke Premium" : "Grant Premium"}
          </Button>
        </div>
        {isSelf ? (
          <p className="text-xs text-muted-foreground">
            You can&apos;t change your own status or role.
          </p>
        ) : null}
      </div>

      {viewerIsSuperAdmin ? (
        <div className="space-y-2">
          <label htmlFor="admin-role-select" className="eyebrow block">
            Role
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={roleDraft}
              onValueChange={(value) => setRoleDraft(value as AdminRole)}
              disabled={busy || locked || isSelf}
            >
              <SelectTrigger id="admin-role-select" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-1000000">
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              disabled={busy || locked || isSelf || roleDraft === user.role}
              onClick={() => setConfirm({ kind: "role", role: roleDraft })}
            >
              Change role
            </Button>
          </div>
        </div>
      ) : null}

      {confirm && copy ? (
        <section
          role="alertdialog"
          aria-label="Confirm action"
          className="space-y-3 rounded-md border border-border bg-muted p-4"
        >
          <p className="text-sm">{copy.text}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              autoFocus
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void run(confirm)}>
              {busy ? "Working..." : copy.label}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function UserDetail({
  userId,
  initial,
  viewerId,
  viewerIsSuperAdmin,
}: {
  userId: string;
  initial?: AdminUser;
  viewerId: string;
  viewerIsSuperAdmin: boolean;
}) {
  const query = useAdminUser(userId, initial);
  const user = query.data;

  return (
    <DrawerShell
      title={user?.name ?? initial?.name ?? "User"}
      subtitle={user?.email ?? initial?.email}
    >
      {user ? (
        <UserDetailBody
          key={`${user.id}-${user.role}`}
          user={user}
          viewerId={viewerId}
          viewerIsSuperAdmin={viewerIsSuperAdmin}
        />
      ) : query.isError ? (
        <AdminErrorState
          message={toApiError(query.error).userMessage}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : (
        <AdminListSkeleton label="Loading user" />
      )}
    </DrawerShell>
  );
}
