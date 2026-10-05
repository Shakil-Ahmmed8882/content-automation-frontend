## 1. Guard & shell

- [x] 1.1 Add `src/types/admin.ts` (`Role`, `UserStatus`, `AdminUser`, `AuditLog`, `Platform`) matching backend `SAFE_USER_SELECT`/`AuditLog`/`Platform` models; verify tsc passes.
- [ ] 1.2 Build `/admin/layout` with role guard (Forbidden for USER, login redirect for anonymous) and an admin sub-nav (`tabs`); verify with USER, ADMIN and anonymous sessions.
- [ ] 1.3 Show the sidebar Admin entry via `ShowIf` on role; verify it is absent for USER.

## 2. Platforms (vertical slice)

- [ ] 2.1 Add `src/api/admin/platforms.ts` (list/create/update/setLogo multipart) and `src/hooks/admin/usePlatforms.ts` with invalidation; verify calls in the network log.
- [ ] 2.2 Add zod schemas (key regex, name, status, int sortOrder, isActive); verify invalid input is blocked client-side.
- [ ] 2.3 Build `/admin/platforms` table + create/edit `MultipageModal` form (key read-only on edit) with skeleton/empty/error states; verify create, edit and retire.
- [ ] 2.4 Add logo upload with `AttachmentField`; verify field `logo` is sent and the new logo renders.

## 3. Users (vertical slice)

- [ ] 3.1 Add `src/api/admin/users.ts` (list with search/page/limit, get, setStatus, setRole, setPremium) and hooks; verify against the live backend.
- [ ] 3.2 Build `/admin/users` table with debounced search and `Pagination`; verify `meta` drives pages.
- [ ] 3.3 Build user detail drawer/page; verify all safe fields show.
- [ ] 3.4 Add block/unblock and premium toggle with `DeleteConfirmModal`-style confirm; verify status/premium update and lists invalidate.
- [ ] 3.5 Add SUPER_ADMIN-only role control and self-row disabling; verify ADMIN cannot see it and own-row controls are disabled.

## 4. Audit logs (vertical slice)

- [ ] 4.1 Add `src/api/admin/auditLogs.ts` and `useAuditLogs` with filters in URL params; verify requests carry `actorId`/`action`/`entityType`.
- [ ] 4.2 Build `/admin/audit-logs` table, filters (selects for known actions/entity types + actorId input), `Pagination`, expandable metadata JSON; verify filter, reset to page 1 and expansion.
- [ ] 4.3 Add skeleton/empty/error states; verify each.

## 5. Upcoming features (vertical slice)

- [ ] 5.1 Add `src/api/admin/upcomingFeatures.ts` (list/get/create/update/delete/setImage multipart) and hooks; verify against the backend.
- [ ] 5.2 Add zod schema (slug regex, required texts, status enum, int sortOrder, isPremiumVisible); verify validation messages.
- [ ] 5.3 Build `/admin/upcoming-features` table + create/edit modal with slug 409 handling; verify create, edit, duplicate slug.
- [ ] 5.4 Add image upload (field `image`) with retry on failure; verify replace shows the new image.
- [ ] 5.5 Add delete via `DeleteConfirmModal` with the hide-instead hint; verify the row disappears and the premium list no longer shows it.

## 6. Integration

- [x] 6.1 Run Biome check and `tsc --noEmit`; verify both pass.
- [ ] 6.2 Log decisions (layout guard, two-step image upload, audit filter selects) in `docs/decisions.md`; verify entries exist.
- [ ] 6.3 End-to-end Playwriter run as SUPER_ADMIN and ADMIN across all four sections; verify role-specific controls and audit entries created by the actions.
