import type { Post } from "@/types/post.type";

export function postTitle(post: Pick<Post, "title">) {
  return post.title?.trim() || "Untitled post";
}

export function postExcerpt(content: string, length = 140) {
  const compact = content.replace(/\s+/g, " ").trim();
  if (compact.length <= length) return compact;
  return `${compact.slice(0, length - 1).trimEnd()}…`;
}

export function formatPostDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
