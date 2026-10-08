"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BaseImage } from "@/components/reusable-ui-blocks/images/BaseImage";
import { DeleteConfirmModal } from "@/components/reusable-ui-blocks/modal/veriations/DeleteConfirmModal";
import { NoResultFoundWrapper } from "@/components/reusable-ui-blocks/placeholder/no-results-found-wrapper/NoResultFoundWrapper";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  useAdminPlatforms,
  useSetAdminPlatformLogo,
  useUpdateAdminPlatform,
} from "@/hooks/admin-platform.hook";
import { toApiError } from "@/lib/api-error";
import type { Platform } from "@/types/admin.type";
import { AdminModal } from "./AdminModal";
import {
  AdminBadge,
  AdminEmptyState,
  AdminErrorState,
  AdminListSkeleton,
  AdminPageHeader,
  AdminTableShell,
  tdClass,
  thClass,
} from "./AdminShared";
import { PlatformForm } from "./PlatformForm";

type Editing = { mode: "create" } | { mode: "edit"; platform: Platform } | null;

export function AdminPlatformsPage() {
  const query = useAdminPlatforms();
  const update = useUpdateAdminPlatform();
  const retryLogo = useSetAdminPlatformLogo();
  const [editing, setEditing] = useState<Editing>(null);
  const [retireTarget, setRetireTarget] = useState<Platform | null>(null);
  const [failedUploads, setFailedUploads] = useState<Record<string, File>>({});

  function rememberFailedUpload(id: string, file: File) {
    setFailedUploads((current) => ({ ...current, [id]: file }));
  }

  async function toggleActive(platform: Platform, isActive: boolean) {
    try {
      await update.mutateAsync({ id: platform.id, body: { isActive } });
    } catch (error) {
      toast.error(toApiError(error).userMessage);
    }
  }

  async function confirmRetire() {
    if (!retireTarget) return;
    await toggleActive(retireTarget, false);
    setRetireTarget(null);
  }

  async function retryUpload(platform: Platform) {
    const file = failedUploads[platform.id];
    if (!file) return;
    try {
      await retryLogo.mutateAsync({ id: platform.id, file });
      setFailedUploads(({ [platform.id]: _removed, ...rest }) => rest);
    } catch {
      toast.error("The logo couldn't be uploaded.");
    }
  }

  const newButton = (
    <Button type="button" onClick={() => setEditing({ mode: "create" })}>
      <Plus aria-hidden="true" />
      New platform
    </Button>
  );

  return (
    <section className="space-y-5">
      <AdminPageHeader
        eyebrow="Admin"
        title="Platforms"
        description="Maintain the platform catalogue. Platforms are never deleted: retire one by turning it off."
        action={newButton}
      />

      {query.isPending ? (
        <AdminListSkeleton label="Loading platforms" />
      ) : query.isError ? (
        <AdminErrorState
          message={toApiError(query.error).userMessage}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : (
        <NoResultFoundWrapper
          data={query.data}
          fallback={
            <AdminEmptyState title="No platforms yet" action={newButton} />
          }
        >
          <AdminTableShell label="Platforms">
            <thead>
              <tr>
                <th className={thClass}>Logo</th>
                <th className={thClass}>Key</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Active</th>
                <th className={thClass}>Order</th>
                <th className={thClass}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((platform) => (
                <tr key={platform.id}>
                  <td className={tdClass}>
                    <BaseImage
                      src={platform.logoUrl ?? undefined}
                      alt=""
                      aria-hidden="true"
                      className="size-10 rounded-md bg-muted outline outline-1 outline-border"
                      imgClass="object-contain p-1.5"
                      sizes="40px"
                    />
                  </td>
                  <td className={`${tdClass} font-mono text-xs`}>
                    {platform.key}
                  </td>
                  <td className={tdClass}>
                    <p className="font-medium">{platform.name}</p>
                    {failedUploads[platform.id] ? (
                      <p className="mt-1 text-xs text-warning">
                        Saved, but the logo couldn&apos;t be uploaded.{" "}
                        <button
                          type="button"
                          className="underline"
                          disabled={retryLogo.isPending}
                          onClick={() => void retryUpload(platform)}
                        >
                          Retry upload
                        </button>
                      </p>
                    ) : null}
                  </td>
                  <td className={tdClass}>
                    <AdminBadge
                      tone={platform.status === "LIVE" ? "success" : "neutral"}
                    >
                      {platform.status === "LIVE" ? "Live" : "Coming soon"}
                    </AdminBadge>
                  </td>
                  <td className={tdClass}>
                    <Switch
                      checked={platform.isActive}
                      aria-label={`Active: ${platform.name}`}
                      disabled={update.isPending}
                      onCheckedChange={(checked) =>
                        checked
                          ? void toggleActive(platform, true)
                          : setRetireTarget(platform)
                      }
                    />
                  </td>
                  <td className={tdClass}>{platform.sortOrder}</td>
                  <td className={`${tdClass} text-right`}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing({ mode: "edit", platform })}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableShell>
        </NoResultFoundWrapper>
      )}

      <AdminModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === "edit" ? "Edit platform" : "New platform"}
      >
        {editing ? (
          <PlatformForm
            key={editing.mode === "edit" ? editing.platform.id : "create"}
            platform={editing.mode === "edit" ? editing.platform : undefined}
            onClose={() => setEditing(null)}
            onUploadFailed={rememberFailedUpload}
          />
        ) : null}
      </AdminModal>

      {retireTarget ? (
        <DeleteConfirmModal
          open
          title="Retire platform"
          message={`Retire ${retireTarget.name}? It will disappear from connect and publish pickers. Existing connections and history are kept.`}
          confirmLabel="Retire"
          cancelLabel="Keep active"
          loading={update.isPending}
          onConfirm={() => void confirmRetire()}
          onClose={() => {
            if (!update.isPending) setRetireTarget(null);
          }}
        />
      ) : null}
    </section>
  );
}
