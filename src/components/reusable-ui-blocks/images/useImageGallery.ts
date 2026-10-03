import { useCallback, useMemo, useState } from "react";
import type { GalleryImage } from "./ImageGallery";

/*=========================================================
// useImageGallery — owns all ImageGallery logic: which images
// are real (non-empty src) and lightbox open/navigation state.
// Keeps the component body free of filtering / index math.
=========================================================*/

// Treat null / undefined / empty / whitespace-only src as "no image".
function isValidImage(
  img: GalleryImage | null | undefined,
): img is GalleryImage {
  return typeof img?.src === "string" && img.src.trim().length > 0;
}

export function useImageGallery(
  images: Array<GalleryImage | null | undefined>,
) {
  const validImages = useMemo(() => images.filter(isValidImage), [images]);
  const hasImages = validImages.length > 0;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) =>
      i == null ? 0 : (i - 1 + validImages.length) % validImages.length,
    );
  }, [validImages.length]);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i == null ? 0 : (i + 1) % validImages.length));
  }, [validImages.length]);

  return {
    validImages,
    hasImages,
    lightboxIndex,
    openLightbox,
    closeLightbox,
    goPrev,
    goNext,
  };
}
