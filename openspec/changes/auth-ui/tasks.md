## 1. API client & session (vertical slice)

- [x] 1.1 `src/api/auth.api.ts` typed calls for register, verifyEmail, login, logout, refreshToken, me, forgotPassword, resetPassword with the `sendResponse` envelope type; verify against backend source and live local responses (Postman has no saved responses).
- [x] 1.2 `src/validation/auth.validation.ts` zod schemas mirroring `auth.validation.ts` (email, registration/reset password min 8, login password nonempty, otp 6 digits); verify invalid inputs are rejected by unit-style checks in the form.
- [x] 1.3 `useSession()` hook on `GET /auth/me` returning user or `null` on 401; verify a guest yields `null` and a logged-in browser yields the user.
- [x] 1.4 Refresh-on-401 interceptor in `apiClient` with a shared in-flight promise and loop guards; verify an expired access cookie triggers exactly one refresh for parallel calls and the retry succeeds.

## 2. Register + verify email (vertical slice)

- [x] 2.1 `useRegister` and `useVerifyEmail` mutations (seed session cache on verify); verify the cache holds the user after verification.
- [x] 2.2 `/register` page: two-step form using `GenericForm`/`TextField`/`SubmitButton`; verify the email step sends the OTP and moves to the code step.
- [x] 2.3 OTP step with 6-digit input, 5-minute hint, "Resend" (re-register) and "Start over"; verify wrong code, expired code and success paths.
- [x] 2.4 Handle 409 email-exists with a link to `/login`; verify with an existing account.

## 3. Login & logout (vertical slice)

- [x] 3.1 `useLogin` and `useLogout` (logout clears the whole query cache); verify cookies are set and cleared in DevTools.
- [x] 3.2 `/login` page with safe `next` handling; verify `next=/profile` works and `next=//evil.com` falls back to `/dashboard`.
- [x] 3.3 Display 401/403 server messages (wrong password, blocked, deleted); verify each message appears.

## 4. Forgot & reset password (vertical slice)

- [x] 4.1 `useForgotPassword` and `useResetPassword` hooks; verify neutral response for unknown and known emails.
- [x] 4.2 `/forgot-password` page showing neutral confirmation then linking to `/reset-password?email=`; verify the email carries over.
- [x] 4.3 `/reset-password` page (email, OTP, new password); verify success redirects to `/login` and login works with the new password.

## 5. Redirects, guard wiring & errors

- [x] 5.1 `GuestOnly` wrapper in the `(public)/(authentication)` layout; verify a signed-in user opening `/login` lands on `/dashboard`.
- [x] 5.2 Export the `session` query key and a `useAuthRedirect` helper for app-shell's AuthGuard; verify app-shell guard redirects guests with `next`.
- [x] 5.3 Shared auth error component mapping 429 to the "too many attempts" state and disabling submit; verify by exceeding the limiter locally or mocking a 429.
- [x] 5.4 Ensure the UI ignores any dev-only `data.otp` in responses; verify it is never rendered.

- [x] 5.5 Omit any Google or social sign-in button and record the Google deferral (backend has no route) in `docs/decisions.md`; verify `/login` and `/register` render no social button.
- [x] 5.6 Show the session-expired notice on `/login` after a failed refresh (query flag, not stored); verify by deleting both cookies mid-session.

## 6. Integration

- [x] 6.1 Run the existing `bun run lint`, `bunx tsc --noEmit`, `bun run test`, and `bun run build`; verify all pass (`check` is not a project script).
- [x] 6.2 Log decisions (session-as-query, refresh interceptor, no resend endpoint, Google deferred) in `docs/decisions.md`; verify entries exist.
- [x] 6.3 Playwriter end-to-end: register, verify, logout, login, forgot, reset, reload persistence; verify each spec scenario.

## Verification evidence (2026-10-03)

- 14 automated regression tests pass: validation, safe return paths, error sanitization,
  single-flight refresh, business-401 exclusion, transient refresh failure and expiry.
- Real local backend: registration, incorrect and correct verification, logout, incorrect
  and correct login, known/unknown email recovery, incorrect and correct reset, new-password
  login, reload persistence, access-cookie renewal, both-cookie clearing, guest guard,
  existing-email 409, and mid-session expiry with preserved next path.
- Browser-only fault fixtures: blocked/deleted 403, expired verification 400, resend flow,
  plain-text 429 with disabled submission/countdown, 500 sanitization, and network failure.
  Fixtures are test-only; the production UI always calls the real API.
- All four auth screens inspected at 360, 375, 768 and 1280px: no horizontal page overflow;
  keyboard focus and named password visibility toggles checked.
- Local demo login is prefilled and verified against a dedicated non-admin account.
- User Chrome connection was unstable; checks were completed with isolated local headless
  Chrome through Playwriter. Screenshots were captured. No unexpected runtime/hydration
  errors in the isolated run; expected failing API scenarios produce browser network logs.
