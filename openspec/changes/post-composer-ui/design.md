## Context

See `proposal.md`. Verified: `post.validation.ts` only requires non-empty `content` and optional
`title`; `lib/multer.ts` allows one `image` file, `image/*`, 5 MB (memory storage, then Cloudinary).
A `Post` stores no platforms; targets are chosen at publish time (`execution.validation.ts`
`platforms: string[]`, min 1). PRD §9.3 requires at least one selected platform before publishing.

## Goals / Non-Goals

**Goals:** fast composing with immediate feedback; client validation mirroring the backend so users
rarely see a server rejection; a clean seam for publishing.
**Non-Goals:** post editing, scheduling, drafts-with-targets persisted server side.

## Decisions

### D1: multipart via FormData, field names fixed
Build `FormData` with `content`, optional `title`, optional `image`. Let the browser set the multipart
boundary (do not set Content-Type). Zod (`src/validation/post.ts`) mirrors rules: content trimmed
non-empty; image `type.startsWith("image/")` and `size <= 5 * 1024 * 1024`.

### D2: Image preparation via `AttachmentField` + `prepareImage`
Reuse `attachment/AttachmentField` for pick/preview/remove and `prepareImage.ts` to downscale/re-encode
oversized photos under 5 MB before upload (that helper targets another API's rules — check its limits
and parametrise, do not fork). Local preview uses `URL.createObjectURL` and is revoked on unmount.

### D3: Targets limited to connected, LIVE platforms
Checkboxes come from `useConnections()` (status `CONNECTED`). `EXPIRED` connections are shown disabled
with a "Reconnect" link to `/connections`; platforms with no connection show "Connect first". If none
are connected, show an empty state linking to `/connections`. Selection is composer-local state.

### D4: Live preview is client-only and approximate
A `PostPreview` card per selected platform renders title/content/image in a platform-styled frame
(name + connected account name). It is labelled "Preview" — real rendering differs.

### D5: Save vs Save & publish handoff
Save draft = `POST /posts` then go to `/posts/[id]`. Save & publish requires >=1 target, creates the
post, then navigates to `/posts/[id]?publish=<comma-separated keys>`. `publish-and-executions-ui`
owns what happens there: it reads that param (or exports `<PublishButton postId platformKeys />`)
and calls `POST /posts/:id/publish`. This change only guarantees: post exists, keys are valid connected
platform keys. If publish is unavailable, Save & publish degrades to Save.

### D6: Infinite scroll over page/limit
`useInfiniteQuery` with `getNextPageParam` from `meta.page < meta.totalPages`, limit 10, using the
`pagination/infinite-scroll` provider/UI. Search is debounced and part of the query key; deleting
invalidates the list and removes the detail cache.

### D7: Routes
`/dashboard` hosts the list; `/create` the composer; `/posts/[id]` detail. `/posts/[id]` is new
relative to `openspec/config.yaml`'s route list and must be added to the session-required routes.

## Risks / Trade-offs

- **Orphan upload on failed create** is handled server-side; client shows the error and keeps form state.
- **Large image on mobile** -> compress client side (D2) and surface the 5 MB rule inline.
- **Handoff drift with the publish change.** -> Contract in D5 is the only coupling; both specs cite it.

## Migration Plan

1. Types/api/hooks. 2. Composer + preview. 3. List + detail + delete. 4. Wire handoff and verify
with the publish change once merged.
