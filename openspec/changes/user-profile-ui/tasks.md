## 1. API, hooks & validation

- [x] 1.1 `src/api/user.ts` typed calls: getMe, updateMe, uploadAvatar (FormData key `avatar`), removeAvatar, changePassword, deleteMe, with a `UserProfile` type including `providers`; verify shapes against `user.service.ts#toProfile`.
- [x] 1.2 `src/validation/user.ts` zod schemas (name trimmed min 1; currentPassword required; newPassword min 8); verify rejects on invalid input.
- [x] 1.3 `src/hooks/user/*` TanStack hooks, writing results to `["profile"]` and syncing `["session"]`; verify a mutation updates both caches.

## 2. View profile (vertical slice)

- [x] 2.1 `/profile` page shell with section cards and skeleton/error/retry states; verify loading and a forced error.
- [x] 2.2 Account section: email (read-only), role, providers, member-since; verify values match the API.
- [x] 2.3 Premium badge / Upgrade button; verify with one premium and one non-premium account.

## 3. Edit name (vertical slice)

- [x] 3.1 Name form using `GenericForm`/`TextField`/`SubmitButton` calling `PATCH /users/me`; verify the new name appears in navbar and sidebar without reload.
- [x] 3.2 Confirm `email` is never sent; verify in the Network tab.

## 4. Avatar (vertical slice)

- [x] 4.1 Avatar uploader with `BaseAvatar`, file picker, client checks (image/*, 5 MB); verify non-image and oversize are rejected inline.
- [x] 4.2 Upload/replace via multipart with uploading state and preview; verify the new avatar shows in navbar and profile.
- [x] 4.3 Remove avatar action; verify initials fallback appears.

## 5. Change password (vertical slice)

- [x] 5.1 Password form (current, new, confirm) shown only when `providers` includes `CREDENTIALS`; verify hidden for a provider-less case.
- [x] 5.2 Map 401 "Current password is incorrect" to the field; verify with a wrong password, and success with a correct one (then log in with the new password).

## 6. Delete account (vertical slice)

- [x] 6.1 Danger zone with `DeleteConfirmModal` and typed DELETE confirmation; verify cancel leaves everything unchanged.
- [x] 6.2 On success clear the query cache and navigate to `/`; verify the session is gone and login is refused for the deleted account.
- [x] 6.3 Show server error in the modal on failure; verify with a forced failure.

## 6b. Account hub

- [x] 6b.1 Add Logout button (reuses `auth-ui` logout hook) and links to `/payment/history` and `/payment` (non-premium only) on `/profile`; verify each link and that logout ends at `/`.
- [x] 6b.2 Confirm all mutations show pending state plus success/error toast and send no user id; verify in the Network tab.

## 7. Integration

- [ ] 7.1 Run `bun run check` and `tsc --noEmit`; verify both pass.
- [ ] 7.2 Log decisions (profile vs session query, avatar pre-checks, typed delete confirmation) in `docs/decisions.md`; verify entries exist.
- [ ] 7.3 Playwriter pass of every scenario at 375px and desktop; verify each spec scenario.
