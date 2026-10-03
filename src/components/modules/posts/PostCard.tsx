"use client";

import { Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { BaseImage } from "@/components/reusable-ui-blocks/images/BaseImage";
import { Button } from "@/components/ui/button";
import { routes } from "@/routes";
import type { Post } from "@/types/post.type";
import { formatPostDate, postExcerpt, postTitle } from "./post-format";

export function PostCard({
  post,
  onDelete,
  deleting = false,
}: {
  post: Post;
  onDelete: (post: Post) => void;
  deleting?: boolean;
}) {
  const title = postTitle(post);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg bg-card shadow-card">
      <Link
        href={routes.postDetail(post.id)}
        aria-label={`View ${title}`}
        className="group flex min-h-0 flex-1 flex-col focus-visible:outline-2 focus-visible:outline-ring"
      >
        {post.imageUrl ? (
          <BaseImage
            src={post.imageUrl}
            alt={title}
            className="aspect-video outline outline-1 outline-border"
            imgClass="object-cover transition-transform duration-150 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-muted text-sm text-muted-foreground">
            No image
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-3 p-4">
          <div>
            <h3 className="truncate text-base font-medium">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatPostDate(post.createdAt)}
            </p>
          </div>
          <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {postExcerpt(post.content)}
          </p>
          <p className="text-xs text-muted-foreground">
            Posts cannot be edited after saving.
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 border-t border-border p-3">
        <Button asChild variant="outline" size="sm">
          <Link href={routes.postDetail(post.id)}>
            <Eye aria-hidden="true" />
            View
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(post)}
          disabled={deleting}
          aria-label={`Delete ${title}`}
        >
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      </div>
    </article>
  );
}
