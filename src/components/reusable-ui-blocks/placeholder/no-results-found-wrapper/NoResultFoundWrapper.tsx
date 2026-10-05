"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import no_content_icon from "@/components/reusable-ui-blocks/placeholder/no-results-found-wrapper/no_content_icon.svg";

// ============================================================
// NoResultFoundWrapper
// Wraps any list: renders children when data is non-empty,
// renders a fallback placeholder when data is empty.
// ============================================================

type NoResultFoundWrapperProps<T> = {
  data: T[];
  children: ReactNode;
  /** Completely replace the placeholder UI */
  fallback?: ReactNode;
  /** Override the placeholder icon (shown when no custom fallback) */
  icon?: ReactNode;
  /** Override the placeholder title */
  title?: string;
  /** Override the placeholder message */
  message?: string;
  showTryAgain?: boolean;
};

export function NoResultFoundWrapper<T>(props: NoResultFoundWrapperProps<T>) {
  const {
    data,
    children,
    fallback,
    icon,
    title = "No results found",
    message = "Please try again later",
    showTryAgain = false,
  } = props;

  if (data.length > 0) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 px-6 font-proxima-nova">
      {/* Icon */}
      <div className="flex items-center justify-center size-25 rounded-full ">
        {icon ?? (
          <Image
            src={no_content_icon}
            alt="No results"
            width={100}
            height={100}
          />
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-2 text-center max-w-xs">
        <p className="text-foreground text-[28px] font-bold leading-snug">
          {title}
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
      </div>

      {/* Try Again */}
      {showTryAgain && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md 
						text-primary-foreground bg-primary cursor-pointer text-sm font-semibold font-proxima-nova
						hover:bg-primary/80 transition-colors duration-200"
        >
          <RotateCcw className="size-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

/*
HOW TO USE: 
======================================


		<CustomSuspense fallback={<MissedClockInListSkeleton />} isLoading={missed.isPending}>
			👉 <NoResultFoundWrapper data={users} title="No missed clock-ins">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 w-full">
					{users?.map((user) => (
						<MissedClockInCard key={user.id} user={user} />
					))}
				</div>
			 </NoResultFoundWrapper>
		</CustomSuspense>


*/
