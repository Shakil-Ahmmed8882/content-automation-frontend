## Why

Admins run the platform without code changes (PRD §17): maintain the platform catalogue, manage
users, review the audit trail and curate the upcoming features. The backend already exposes these
operations behind `auth("ADMIN","SUPER_ADMIN")`; this change gives them a guarded `/admin` UI.

## What Changes

- **Guard:** `/admin/*` is reachable only when the session role is `ADMIN` or `SUPER_ADMIN`; others
  see a 403 page, anonymous users go to login. Admin nav entry shown only to admins.
- **Platforms** `/admin/platforms`: list all (`GET`), create (`POST`: key, name, status, sortOrder,
  isActive), edit (`PATCH /:id`: name, status, sortOrder, isActive - key is immutable), upload logo
  (`PATCH /:id/logo`, multipart field `logo`). No delete: retire via `isActive=false`.
- **Users** `/admin/users`: paginated, searchable list (`search`, `page`, `limit`), detail
  (`GET /:id`), block/unblock (`PATCH /:id/status`), grant/revoke premium (`PATCH /:id/premium`),
  change role (`PATCH /:id/role`, SUPER_ADMIN only).
- **Audit logs** `/admin/audit-logs`: paginated read-only viewer with exact-match filters
  `actorId`, `action`, `entityType`.
- **Upcoming features** `/admin/upcoming-features`: list all (incl. hidden), create, edit, delete
  (hard, confirmed), image upload (`PATCH /:id/image`, multipart field `image`).

## Capabilities

### New Capabilities
- `admin-console-ui`: role-guarded admin screens for platforms, users, audit logs and upcoming
  features.

### Modified Capabilities
<!-- None. -->

## Impact

- **Backend consumed (read-only):** `src/app/module/platform/platform.route.ts` +
  `.validation.ts`; `src/app/module/admin/admin.route.ts`, `.validation.ts`, `.service.ts`
  (`SAFE_USER_SELECT`: id, name, email, role, isPremium, premiumSince, status, emailVerified,
  isDeleted, createdAt; audit row: id, actorId, action, entityType, entityId, metadata, ipAddress,
  userAgent, createdAt); `src/app/module/upcomingFeature/upcomingFeature.route.ts` +
  `.validation.ts`. Enums: `Role`, `UserStatus` (`ACTIVE|BLOCKED`), `PlatformStatus`
  (`LIVE|COMING_SOON`), `UpcomingFeatureStatus`. Envelope `{ success, statusCode, message, data,
  meta? }`; paginated lists return `meta { page, limit, total, totalPages }`.
- **Frontend:** `src/api/admin/*`, `src/hooks/admin/*`, `src/modules/admin/*`, routes
  `src/app/(app)/admin/*`.
- **Reuse:** `reusable-ui-blocks/pagination/Pagination`, `form/*` (TextField, SelectField,
  SwitchField, TextareaField, SubmitButton), `modal/MultipageModal`, `modal/veriations/
  DeleteConfirmModal`, `attachment/AttachmentField`, `images/BaseImage`, `placeholder/skeletons`,
  `tabs`.
- **Depends on:** foundation-and-design-system, auth-ui (role in session), app-shell-and-marketing.

## Non-goals

- No operations the backend lacks: no platform delete, no user delete/create, no audit
  edit/delete/export, no date-range audit filter, no user-detail audit/payment tabs.
- No client-side authorization as security; the backend enforces every route.
