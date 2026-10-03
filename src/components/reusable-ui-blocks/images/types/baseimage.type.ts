import type { ImageProps, StaticImageData } from "next/image";

export interface BaseImageProps extends Omit<ImageProps, "src" | "alt"> {
  src?: string | null;
  alt?: string;
  fallback?: string | StaticImageData;
  className?: string;
  imgClass?: string;
}
