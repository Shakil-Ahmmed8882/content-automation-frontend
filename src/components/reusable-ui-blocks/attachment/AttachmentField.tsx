"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { prepareImage } from "./prepareImage";

/*=========================================================
// Attachment field — the preview grid and the "add" box are ONE grid.
//
// Two fixed columns, so the add box always lands in the next free cell:
// beside a single photo, under a pair, bottom-right of three. It only
// spans the full width when there is nothing to preview yet.
//
// Tiles are deliberately short and top-cropped (object-top): a portrait
// photo rendered at its own ratio pushes the rest of the form off screen.
=========================================================*/
const TILE_CLASS = "h-28 w-full overflow-hidden rounded-md";

/** Why each rejected file was turned away — one list per cause, so the notice
 * below the grid can state the real reason instead of a catch-all. */
type Rejections = {
  wrongType: string[];
  tooLarge: string[];
  unreadable: string[];
};

/** A FACTORY, not a shared constant: the arrays are pushed into, so handing the
 * same object to two picks would accumulate names across both. */
const emptyRejections = (): Rejections => ({
  wrongType: [],
  tooLarge: [],
  unreadable: [],
});

/** `2048` -> `"2 MB"`, `512` -> `"512 KB"`. Stated in the unit the person
 * recognises from their own file browser, not the KB the API talks in. */
function formatSizeLimit(kb: number): string {
  return kb >= 1024 ? `${Number((kb / 1024).toFixed(1))} MB` : `${kb} KB`;
}

type Props = {
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  /** Passed straight to the input. Also enforced on the picked files, since
   * `accept` is only a filter hint — a user can still choose "All files". */
  accept?: string;
  /** Per-file ceiling in KILOBYTES, stated the way the API states its own
   * limit (Laravel's `max:` rule is in KB). Omit for no limit. Anything over
   * is rejected here rather than uploaded and 422'd after the wait — so it
   * must match the endpoint being posted to, not a guess. */
  maxSizeKb?: number;
  /** Fires whenever files are turned away, and again when that notice clears.
   *
   * A rejected file is simply absent from `files` — the form stays valid and
   * submittable, so without this the surrounding page happily saves a record
   * the person believes has a photo on it. A caller that owns a submit button
   * should hold this in state and disable while it is true. MUST be a stable
   * reference (a `useState` setter, or a `useCallback`): it is an effect
   * dependency. */
  onRejectedChange?: (hasRejected: boolean) => void;
};

