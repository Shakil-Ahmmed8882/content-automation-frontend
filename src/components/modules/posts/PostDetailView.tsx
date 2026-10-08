"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PublishPanel } from "@/components/modules/executions/PublishPanel";
import { CenteredError } from "@/components/modules/shared/CenteredError";
import { BaseImage } from "@/components/reusable-ui-blocks/images/BaseImage";
import { DeleteConfirmModal } from "@/components/reusable-ui-blocks/modal/veriations/DeleteConfirmModal";
import { BaseSkeleton } from "@/components/reusable-ui-blocks/placeholder/skeletons/BaseSkeleton";
import { Button } from "@/components/ui/button";
import { useDeletePost, usePost } from "@/hooks/post.hook";
import { toApiError } from "@/lib/api-error";
import { routes } from "@/routes";
import { PostEmptyState } from "./PostEmptyState";
import { PostNotice } from "./PostNotice";
import { formatPostDate, postTitle } from "./post-format";

function PostDetailSkeleton() {
  return (
    <output aria-label="Loading post" className="block space-y-6">
      <BaseSkeleton className="h-8 w-40" />
      <BaseSkeleton className="h-12 w-3/4" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(280px,2fr)]">
        <div className="space-y-3">
          <BaseSkeleton className="h-5 w-full" />
          <BaseSkeleton className="h-5 w-11/12" />
          <BaseSkeleton className="h-5 w-4/5" />
          <BaseSkeleton className="aspect-video w-full" />
        </div>
        <BaseSkeleton className="h-64 w-full" />
      </div>
    </output>
  );
}

export function PostDetailView({ id }: { id: string }) {
  const router = useRouter();
  const query = usePost(id);
  const deleteMutation = useDeletePost();
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function confirmDelete() {
    if (!query.data || deleteMutation.isPending) return;
    try {
      await deleteMutation.mutateAsync(query.data.id);
      toast.success("Post deleted.");
      router.replace(routes.dashboard);
    } catch (error) {
      toast.error(toApiError(error).userMessage);
    }
  }

  if (query.isPending) return <PostDetailSkeleton />;

  if (query.isError) {
    const failure = toApiError(query.error);
    if (failure.status === 404) {
      return (
        <PostEmptyState
          title="Post not found"
          description="It may have been deleted."
          action="clear"
          actionLabel="Back to dashboard"
          onAction={() => router.push(routes.dashboard)}
        />
      );
    }
    return (
      <CenteredError
        title="Couldn't load this post."
        message={failure.userMessage}
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          Try again
        </Button>
      </CenteredError>
    );
  }

  const post = query.data;
  const title = postTitle(post);

  return (
    <article className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href={routes.dashboard}>
          <ArrowLeft aria-hidden="true" />
          Back to dashboard
        </Link>
      </Button>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-3">Saved post</p>
          <h1 className="break-words text-display-lg tracking-[-0.04em]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Created {formatPostDate(post.createdAt)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setDeleteOpen(true)}
          disabled={deleteMutation.isPending}
        >
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(280px,2fr)]">
        <section
          aria-labelledby="post-content-heading"
          className="min-w-0 space-y-5 rounded-lg bg-card p-5 shadow-card sm:p-6"
        >
          <h2 id="post-content-heading" className="text-base font-medium">
            Content
          </h2>
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
            {post.content}
          </p>
          {post.imageUrl ? (
            <BaseImage
              src={post.imageUrl}
              alt={title || "Post image"}
              className="aspect-video rounded-lg outline outline-1 outline-border"
              imgClass="object-cover"
            />
          ) : null}
          <PostNotice>
            Posts cannot be edited after saving. Delete this post and create a
            new one if you need different content.
          </PostNotice>
        </section>
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <PublishPanel postId={post.id} />
        </aside>
      </div>
      {deleteOpen ? (
        <DeleteConfirmModal
          open
          title="Delete post"
          message={`Delete “${title}”? This saved post will be removed from your library.`}
          confirmLabel="Delete post"
          cancelLabel="Keep post"
          loading={deleteMutation.isPending}
          onConfirm={confirmDelete}
          onClose={() => {
            if (!deleteMutation.isPending) setDeleteOpen(false);
          }}
        />
      ) : null}
    </article>
  );
}
