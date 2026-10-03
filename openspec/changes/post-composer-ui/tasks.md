## 1. Types, validation, API and hooks (vertical slice)

- [ ] 1.1 Add `src/types/post.ts` (Post, ListMeta, list params) and `src/validation/post.ts` (zod: trimmed non-empty content, optional title, image type `image/*` and <= 5 MB, platform keys >= 1 for publish); verify `tsc` passes and rules match `post.validation.ts`/`lib/multer.ts`.
- [ ] 1.2 Add `src/api/post.ts`: `createPost(FormData)` (no manual Content-Type), `getPosts(params)`, `getPost(id)`, `deletePost(id)`; verify create stores an image in the browser network panel.
- [ ] 1.3 Add `src/hooks/usePosts.ts`: `useInfinitePosts({search})`, `usePost(id)`, `useCreatePost`, `useDeletePost` with cache invalidation; verify a create appears in the list without reload.

## 2. Composer form (vertical slice)

- [ ] 2.1 Build `/create` page with react-hook-form + zod using `GenericForm`, `TextField` (title), `TextareaField` (content) and `SubmitButton`; verify blank content shows the inline error and no request is sent.
- [ ] 2.2 Add image field via `AttachmentField` + `prepareImage` (single file, preview, remove, 5 MB / image-only errors); parametrise limits instead of forking; verify a 6 MB photo is reduced or rejected and a PDF is rejected.
- [ ] 2.3 Add `TargetPlatforms` checkboxes from `useConnections()` with disabled Expired / Not connected states and empty state linking to `/connections`; verify with zero, one and two connected platforms.
- [ ] 2.4 Add `PostPreview` per selected platform, live via `watch`, labelled approximate, using `BaseImage`; verify it updates while typing and when the image is removed.

## 3. Save and handoff (vertical slice)

- [ ] 3.1 Wire Save draft: submit mutation, success toast, navigate to `/posts/[id]`; preserve form state on error; verify success and a forced 400.
- [ ] 3.2 Wire Save & publish: require >= 1 target, create post, navigate to `/posts/[id]?publish=<keys>`; document the contract in `docs/decisions.md` for `publish-and-executions-ui`; verify the URL carries the keys.

## 4. Posts list (vertical slice)

- [ ] 4.1 Build `/dashboard` posts list with `pagination/infinite-scroll`, post cards (title/preview/thumbnail/date), `CardSkeletons` while loading; verify a second page loads when scrolling with > 10 posts.
- [ ] 4.2 Add debounced search (query key includes term), empty state and search-empty state via `NoResultFoundWrapper`, and error + retry; verify each state.

## 5. Detail and delete (vertical slice)

- [ ] 5.1 Build `/posts/[id]` with content, `BaseImage`, created date, 404 not-found state, and a clearly marked publish slot for the next change; verify another user's id shows not found.
- [ ] 5.2 Wire `DeleteConfirmModal` to `deletePost`, invalidate list, toast, redirect to `/dashboard`; verify the post disappears and cancel keeps it.
- [ ] 5.3 Add `/posts/[id]` to the session-required route list (`src/routes`, middleware/proxy) and nav links for Create and Posts; verify a signed-out visit redirects to login.

## 5b. Immutability and guards

- [ ] 5b.1 Show the immutability hint and no edit controls on detail/list; verify no edit affordance exists anywhere.
- [ ] 5b.2 Add a submit double-click guard and an unsaved-changes leave warning on `/create`; verify one request on double click and the prompt on navigation.

## 6. Integration

- [ ] 6.1 Check dark-theme styling per `src/design-system/vercel-design-system.md` at mobile and desktop widths; verify visually with Playwriter.
- [ ] 6.2 Run `bun run check` and `tsc --noEmit`; verify both pass, then run compose -> preview -> save -> list -> delete end to end.
