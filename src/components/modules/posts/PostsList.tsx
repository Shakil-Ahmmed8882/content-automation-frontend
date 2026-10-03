"use client";

import { PenSquare, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/components/reusable-ui-blocks/hooks/useDebounce";
import { DeleteConfirmModal } from "@/components/reusable-ui-blocks/modal/veriations/DeleteConfirmModal";
import { InfiniteScrollProvider } from "@/components/reusable-ui-blocks/pagination/infinite-scroll/provider/InfiniteScrollProvider";
import { InfiniteScrollRenderer } from "@/components/reusable-ui-blocks/pagination/infinite-scroll/ui/InfiniteScrollRenderer";
import { NoResultFoundWrapper } from "@/components/reusable-ui-blocks/placeholder/no-results-found-wrapper/NoResultFoundWrapper";
import { CardSkeletonV2List } from "@/components/reusable-ui-blocks/placeholder/skeletons/CardSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeletePost, useInfinitePosts } from "@/hooks/post.hook";
import { toApiError } from "@/lib/api-error";
import { routes } from "@/routes";
import type { Post, PostSort } from "@/types/post.type";
import { PostCard } from "./PostCard";
import { PostEmptyState } from "./PostEmptyState";
import { PostNotice } from "./PostNotice";
import { postTitle } from "./post-format";

const sortOptions: { value: PostSort; label: string }[] = [
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
  { value: "title", label: "Title A-Z" },
  { value: "-title", label: "Title Z-A" },
];

export function PostsList() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<PostSort>("-createdAt");
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const debouncedSearch = useDebounce(search.trim(), 300);
  const query = useInfinitePosts({ search: debouncedSearch, sort });
  const deleteMutation = useDeletePost();
  const posts = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;
  const hasInitialError = query.isError && posts.length === 0;
  const hasPaginationError = query.isError && posts.length > 0;

  async function confirmDelete() {
    if (!deleteTarget || deleteMutation.isPending) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Post deleted.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(toApiError(error).userMessage);
    }
  }

  return (
    <section aria-labelledby="posts-list-heading" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Library</p>
          <h2
            id="posts-list-heading"
            className="text-display-sm tracking-[-0.04em]"
          >
            Your posts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse saved posts. Posts cannot be edited after saving.
          </p>
        </div>
        <Button asChild>
          <Link href={routes.create}>
            <PenSquare aria-hidden="true" />
            Create post
          </Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-2">
          <label htmlFor="post-search" className="text-sm font-medium">
            Search posts
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="post-search"
              type="search"
              value={search}
              maxLength={100}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or content"
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="post-sort" className="text-sm font-medium">
            Sort
          </label>
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as PostSort)}
          >
            <SelectTrigger id="post-sort" className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {query.isPending ? (
        <CardSkeletonV2List />
      ) : hasInitialError ? (
        <PostNotice tone="error">
          <p>Could not load your posts.</p>
          <p className="mt-1 text-muted-foreground">
            {toApiError(query.error).userMessage}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            Try again
          </Button>
        </PostNotice>
      ) : (
        <NoResultFoundWrapper
          data={posts}
          fallback={
            debouncedSearch ? (
              <PostEmptyState
                title={`No results for “${debouncedSearch}”`}
                description="Try a different title or content search."
                action="clear"
                onAction={() => setSearch("")}
              />
            ) : (
              <PostEmptyState
                title="No posts yet"
                description="Write your first post and publish it to LinkedIn and Facebook."
                action="create"
              />
            )
          }
        >
          <InfiniteScrollProvider query={query}>
            <InfiniteScrollRenderer
              paginationSkeleton={<CardSkeletonV2List className="mt-2" />}
            >
              <p className="sr-only" aria-live="polite">
                {total} posts loaded.
              </p>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <li key={post.id}>
                    <PostCard
                      post={post}
                      onDelete={setDeleteTarget}
                      deleting={
                        deleteMutation.isPending && deleteTarget?.id === post.id
                      }
                    />
                  </li>
                ))}
              </ul>
              {hasPaginationError ? (
                <PostNotice tone="error">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>Could not load more posts.</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void query.fetchNextPage()}
                    >
                      Retry
                    </Button>
                  </div>
                </PostNotice>
              ) : null}
            </InfiniteScrollRenderer>
          </InfiniteScrollProvider>
        </NoResultFoundWrapper>
      )}
      {deleteTarget ? (
        <DeleteConfirmModal
          open
          title="Delete post"
          message={`Delete “${postTitle(deleteTarget)}”? This saved post will be removed from your library.`}
          confirmLabel="Delete post"
          cancelLabel="Keep post"
          loading={deleteMutation.isPending}
          onConfirm={confirmDelete}
          onClose={() => {
            if (!deleteMutation.isPending) setDeleteTarget(null);
          }}
        />
      ) : null}
    </section>
  );
}
