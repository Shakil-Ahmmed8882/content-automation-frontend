"use client";

import { Crown, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/components/reusable-ui-blocks/hooks/useDebounce";
import { BaseAvatar } from "@/components/reusable-ui-blocks/images/variations/avatar/BaseAvatar";
import { Drawer } from "@/components/reusable-ui-blocks/overlays/drawer";
import { NoResultFoundWrapper } from "@/components/reusable-ui-blocks/placeholder/no-results-found-wrapper/NoResultFoundWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminUsers } from "@/hooks/admin-user.hook";
import { useSession } from "@/hooks/auth.hook";
import { toApiError } from "@/lib/api-error";
import { routes } from "@/routes";
import type { AdminUser } from "@/types/admin.type";
import { AdminPager } from "./AdminPager";
import {
  AdminBadge,
  AdminEmptyState,
  AdminErrorState,
  AdminListSkeleton,
  AdminPageHeader,
  AdminTableShell,
  formatAdminDate,
  tdClass,
  thClass,
} from "./AdminShared";
import { UserDetail } from "./UserDetailDrawer";

const PAGE_SIZE = 10;

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const page = parsePage(searchParams.get("page"));
  const urlSearch = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debounced = useDebounce(searchInput.trim(), 300);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const query = useAdminUsers({
    page,
    limit: PAGE_SIZE,
    search: urlSearch || undefined,
  });

  const updateUrl = useCallback(
    (updates: { page?: number; search?: string }) => {
      const next = new URLSearchParams(searchParams.toString());
      if (updates.search !== undefined) {
        if (updates.search) next.set("search", updates.search);
        else next.delete("search");
      }
      if (updates.page !== undefined) {
        if (updates.page > 1) next.set("page", String(updates.page));
        else next.delete("page");
      }
      const qs = next.toString();
      router.replace(qs ? `${routes.adminUsers}?${qs}` : routes.adminUsers);
    },
    [router, searchParams],
  );

  // Debounced typing -> URL, resetting to page 1.
  // biome-ignore lint/correctness/useExhaustiveDependencies: react to the debounced term only
  useEffect(() => {
    if (debounced === urlSearch) return;
    updateUrl({ search: debounced, page: 1 });
  }, [debounced]);

  const viewer = session.data;
  const rows = query.data?.data ?? [];

  return (
    <section className="space-y-5">
      <AdminPageHeader
        eyebrow="Admin"
        title="Users"
        description="Find users, block or unblock them, grant Premium, and (super admins) change roles."
      />

      <div className="max-w-md space-y-2">
        <label htmlFor="admin-user-search" className="text-sm font-medium">
          Search users
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="admin-user-search"
            type="search"
            value={searchInput}
            maxLength={100}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name or email"
            className="pl-9"
          />
        </div>
      </div>

      {query.isPending ? (
        <AdminListSkeleton label="Loading users" />
      ) : query.isError ? (
        <AdminErrorState
          message={toApiError(query.error).userMessage}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : (
        <NoResultFoundWrapper
          data={rows}
          fallback={
            <AdminEmptyState
              title={
                urlSearch ? `No users match "${urlSearch}"` : "No users yet"
              }
              action={
                urlSearch ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearchInput("");
                      updateUrl({ search: "", page: 1 });
                    }}
                  >
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          }
        >
          <AdminTableShell label="Users">
            <thead>
              <tr>
                <th className={thClass}>User</th>
                <th className={thClass}>Role</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Premium</th>
                <th className={thClass}>Joined</th>
                <th className={thClass}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.id}>
                  <td className={tdClass}>
                    <div className="flex items-center gap-3">
                      <BaseAvatar name={user.name} alt="" size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={tdClass}>
                    <AdminBadge tone="info">{user.role}</AdminBadge>
                  </td>
                  <td className={tdClass}>
                    <div className="flex flex-wrap gap-1">
                      <AdminBadge
                        tone={user.status === "ACTIVE" ? "success" : "danger"}
                      >
                        {user.status === "ACTIVE" ? "Active" : "Blocked"}
                      </AdminBadge>
                      {user.isDeleted ? (
                        <AdminBadge tone="danger">Deleted</AdminBadge>
                      ) : null}
                    </div>
                  </td>
                  <td className={tdClass}>
                    {user.isPremium ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Crown aria-hidden="true" className="size-3.5" />
                        Premium
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className={tdClass}>{formatAdminDate(user.createdAt)}</td>
                  <td className={`${tdClass} text-right`}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected(user)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableShell>
          <AdminPager
            page={page}
            meta={query.data?.meta}
            onPageChange={(next) => updateUrl({ page: next })}
          />
        </NoResultFoundWrapper>
      )}

      <Drawer
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        initialPageId="detail"
        width={{ base: "full", md: "480px" }}
        ariaLabel={selected ? `${selected.name} details` : "User details"}
      >
        <Drawer.Page id="detail">
          {selected && viewer ? (
            <UserDetail
              userId={selected.id}
              initial={selected}
              viewerId={viewer.id}
              viewerIsSuperAdmin={viewer.role === "SUPER_ADMIN"}
            />
          ) : null}
        </Drawer.Page>
      </Drawer>
    </section>
  );
}
