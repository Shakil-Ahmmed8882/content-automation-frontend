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
      {...props}
      className={cn(
        "size-8 rounded-full flex items-center justify-center text-xs font-proxima-nova transition-colors cursor-pointer",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        active
          ? "bg-primary text-white font-semibold"
          : "text-[#292929] hover:bg-gray-100",
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
    <div className={cn("flex items-center justify-between", className)}>
      <p className="text-xs text-[#666] font-proxima-nova">
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
              className="px-1 text-xs text-[#666] select-none"
            >
              ...
            </span>
          ) : (
            <PaginationButton
              key={page}
              onClick={() => goToPage(page as number)}
              active={page === currentPage}
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
    </div>
  );
}
