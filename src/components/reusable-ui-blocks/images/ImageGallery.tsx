"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShowIf } from "../guard/ShowIf";
import { BaseImage } from "./BaseImage";
import { useImageGallery } from "./useImageGallery";

/*=========================================================
// ImageGallery — thumbnail row + click-to-enlarge lightbox.
//
// The lightbox uses a dimmed dark backdrop built from the page token, so the
// page stays faintly visible behind the centered image.
=========================================================*/
export interface GalleryImage {
  src: string;
  alt?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  thumbnailClassName?: string;
  /** The thumbnail row itself. Defaults to the wrapping, fixed-size-tile
   * layout; pass a single-row flex to let the tiles divide the width instead
   * (see TaskAttachmentsSection). */
  containerClassName?: string;
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

export interface LightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Exported for the callers whose thumbnail is NOT this component's own tile —
 * a tile carrying its own overlay controls (a download button, a caption) can
 * pair `useImageGallery` with this viewer instead of reimplementing it. Prefer
 * plain `<ImageGallery />` when a bare thumbnail row is all that's needed.
 */
export function Lightbox(props: LightboxProps) {
  const { images, currentIndex, onClose, onPrev, onNext } = props;
  const hasMultiple = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        aria-label="Close gallery"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <X className="size-5" />
      </button>

      {/* Prev arrow */}
      <ShowIf condition={hasMultiple}>
        <button
          type="button"
          aria-label="Previous image"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ChevronLeft className="size-6" />
        </button>
      </ShowIf>

      {/* Image — only the image area is prominent; the backdrop stays light. */}
      <div
        className="relative mx-16 w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex h-[80vh] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-card shadow-modal">
          <BaseImage
            src={images[currentIndex].src}
            alt={images[currentIndex].alt ?? `Image ${currentIndex + 1}`}
            className="size-full"
            imgClass="object-contain"
          />
        </div>

        <ShowIf condition={hasMultiple}>
          <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
            {currentIndex + 1} / {images.length}
          </p>
        </ShowIf>
      </div>

      {/* Next arrow */}
      <ShowIf condition={hasMultiple}>
        <button
          type="button"
          aria-label="Next image"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ChevronRight className="size-6" />
        </button>
      </ShowIf>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ImageGallery(props: ImageGalleryProps) {
  const {
    images,
    thumbnailClassName = "size-[100px]",
    containerClassName,
  } = props;
  const {
    validImages,
    hasImages,
    lightboxIndex,
    openLightbox,
    closeLightbox,
    goPrev,
    goNext,
  } = useImageGallery(images);

  // No real images → render nothing at all.
  if (!hasImages) return null;

  return (
    <>
      <div
        className={cn("flex flex-wrap items-center gap-2", containerClassName)}
      >
        {validImages.map((img, idx) => (
          <button
            key={`${img.src}-${idx}`}
            type="button"
            aria-label={`View image ${idx + 1}`}
            onClick={() => openLightbox(idx)}
            className={cn(
              "relative shrink-0 cursor-pointer overflow-hidden rounded-[9px] bg-muted transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              thumbnailClassName,
            )}
          >
            <BaseImage
              src={img.src}
              alt={img.alt ?? `Image ${idx + 1}`}
              className="size-full"
              imgClass="object-cover"
            />
          </button>
        ))}
      </div>

      <ShowIf condition={lightboxIndex != null}>
        <Lightbox
          images={validImages}
          currentIndex={lightboxIndex ?? 0}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
        />
      </ShowIf>
    </>
  );
}
