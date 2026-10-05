"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BaseImage } from "@/components/reusable-ui-blocks/images/BaseImage";
import { DeleteConfirmModal } from "@/components/reusable-ui-blocks/modal/veriations/DeleteConfirmModal";
import { NoResultFoundWrapper } from "@/components/reusable-ui-blocks/placeholder/no-results-found-wrapper/NoResultFoundWrapper";
import { Button } from "@/components/ui/button";
import {
  useAdminFeatures,
  useDeleteAdminFeature,
  useSetAdminFeatureImage,
} from "@/hooks/admin-feature.hook";
import { toApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { AdminFeature, FeatureStatus } from "@/types/admin.type";
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
import { FeatureForm } from "./FeatureForm";

const statusLabel: Record<FeatureStatus, string> = {
  COMING_SOON: "Coming soon",
  IN_DEVELOPMENT: "In development",
  PLANNED: "Planned",
};

type Editing = { mode: "create" } | { mode: "edit"; feature: AdminFeature } | null;

export function AdminFeaturesPage() {
  const query = useAdminFeatures();
  const remove = useDeleteAdminFeature();
  const retryImage = useSetAdminFeatureImage();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminFeature | null>(null);
  const [failedUploads, setFailedUploads] = useState<Record<string, File>>({});

  function rememberFailedUpload(id: string, file: File) {
    setFailedUploads((current) => ({ ...current, [id]: file }));
  }

  async function retryUpload(feature: AdminFeature) {
    const file = failedUploads[feature.id];
    if (!file) return;
    try {
      await retryImage.mutateAsync({ id: feature.id, file });
      setFailedUploads(({ [feature.id]: _removed, ...rest }) => rest);
    } catch (error) {
      toast.error(toApiError(error).userMessage);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || remove.isPending) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // The hook already toasted the backend message.
    }
  }

  const newButton = (
    <Button type="button" onClick={() => setEditing({ mode: "create" })}>
      <Plus aria-hidden="true" />
      New feature
    </Button>
  );

  return (
    <section className="space-y-5">
      <AdminPageHeader
        eyebrow="Admin"
        title="Upcoming features"
        description="Everything Premium members see on the roadmap, including hidden items."
        action={newButton}
      />

      {query.isPending ? (
        <AdminListSkeleton label="Loading features" />
      ) : query.isError ? (
        <AdminErrorState
          message={toApiError(query.error).userMessage}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : (
        <NoResultFoundWrapper
          data={query.data}
          fallback={<AdminEmptyState title="No features yet" action={newButton} />}
        >
          <AdminTableShell label="Upcoming features">
            <thead>
              <tr>
                <th className={thClass}>Image</th>
                <th className={thClass}>Title</th>
                <th className={thClass}>Slug</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Visible</th>
                <th className={thClass}>Order</th>
                <th className={thClass}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((feature) => (
                <tr
                  key={feature.id}
                  className={cn(!feature.isPremiumVisible && "opacity-60")}
                >
                  <td className={tdClass}>
                    <BaseImage
                      src={feature.imageUrl ?? undefined}
                      alt=""
                      aria-hidden="true"
                      className="h-10 w-16 rounded-md bg-muted outline outline-1 outline-border"
                      imgClass="object-cover"
                      sizes="64px"
                    />
                  </td>
                  <td className={tdClass}>
                    <p className="font-medium">{feature.title}</p>
                    {failedUploads[feature.id] ? (
                      <p className="mt-1 text-xs text-warning">
                        Saved, but the image couldn&apos;t be uploaded.{" "}
                        <button
                          type="button"
                          className="underline"
                          disabled={retryImage.isPending}
                          onClick={() => void retryUpload(feature)}
                        >
                          Retry upload
                        </button>
                      </p>
                    ) : null}
                  </td>
                  <td className={`${tdClass} font-mono text-xs`}>
                    {feature.slug}
                  </td>
                  <td className={tdClass}>
                    <AdminBadge>{statusLabel[feature.status]}</AdminBadge>
                  </td>
                  <td className={tdClass}>
                    {feature.isPremiumVisible ? (
                      <AdminBadge tone="success">Visible</AdminBadge>
                    ) : (
                      <AdminBadge tone="warning">Hidden</AdminBadge>
                    )}
                  </td>
                  <td className={tdClass}>{feature.sortOrder}</td>
                  <td className={`${tdClass} text-right`}>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing({ mode: "edit", feature })}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(feature)}
                      >
                        Delete
                      </Button>
                    </div>
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
        title={editing?.mode === "edit" ? "Edit feature" : "New feature"}
      >
        {editing ? (
          <FeatureForm
            key={editing.mode === "edit" ? editing.feature.id : "create"}
            feature={editing.mode === "edit" ? editing.feature : undefined}
            onClose={() => setEditing(null)}
            onUploadFailed={rememberFailedUpload}
          />
        ) : null}
      </AdminModal>

      {deleteTarget ? (
        <DeleteConfirmModal
          open
          title="Delete feature"
          message={`Delete ${deleteTarget.title}? This can't be undone. To hide it from Premium users without deleting, turn off "Visible to Premium".`}
          confirmLabel="Delete"
          cancelLabel="Keep feature"
          loading={remove.isPending}
          onConfirm={() => void confirmDelete()}
          onClose={() => {
            if (!remove.isPending) setDeleteTarget(null);
          }}
        />
      ) : null}
    </section>
  );
}
