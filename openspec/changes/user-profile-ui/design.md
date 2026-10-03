## Context

See `proposal.md`. Backend `GET /users/me` returns the users row (`id, name, email, emailVerified,
avatarUrl, avatarPublicId, role, isPremium, premiumSince, status, createdAt, updatedAt`) plus
`providers`. `PATCH /users/me` accepts only `name` (other keys, including `email`, are stripped by zod).
Avatar upload is multipart (field `avatar`, 5 MB, `image/*`); multer errors surface as 400.
Delete is a soft delete that also clears auth cookies server-side.

## Goals / Non-Goals

**Goals:** a safe self-service page with clear feedback and instant UI sync.
**Non-Goals:** email change, cropping, admin tools, billing history.

## Decisions

### D1: One page, section cards
Sections: Identity (avatar + name), Account (email, role, providers, premium), Security (change
password), Danger zone (delete). Each section has its own form/mutation so one failure never blocks
another.

### D2: Profile data from `useProfile`, session kept in sync
`useProfile` queries `GET /users/me` (richer than `/auth/me`: has `providers`). Every successful
mutation writes the returned profile to `["profile"]` and updates/invalidates `["session"]` so the
navbar and sidebar reflect new name/avatar immediately.

### D3: Avatar upload client-side pre-checks
Before sending, check `image/*` and 5 MB (mirrors backend) and show an inline error; send
`FormData` with key `avatar` and let the browser set the multipart boundary (no manual
Content-Type). Show an optimistic preview with a spinner overlay; `BaseAvatar` falls back to initials.

### D4: Change-password gating by provider
Render the form only if `providers` includes `CREDENTIALS`; otherwise show a note to use
forgot-password. A 401 "Current password is incorrect" maps to the `currentPassword` field error,
not a global toast. Success resets the form (session stays valid; backend does not revoke tokens).

### D5: Delete account uses `DeleteConfirmModal` with typed confirmation
User must confirm in the modal (type DELETE for extra friction). On success: clear query cache,
toast, navigate to `/`. Cookies are already cleared by the backend response.

### D6: Premium badge is display-only
Badge shown when `isPremium`, with `premiumSince`; otherwise an Upgrade button to `/payment`. The UI
never decides access; the backend does.

## Risks / Trade-offs

- **Large image on slow network.** Disable controls while uploading, show progress state; 5 MB cap.
- **Cloudinary delete failure** is backend best-effort; UI is unaffected.
- **Stale avatar from CDN cache.** Backend returns a new URL per upload, so no cache-busting needed.
