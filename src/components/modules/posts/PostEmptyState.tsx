import { FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { routes } from "@/routes";

export function PostEmptyState({
  title,
  description,
  action,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  action?: "create" | "clear";
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-6 text-center shadow-card">
      <span className="rounded-md bg-muted p-3 text-muted-foreground">
        <FileText className="size-5" aria-hidden="true" />
      </span>
      <div className="max-w-sm space-y-2">
        <h3 className="text-base font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action === "create" ? (
        <Button asChild>
          <Link href={routes.create}>Create post</Link>
        </Button>
      ) : null}
      {action === "clear" && onAction ? (
        <Button type="button" variant="outline" onClick={onAction}>
          {actionLabel ?? "Clear search"}
        </Button>
      ) : null}
    </div>
  );
}
