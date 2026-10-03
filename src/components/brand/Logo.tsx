import Link from "next/link";
import { cn } from "@/lib/utils";

// Same glyph as public/logo.svg and the favicon (src/app/icon.svg) — keep the three in sync.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-7", className)}
    >
      <rect width="32" height="32" rx="7" fill="#ededed" />
      <path
        d="M7 16h6.5M13.5 16c3.5 0 3.5-7 9-7M13.5 16c3.5 0 3.5 7 9 7"
        stroke="#0a0a0a"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23.5" cy="9" r="2" fill="#0a0a0a" />
      <circle cx="23.5" cy="23" r="2" fill="#0a0a0a" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Content Automation — home"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <LogoMark />
      <span className="text-sm font-semibold tracking-tight">
        Content Automation
      </span>
    </Link>
  );
}
