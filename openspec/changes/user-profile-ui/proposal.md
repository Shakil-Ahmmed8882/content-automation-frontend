## Why

Users need to see and manage their own account: name, avatar, password, premium status, and the
ability to delete their account. The profile page is also where the premium badge and the
account-safety actions live.

## What Changes

- **View profile (`/profile`):** `GET /users/me` shows avatar, name, email (read-only), role,
  linked login providers, member-since and a **premium badge** (with `premiumSince`) or an Upgrade prompt.
- **Edit name:** `PATCH /users/me` with `{ name }`; email is not editable.
- **Avatar:** upload or replace (`PATCH /users/me/avatar`, multipart field `avatar`, image/*, max 5 MB)
  and remove (`DELETE /users/me/avatar`), displayed with `BaseAvatar` (initials fallback).
- **Change password:** `PATCH /users/me/password` with `currentPassword` + `newPassword` (min 8);
  shown only when the account has the `CREDENTIALS` provider.
- **Delete account:** `DELETE /users/me` behind a confirm modal; success logs out and returns to `/`.
- **Account hub (PRD section 20):** Logout action and entry points to upgrade / payment history.
- Updates refresh the shared `session` query so navbar/sidebar show the new name and avatar.

Consumes (`content-automation-backend/src/app/module/user/`): `user.route.ts`, `user.validation.ts`,
`user.controller.ts`, `user.service.ts`. Profile shape = users row plus `providers: string[]`
(`user.service.ts#toProfile`, `docs/data-model.md` section 4.1). Envelope: `utils/sendResponse.ts`.

## Capabilities

### New Capabilities
- `user-profile-ui`: self-service profile viewing and editing, avatar management, password change,
  account deletion, and premium status display.

### Modified Capabilities
<!-- None. Reads the session from auth-ui and updates its cache. -->

## Impact

- **Code:** `src/api/user.ts`, `src/hooks/user/*` (`useProfile`, `useUpdateProfile`,
  `useUploadAvatar`, `useRemoveAvatar`, `useChangePassword`, `useDeleteAccount`),
  `src/validation/user.ts`, `src/modules/profile/*`, `src/app/(app)/profile/page.tsx`.
- **Reuses:** `reusable-ui-blocks/form` (`GenericForm`, `TextField`, `SubmitButton`),
  `images/variations/avatar/BaseAvatar`, `modal/veriations/DeleteConfirmModal`,
  `buttons/BaseButton`, `placeholder/skeletons`.
- **Depends on:** `auth-ui` (`useSession`, logout cache clearing), `app-shell-and-marketing` (layout).
- **Non-goals:** changing email; avatar cropping; setting a first password for OAuth-only accounts
  (backend directs to forgot-password); payment history (premium-payment-ui); notification
  preferences; admin user management (admin-console-ui).
