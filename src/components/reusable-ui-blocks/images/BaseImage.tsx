"use client";

import Image from "next/image";
import { useState } from "react";
import defaultImage from "@/components/reusable-ui-blocks/images/assets/placeholde_image.png";
import { cn } from "@/lib/utils";
import { ShowIf } from "../guard/ShowIf";
import type { BaseImageProps } from "./types/baseimage.type";

/*=========================================================
// This Base image is layer using next/image
// Handles fallback and loading states, and broken image gracefully.
// 
=========================================================*/
export const BaseImage = (props: BaseImageProps) => {
  const { src, fallback, alt, className, imgClass, ...rest } = props;

  // ── State ─────────────────────────────────────────────
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ── Source ─────────────────────────────────────────────
  const finalSrc = hasError || !src ? fallback || defaultImage : src;
  const isFallback = hasError || !src;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* ── Loader ── */}
      <ShowIf condition={isLoading}>
        <div
          className="absolute inset-0 animate-pulse skeletonAnimation 
                bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"
        />
      </ShowIf>

      {/* ── Image ── */}
      <Image
        key={src} // 🔥 critical fix: resets internal lifecycle cleanly
        src={finalSrc}
        alt={alt || ""}
        fill
        unoptimized
        {...rest}
        /* `imgClass` goes LAST so a caller's override actually wins. As a
				   template literal it did not: the default `object-cover` was emitted
				   after the caller's `object-contain` and, since neither is more
				   specific, stylesheet order decided it — which is why the lightbox's
				   `imgClass="object-contain"` still rendered a CROPPED image instead of
				   the whole one. cn()'s tailwind-merge drops the loser outright. */
        className={cn(
          isFallback ? "object-contain bg-gray-50 p-6" : "object-cover",
          hasError ? "opacity-40" : "opacity-100",
          imgClass,
        )}
        onError={() => setHasError(true)}
        onLoadingComplete={() => setIsLoading(false)}
      />
    </div>
  );
};

/* ======================= USAGE EXAMPLE ===================== 
    <div className={inline-block overflow-hidden size-[400px] }>
     <BaseImage src={''} className="w-full h-full" /> 
     </div> 
*/
