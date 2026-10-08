"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePaginationSelector } from "./provider/PaginationContext";
import { getPageNumbers } from "./utils/getPageNumbers";

interface PaginationButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

function PaginationButton({
  active,
  className,
  children,
  ...props
}: PaginationButtonProps) {
  return (
    <button
      type="button"
      {...props}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex size-8 cursor-pointer items-center justify-center rounded-md text-xs transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-primary font-semibold text-primary-foreground"
          : "text-foreground hover:bg-accent",
        className,
      )}
    >
      {children}
    </button>
  );
}

// ── Connected Pagination ──────────────────────────────────────────────────────

interface PaginationProps {
  className?: string;
}

export function Pagination({ className }: PaginationProps) {
  const { currentPage, goToPage, meta } = usePaginationSelector();
  const { last_page, per_page, total } = meta;

  if (last_page <= 1) return null;

  const from = (currentPage - 1) * per_page + 1;
  const to = Math.min(currentPage * per_page, total);
  const pages = getPageNumbers(currentPage, last_page);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between gap-3", className)}
    >
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>

      <div className="flex items-center gap-1">
        <PaginationButton
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </PaginationButton>

        {pages.map((page, i) =>
          page === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1 text-xs text-muted-foreground select-none"
            >
              ...
            </span>
          ) : (
            <PaginationButton
              key={page}
              onClick={() => goToPage(page as number)}
              active={page === currentPage}
              aria-label={`Page ${page}`}
            >
              {page}
            </PaginationButton>
          ),
        )}

        <PaginationButton
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === last_page}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </PaginationButton>
      </div>
    </nav>
  );
}
