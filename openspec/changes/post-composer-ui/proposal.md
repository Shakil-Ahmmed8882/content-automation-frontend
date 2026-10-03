## Why

The core promise is "write once, publish everywhere" (PRD §9). Users need a composer to write post
text, attach one optional image, see how it will look per platform, and choose target platforms — plus
a place to find, open and delete the posts they have saved. The backend post module is complete; this
change is its UI and defines the handoff to publishing.

## What Changes

- **Create Post page** (`/create`): content textarea (required), optional title, optional single image
  upload with preview, target-platform checkboxes limited to connected platforms, live per-platform
  preview, and Save draft / Save & publish actions.
- **Posts list** (`/dashboard`): the user's posts, newest first, with search and infinite scroll
  (`GET /posts` with `page`/`limit`/`sort`/`search`, `meta.totalPages`).
- **Post detail** (`/posts/[id]`): full content, image, created time, Delete (confirm modal), and the
  publish handoff slot.
- **Delete:** `DELETE /posts/:id` (soft delete) behind `DeleteConfirmModal`.
- **Publish handoff (contract with `publish-and-executions-ui`):** this change exports the selected
  `platformKeys` and the created `postId`; the publish change owns `POST /posts/:id/publish`.

## Capabilities

### New Capabilities
- `post-composer-ui`: composing, previewing, saving, listing, viewing and deleting posts.

### Modified Capabilities
<!-- None. Consumes `useConnections()` from platforms-and-connections-ui. -->

## Impact

- **Backend endpoints consumed** (`src/app/module/post/post.route.ts`, controller, service):
  - `POST /api/v1/posts` — **multipart/form-data**: `title?` (trimmed; blank -> none), `content`
    (required, non-empty after trim, 400 "Content is required"), `image?` (field name exactly
    `image`; **one file**, `image/*` only, max **5 MB**, else 400 "Only image files are allowed" /
    multer size error). Returns 201 with the post {id,userId,title,content,imageUrl,imagePublicId,
    isDeleted,createdAt,updatedAt}. Backend has no per-platform content or character limits and does
    not store target platforms on the post (platforms are sent at publish time).
  - `GET /api/v1/posts?page&limit&sort&search` — defaults page 1, limit 10 (max 100); `sort` is
    `createdAt|title`, `-` prefix = desc (default `-createdAt`); `search` matches title/content
    case-insensitively; `meta {page,limit,total,totalPages}`; soft-deleted excluded.
  - `GET /api/v1/posts/:id` — 404 "Post not found" for other users' or deleted posts.
  - `DELETE /api/v1/posts/:id` — soft delete, `data: null`.
  - `GET /platforms`, `GET /connections` (via the connections hooks) to limit targets.
- **Frontend:** `src/api/post.ts`, `src/hooks/usePosts.ts`, `src/validation/post.ts` (zod),
  `src/app/(dashboard)/create`, `dashboard`, `posts/[id]`.
- **Reuse:** `form/` (GenericForm, TextField, TextareaField, CheckboxField, SubmitButton),
  `attachment/AttachmentField` + `prepareImage.ts`, `images/BaseImage`, `pagination/infinite-scroll`,
  `modal/veriations/DeleteConfirmModal`, `placeholder/skeletons`, `placeholder/no-results-found-wrapper`.

## Non-goals

- Publishing, execution polling, retries (`publish-and-executions-ui`).
- Editing an existing post (no `PATCH /posts/:id` exists); multi-image; scheduling; media library.
- Server-side per-platform formatting (preview is approximate and client-only).
