## Why

Every feature is gated behind a session. Users need to register, verify their email with a one-time
code, log in and out, and recover a forgotten password, and the app needs one reliable source of
"who is signed in" that survives reloads and silently renews expired access tokens.

## What Changes

- **Register (`/register`):** name, email, password form -> `POST /auth/register`, then OTP step.
- **Verify email (OTP):** 6-digit code -> `POST /auth/verify-email`; success signs the user in
  (backend sets cookies) and redirects to `/dashboard`.
- **Login (`/login`):** email + password -> `POST /auth/login`; honours `?next=`.
- **Logout:** `POST /auth/logout`, clears the session cache, returns to `/`.
- **Forgot password (`/forgot-password`):** `POST /auth/forgot-password`, always shows the same
  neutral confirmation, then continues to reset.
- **Reset password (`/reset-password`):** email + OTP + new password -> `POST /auth/reset-password`,
  then to `/login`.
- **Session bootstrap:** `useSession()` TanStack Query on `GET /auth/me`; 401 means guest.
- **Refresh handling:** on a 401 from any call, the api client makes one `POST /auth/refresh-token`
  attempt (cookie-based) and retries the original request; failure clears the session.
- **Redirect rules:** signed-in users are bounced from `/login`, `/register`, `/forgot-password`,
  `/reset-password` to `/dashboard`; guests on protected routes go to `/login?next=`.
- **Error and rate-limit messaging:** field errors from zod, server `message` toasts, a distinct
  "Too many attempts" state for HTTP 429 (auth limiter: 20 requests / 15 min / IP).

Consumes (`content-automation-backend/src/app/module/auth/`): `auth.route.ts`, `auth.validation.ts`
(email, password min 8, otp exactly 6 digits, `newPassword` min 8), `auth.controller.ts`. Envelope:
`src/app/utils/sendResponse.ts` (`{ success, statusCode, message, data }`); errors from
`middleware/globalErrorHandler.ts` (`{ success:false, statusCode, message }`).

## Capabilities

### New Capabilities
- `auth-ui`: the credentials sign-up, sign-in, sign-out, password recovery, session and
  token-refresh behaviour of the web app.

### Modified Capabilities
<!-- None. app-shell consumes useSession; it does not change. -->

## Impact

- **Code:** `src/api/auth.ts`, `src/hooks/auth/*` (`useSession`, `useRegister`, `useVerifyEmail`,
  `useLogin`, `useLogout`, `useForgotPassword`, `useResetPassword`), `src/validation/auth.ts`,
  `src/modules/auth/*`, refresh interceptor in the foundation `apiClient`.
- **Reuses:** `reusable-ui-blocks/form` (`GenericForm`, `TextField`, `SubmitButton`),
  `buttons/BaseButton`, `modal`/toast from the foundation providers.
- **Non-goals:** Google sign-in (deferred; backend has not shipped it, only `lib/googleAuth.ts`
  scaffold exists); a "resend OTP" endpoint (none exists; users re-submit register or forgot-password);
  MFA; remember-me; social login buttons; admin login (admins use the same form).