export function AttachmentField(props: Props) {
  const {
    files,
    onAdd,
    onRemove,
    accept = "image/*",
    maxSizeKb,
    onRejectedChange,
  } = props;
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  /* Rejections are kept SEPARATE per cause. Merged into one list they had to
   * share one sentence ("unsupported file type or too large"), which named the
   * wrong reason for two of the three cases and never stated the ceiling — so
   * someone whose 4 MB photo bounced off a 2 MB limit had nothing to act on. */
  const [rejected, setRejected] = useState<Rejections>(emptyRejections);

  /** Splits a pick on DECLARED TYPE alone. Size is deliberately not judged
   * here: an oversized photo gets a compression pass first (see the handler
   * below), so the ceiling has to be applied to what will actually be
   * uploaded, not to what came off the disk. */
  const filterAccepted = (picked: File[]) => {
    const allowed = accept
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);

    const matchesAccept = (file: File) => {
      const type = file.type.toLowerCase();
      const name = file.name.toLowerCase();

      return allowed.some((entry) => {
        if (entry.endsWith("/*")) return type.startsWith(entry.slice(0, -1));
        if (entry.startsWith(".")) return name.endsWith(entry);
        return type === entry;
      });
    };

    return picked.reduce<{ ok: File[]; wrongType: string[] }>(
      (acc, file) => {
        if (matchesAccept(file)) acc.ok.push(file);
        else acc.wrongType.push(file.name);
        return acc;
      },
      { ok: [], wrongType: [] },
    );
  };

  /**
   * Confirms a file that passed the metadata check above is an actually
   * decodable image, not just one carrying an image/* MIME type.
   *
   * `file.type` is asserted by the browser/OS at selection time and is never
   * verified against the real bytes — a truncated, empty, or corrupt file
   * (a platform photo-picker quirk, an interrupted write, a mis-tagged
   * export) sails through `filterAccepted` unchanged. Left unchecked, that
   * file travels all the way through the form and the upload only to fail at
   * the backend's own image validation — which, for this endpoint, answers
   * with a bare "Some Tasks Could Not Be Created" and no field-level reason
   * at all, so the person has no way to learn it was the photo. Rejecting a
   * bad file here, immediately, with a real reason is the only place in this
   * flow that can give that feedback.
   *
   * `createImageBitmap` is used only as a decode probe — the bitmap itself is
   * discarded immediately (`close()`), never rendered; the existing preview
   * grid still renders from `file` via `URL.createObjectURL`.
   */
  const isDecodableImage = async (file: File): Promise<boolean> => {
    if (typeof createImageBitmap === "undefined") return true; // no probe available; don't block on it
    try {
      const bitmap = await createImageBitmap(file);
      bitmap.close();
      return true;
    } catch {
      return false;
    }
  };

  /*
   * Created AND revoked inside the same effect. Building them in a useMemo
   * instead leaks a revoked url under StrictMode: the memo survives the
   * simulated remount while the effect cleanup has already revoked what it
   * produced, so every tile falls back to its filename on a grey box.
   */
  const [urls, setUrls] = useState<string[]>([]);
  const [failed, setFailed] = useState<number[]>([]);

  useEffect(() => {
    const created = files.map((file) => URL.createObjectURL(file));
    setUrls(created);
    setFailed([]);
    return () => created.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const hasRejections =
    rejected.wrongType.length +
      rejected.tooLarge.length +
      rejected.unreadable.length >
    0;

  /* Mirrors the notice into the caller so a submit button can wait for it.
   * The cleanup matters: this field unmounts when the wizard switches task-type
   * tabs, and a caller left holding `true` would be blocked by a message that
   * is no longer on screen. */
  useEffect(() => {
    onRejectedChange?.(hasRejections);
    return () => onRejectedChange?.(false);
  }, [hasRejections, onRejectedChange]);

  /* Re-opening the picker retires the previous notice. Without this the only
   * way past a rejection would be to succeed at picking something else —
   * someone who simply decided to continue without the photo would be stuck
   * behind a disabled button. Cancelling the dialog is the deliberate escape:
   * the notice is gone and nothing was added. */
  const pick = () => {
    setRejected(emptyRejections());
    inputRef.current?.click();
  };

  return (
    <div className="grid w-full grid-cols-2 gap-3">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className={cn(
            TILE_CLASS,
            "group relative border border-border bg-muted transition-transform duration-200 hover:-translate-y-1 hover:shadow-float",
          )}
        >
          {failed.includes(index) || !urls[index] ? (
            <span className="flex size-full items-center justify-center px-2 text-center font-proxima-nova text-xs text-muted-foreground">
              {file.name}
            </span>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={urls[index]}
              alt={file.name}
              className="size-full object-cover object-top"
              onError={() => setFailed((current) => [...current, index])}
            />
          )}

          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={t("remove", "Remove")}
            className="absolute top-2 right-2 flex size-6 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground opacity-0 shadow-sm transition-opacity outline-none group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <X className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={pick}
        className={cn(
          TILE_CLASS,
          "flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-input bg-muted/40 transition-colors outline-none hover:border-ring hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          files.length === 0 && "col-span-2",
        )}
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-primary-subtle text-primary">
          <ImagePlus className="size-4.5" />
        </span>
        <span className="font-proxima-nova text-sm leading-5 font-semibold text-primary">
          {files.length === 0
            ? t("addPhoto", "Add Photo")
            : t("addMore", "Add More")}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={async (event) => {
          const picked = Array.from(event.target.files ?? []);
          event.target.value = "";

          /*
           * Four gates, in this order, because each depends on the one
           * before it:
           *
           *   declared type -> decodable? -> prepare -> size
           *
           * `prepare` is where a file whose BYTES are a container the
           * server rejects (an AVIF saved as `photo.png` is the one that
           * reached production) becomes a real JPEG. Nothing earlier can
           * catch that: the extension, `file.type` and the preview all
           * agree with each other and all disagree with the file.
           *
           * Size is judged LAST, on the prepared result — checking the
           * picked file would reject a 6 MB photo that comes out at 1.2 MB.
           */
          const { ok, wrongType } = filterAccepted(picked);

          const decodable = await Promise.all(ok.map(isDecodableImage));
          const readable = ok.filter((_, i) => decodable[i]);
          const unreadable = ok
            .filter((_, i) => !decodable[i])
            .map((file) => file.name);

          /* Runs even with no ceiling declared: the size target is only half
           * of what this does. The other half — re-encoding a file whose
           * real container the server will not take, whatever its name or
           * declared type says — applies to every caller. */
          const sized = await Promise.all(
            readable.map((file) =>
              prepareImage(file, { maxBytes: (maxSizeKb ?? Infinity) * 1024 }),
            ),
          );

          const good: File[] = [];
          const tooLarge: string[] = [];
          sized.forEach((file, index) => {
            if (maxSizeKb != null && file.size > maxSizeKb * 1024) {
              // Report the name the person picked, not the .jpg the
              // compressor renamed it to on the way out.
              tooLarge.push(readable[index].name);
            } else {
              good.push(file);
            }
          });

          setRejected({ wrongType, tooLarge, unreadable });
          if (good.length > 0) onAdd(good);
        }}
      />

      {/* One line per cause, each naming only the files it applies to. The
			    size line quotes this caller's own `maxSizeKb`, so the ceiling comes
			    from the endpoint being posted to rather than being left unsaid.
			    Dismiss is what turns a blocked submit into an acknowledged one —
			    the person is told the photo did not attach and then chooses to go
			    on without it, instead of finding out afterwards. */}
      {hasRejections && (
        <div
          role="alert"
          className="col-span-2 flex items-start gap-2 text-sm leading-5 text-destructive-text"
        >
          <div className="flex flex-1 flex-col gap-1">
            {rejected.wrongType.length > 0 && (
              <p>
                {t("attachmentWrongType", "Not added — unsupported file type:")}{" "}
                {rejected.wrongType.join(", ")}
              </p>
            )}

            {rejected.tooLarge.length > 0 && maxSizeKb != null && (
              <p>
                {t("attachmentTooLarge", "Not added — over the size limit of")}{" "}
                {formatSizeLimit(maxSizeKb)}: {rejected.tooLarge.join(", ")}
              </p>
            )}

            {rejected.unreadable.length > 0 && (
              <p>
                {t(
                  "attachmentUnreadable",
                  "Not added — this file could not be read as an image:",
                )}{" "}
                {rejected.unreadable.join(", ")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setRejected(emptyRejections())}
            className="cursor-pointer rounded-sm font-semibold whitespace-nowrap underline underline-offset-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {t("dismiss", "Dismiss")}
          </button>
        </div>
      )}
    </div>
  );
}
