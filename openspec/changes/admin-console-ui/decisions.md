# Decisions

- Admin guard lives in `AdminGuard` (client), rendered by `(dashboard)/admin/layout.tsx`. It is a UX gate only: children (and therefore every admin request) mount only for `ADMIN`/`SUPER_ADMIN` sessions; others see the Forbidden view. The parent `AuthGuard` already redirects anonymous visitors to `/login?next=`; the guard repeats the redirect defensively. Backend 403s are still surfaced as toasts.
- `/admin` redirects server-side to `/admin/platforms`.
- Admin tabs are plain `Link`s with `aria-current`, not `ScrollableTabsHeader`: that block is state-driven with light hard-coded colours, while admin sections are real routes.
- File naming follows the repo convention (`admin-platform.api.ts`, `admin-platform.hook.ts`, `admin.type.ts`, `admin.validation.ts`) instead of the nested paths in `tasks.md`.
- The shared `MultipageModal` panel is white; `AdminModal` overrides it with `!bg-card !text-card-foreground` instead of editing the shared block. `DeleteConfirmModal` is reused as-is (it is a light modal; same precedent as the posts module).
- User actions (block/unblock, premium, role) confirm inline inside the detail drawer rather than through `DeleteConfirmModal`: the drawer sits at z-999999 and the confirm modal at z-99999, so the modal would render behind it. The inline confirm defaults focus to Cancel.
- Images are a second step (D4): JSON save first, then multipart `logo`/`image`. If the upload fails the record is kept, a toast explains it, and the picked `File` is held in page state so the row shows "Retry upload".
- `sortOrder` is held as a string in the form (numeric `TextField` yields strings) validated by `/^-?\d+$/` and converted with `Number()` on submit, so the backend always receives a JSON integer. This avoids `z.coerce` input-type friction with `GenericForm`.
- Platform edit reuses the create schema with `key` read-only/disabled (its value always validates); the PATCH body never includes `key`.
- 409 on create/edit is shown inline on `key` (platform) or `slug` (feature) using the backend message.
- Pagination reuses the shared `Pagination` through `AdminPager`, a small bridge that keeps the URL as the source of truth and maps backend `meta` (`page,limit,total,totalPages`) to the block's meta shape.
- Audit filters (`action`, `entityType`) are selects of known values with an "Other..." free-text fallback; `actorId` is a debounced text input; all live in URL params and reset `page`. The API has no actor name, so ids are shown in mono with copy and "Filter by this actor".
- Platform mutations invalidate `["admin","platforms"]` and `["platforms"]`; feature mutations invalidate `["admin","features"]`, `["upcoming-features"]`, `["upcoming-feature"]`; user mutations write `["admin","user",id]` and invalidate `["admin","users"]` and `["admin","audit-logs"]`.
- Not implemented (UX policy only, not enforced by the backend): hiding block/premium controls for equal or higher roles. Only self-row status/role and deleted-user actions are disabled, per `docs/ui-spec.md` S23.
- No tables/badges from shadcn exist in `components/ui`, so semantic `<table>` markup and a small token-styled `AdminBadge` are used. No dependencies were added.

## Blockers

- Browser verification (guards for USER/ADMIN/anonymous, multipart field names, audit entries, role-specific controls) is left for the orchestrator pass; the backend was not running.
