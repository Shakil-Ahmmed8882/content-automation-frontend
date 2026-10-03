## Context

See `proposal.md` - Why. Admin routes are all `auth("ADMIN","SUPER_ADMIN")` except role change
(`SUPER_ADMIN`). The backend also refuses a user changing their own status or role (400), and
rejects duplicate platform `key` / feature `slug` (409 from unique constraint, features: "A feature
with this slug already exists"). Audit entries are append-only.

## Goals / Non-Goals

**Goals:** a consistent admin table+form pattern reused across four sections; safe destructive
actions; role-aware controls.
**Non-Goals:** analytics dashboards, bulk actions, export, anything without a backend route.

## Decisions

### D1: Layout-level role guard
`/admin/layout` reads the role from the session hook and renders Forbidden for non-admins (login
redirect when anonymous). Sections never re-check except for SUPER_ADMIN-only controls. The sidebar
entry uses `ShowIf` on role. Backend 403s are still surfaced.

### D2: One data-table pattern
Each section = list table + `MultipageModal` form (create/edit) + `Pagination` where the backend
paginates (users, audit logs). Platforms and features are unpaginated arrays (backend `listAll`).

### D3: Role-aware and self-safe controls
Role dropdown is rendered only for `SUPER_ADMIN`; for `ADMIN` it is hidden. Status/role controls are
disabled on the signed-in admin's own row (backend would return 400). Role changes require a confirm
modal; block/unblock requires confirm.

### D4: Images as a second step
Create/update JSON first, then `PATCH .../logo` or `.../image` as `multipart/form-data` (fields
`logo` / `image`, uses `AttachmentField` + `prepareImage`). Create succeeds even if upload fails;
the UI shows a retryable upload error on the row. Do not set Content-Type manually (browser boundary).

### D5: Audit filters are exact-match text/select
`actorId`, `action`, `entityType` are exact matches, so `action`/`entityType` use a select of known
values (PLATFORM_CREATED/UPDATED, FEATURE_CREATED/UPDATED/DELETED, USER_BLOCKED/UNBLOCKED,
USER_ROLE_CHANGED, USER_PREMIUM_GRANTED/REVOKED, PAYMENT_VERIFIED, CONNECTION_DISCONNECTED) with
free-text fallback, `actorId` a text field. Filters live in URL search params. `metadata` renders as
a collapsible JSON block.

### D6: Number fields and slug rules
`sortOrder` is an integer (zod `z.number().int()`, coerced from input); `key`/`slug` match
`^[a-z0-9-]+$`; `key` is read-only when editing a platform. Zod schemas mirror backend validation.

## Risks / Trade-offs

- **Stale lists after mutation.** -> invalidate the section query keys on every mutation.
- **Orphaned image on failed upload.** -> backend handles old-asset cleanup; UI offers retry.
- **Hard delete of features is irreversible.** -> `DeleteConfirmModal` plus hint to set
  `isPremiumVisible=false` instead.

## Migration Plan

1. Guard + shell; 2. platforms; 3. users; 4. audit logs; 5. features; 6. verify each with admin
and non-admin accounts via Playwriter.
