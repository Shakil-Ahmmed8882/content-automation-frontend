"use client";

import { Eye } from "lucide-react";
import { BaseImage } from "@/components/reusable-ui-blocks/images/BaseImage";
import { postExcerpt } from "./post-format";

export type PreviewPlatform = {
  key: string;
  name: string;
  accountName: string | null;
};

export function PostPreview({
  platforms,
  title,
  content,
  imageUrl,
}: {
  platforms: PreviewPlatform[];
  title?: string;
  content: string;
  imageUrl?: string;
}) {
  const cleanTitle = title?.trim();
  const cleanContent = content.trim();
  return (
    <aside
      aria-label="Preview"
      aria-live="polite"
      className="space-y-4 lg:sticky lg:top-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Preview</p>
          <h2 className="text-display-sm tracking-[-0.04em]">
            Approximate rendering
          </h2>
        </div>
        <span className="rounded-md bg-muted p-2 text-muted-foreground">
          <Eye className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Real social rendering can differ after publishing.
      </p>
      {platforms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
          Select a connected platform to see its preview.
        </div>
      ) : (
        <div className="space-y-4">
          {platforms.map((platform) => (
            <article
              key={platform.key}
              className="overflow-hidden rounded-lg bg-card shadow-card"
            >
              <div
                aria-hidden="true"
                className="border-b border-border px-4 py-3"
              >
                <p className="text-sm font-medium">{platform.name}</p>
                <p className="text-xs text-muted-foreground">
                  {platform.accountName ?? "Connected account"}
                </p>
              </div>
              <div className="space-y-3 p-4">
                {cleanTitle ? (
                  <h3 className="text-base font-medium">{cleanTitle}</h3>
                ) : null}
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {cleanContent
                    ? postExcerpt(cleanContent, 280)
                    : "Your content preview will appear here."}
                </p>
                {imageUrl ? (
                  <BaseImage
                    src={imageUrl}
                    alt={cleanTitle || "Post image preview"}
                    className="aspect-video rounded-md outline outline-1 outline-border"
                    imgClass="object-cover"
                  />
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}
