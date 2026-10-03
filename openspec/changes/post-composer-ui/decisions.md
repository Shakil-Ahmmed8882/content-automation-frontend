# post-composer-ui decisions

## Decisions

- Implemented the repo naming convention from the coordination note: `src/types/post.type.ts`, `src/validation/post.validation.ts`, `src/api/post.api.ts`, and `src/hooks/post.hook.ts`.
- `POST /posts` is built with `FormData` and does not set `Content-Type`; the browser owns the multipart boundary.
- Image selection uses `AttachmentField` with `maxSizeKb={5120}`, which runs the shared `prepareImage` helper and keeps the composer to one held file by replacing the previous image on add.
- Save & publish creates the immutable post first, then navigates to `/posts/<id>?publish=<comma-separated-platform-keys>`. The publish slice owns reading that query param and rendering `<PublishPanel postId={post.id} />`.
- `/posts/[id]` contains the publish handoff placeholder in `src/components/modules/posts/PostDetailView.tsx` beside the post content.
- The dashboard keeps the existing overview, connection and execution widgets, and appends the posts list below them.
- `/posts/[id]` is implemented under the guarded `(dashboard)` route group; `routes.postDetail(id)` already existed and no route/config files were edited.

## Deviations

- The tasks file references bare `src/types/post.ts`, `src/api/post.ts`, `src/hooks/usePosts.ts`, and `src/validation/post.ts`; the coordination note supersedes that with the repo convention names above.
- The tasks file asks to document the publish contract in `docs/decisions.md`, but this worker owns only the OpenSpec change decisions file, so the contract is recorded here.
- Browser/network-panel, visual Playwriter, and end-to-end backend verification were not run because the coordination instructions explicitly forbid browser/Playwriter and dev/build ownership for this worker.

## Blockers

- None for code implementation.
- Manual browser verification remains for the orchestrator/integration pass.
