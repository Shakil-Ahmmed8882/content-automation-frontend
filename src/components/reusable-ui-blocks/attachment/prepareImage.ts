/*=========================================================
// Make a picked file into something POST /v3/tasks will actually accept.
//
// Two distinct failures, one canvas pass:
//
//   1. CONTAINER. Laravel decides a file's type by SNIFFING ITS BYTES
//      (`validateMimes` -> `$value->guessExtension()` -> finfo), never by the
//      filename or the Content-Type the browser sent. A file called `photo.png`
//      that is really AVIF inside is therefore rejected — while the browser
//      reports `type: "image/png"`, previews it happily, and decodes it in
//      `createImageBitmap` without complaint. Nothing client-side notices.
//
//   2. SIZE. The housekeeper rule is `max:2048`, i.e. 2 MB, which a modern
//      phone photo clears only by luck.
//
// The mobile app sidesteps both by always re-encoding at pick time — every
// file in its successful payload is named `compressed_image_picker_*.jpg`.
// This does the same, but only when one of the two conditions actually
// applies, so an ordinary JPEG keeps its original bytes and quality.
=========================================================*/

/** Re-encoding target: in every rule this endpoint applies, and the best
 * photographic format among them. */
const OUTPUT_TYPE = "image/jpeg";
const OUTPUT_EXTENSION = ".jpg";

/**
 * Containers that pass server-side validation UNCHANGED, so re-encoding them
 * would only cost quality.
 *
 * This is the INTERSECTION of the two rules this one field feeds, because a
 * single attachment list serves both roles:
 *
 *   housekeeper   mimes:jpeg,png,jpg,gif,svg          (StoreTaskActionV2:81)
 *   maintenance   image  -> jpg,jpeg,png,gif,bmp,webp (Laravel validateImage)
 *
 * bmp and webp are absent from the first; svg from the second. What survives
 * both is jpeg, png and gif — and gif is here specifically so an animation is
 * never flattened into a single frame by the canvas.
 */
const PASSES_UNCHANGED = new Set(["image/jpeg", "image/png", "image/gif"]);

/** Longest edge, in px, before an oversized image is scaled down. Comfortably
 * above any surface that displays these photos. */
const MAX_DIMENSION = 2048;

/** Descends only as far as the size target demands. */
const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.5];

/** Applied when even the lowest quality misses the target — a very large flat
 * image is bound by pixel count, not by quality. */
const DIMENSION_RETRIES = [1, 0.75, 0.5];

type Options = {
  /** Ceiling the result should come in under, in bytes. */
  maxBytes: number;
};

/**
 * The real container, read from the leading bytes — the same evidence the
 * server uses, and the only thing that disagrees with `file.type` on exactly
 * the files that fail.
 *
 * Returns null when the signature is unrecognised, which is treated as "not
 * known to pass" and re-encoded rather than gambled on.
 */
async function sniffType(file: File): Promise<string | null> {
  let head: Uint8Array;
  try {
    head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  } catch {
    return null;
  }

  const at = (index: number) => head[index];
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...head.slice(start, end));

  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "image/jpeg";
  if (at(0) === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 3) === "GIF") return "image/gif";
  if (at(0) === 0x42 && at(1) === 0x4d) return "image/bmp";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";

  // ISO-BMFF family: `....ftyp<brand>` — AVIF and HEIC both live here, and
  // AVIF is what a saved-from-the-web "png" most often turns out to be.
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (brand.startsWith("avif") || brand.startsWith("avis"))
      return "image/avif";
    return "image/heic";
  }

  return null;
}

function toBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, OUTPUT_TYPE, quality));
}

/** `holiday snap.png` -> `holiday snap.jpg`. */
function toJpegName(name: string): string {
  return `${name.replace(/\.[^./\\]+$/, "")}${OUTPUT_EXTENSION}`;
}

/**
 * Returns a server-acceptable version of `file`, or the ORIGINAL when no
 * change is needed or possible. Never throws, never returns something larger
 * than it was given — so the caller always has a usable File and still applies
 * its own size check to the result.
 */
export async function prepareImage(
  file: File,
  options: Options,
): Promise<File> {
  const { maxBytes } = options;

  const realType = await sniffType(file);
  const wrongContainer = realType === null || !PASSES_UNCHANGED.has(realType);
  const tooLarge = file.size > maxBytes;

  if (!wrongContainer && !tooLarge) return file;
  if (typeof createImageBitmap === "undefined") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // Undecodable — the field's own probe reports that properly.
  }

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return file;

    // Only shrink an image that is actually over the ceiling; one that is
    // merely in the wrong container keeps its full resolution.
    const baseScale = tooLarge
      ? Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
      : 1;

    let smallest: Blob | null = null;

    for (const retry of DIMENSION_RETRIES) {
      const scale = baseScale * retry;
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));

      /* JPEG has no alpha: a transparent PNG would composite onto black
       * without this, turning a screenshot's background into a slab. */
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of QUALITY_STEPS) {
        const blob = await toBlob(canvas, quality);
        if (!blob) continue;
        if (!smallest || blob.size < smallest.size) smallest = blob;

        if (blob.size <= maxBytes) {
          return new File([blob], toJpegName(file.name), {
            type: OUTPUT_TYPE,
            lastModified: file.lastModified,
          });
        }
      }

      // Container was the only problem and the first pass already produced a
      // valid JPEG — no reason to keep shrinking for a size target that was
      // never the issue.
      if (!tooLarge) break;
    }

    if (smallest && (!tooLarge || smallest.size < file.size)) {
      return new File([smallest], toJpegName(file.name), {
        type: OUTPUT_TYPE,
        lastModified: file.lastModified,
      });
    }

    return file;
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}
