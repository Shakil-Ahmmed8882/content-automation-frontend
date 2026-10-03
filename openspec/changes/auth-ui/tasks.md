## 1. API client & session (vertical slice)

- [ ] 1.1 `src/api/auth.ts` typed calls for register, verifyEmail, login, logout, refreshToken, me, forgotPassword, resetPassword with the `sendResponse` envelope type; verify against the backend Postman examples that request and response shapes match.
- [ ] 1.2 `src/validation/auth.ts` zod schemas mirroring `auth.validation.ts` (email, password min 8, otp 6 digits); verify invalid inputs are rejected by unit-style checks in the form.
- [ ] 1.3 `useSession()` hook on `GET /auth/me` returning user or `null` on 401; verify a guest yields `null` and a logged-in browser yields the user.
- [ ] 1.4 Refresh-on-401 interceptor in `apiClient` with a shared in-flight promise and loop guards; verify an expired access cookie triggers exactly one refresh for parallel calls and the retry succeeds.

## 2. Register + verify email (vertical slice)

- [ ] 2.1 `useRegister` and `useVerifyEmail` mutations (seed session cache on verify); verify the cache holds the user after verification.
- [ ] 2.2 `/register` page: two-step form using `GenericForm`/`TextField`/`SubmitButton`; verify the email step sends the OTP and moves to the code step.
- [ ] 2.3 OTP step with 6-digit input, 5-minute hint, "Resend" (re-register) and "Start over"; verify wrong code, expired code and success paths.
- [ ] 2.4 Handle 409 email-exists with a link to `/login`; verify with an existing account.

## 3. Login & logout (vertical slice)

- [ ] 3.1 `useLogin` and `useLogout` (logout clears the whole query cache); verify cookies are set and cleared in DevTools.
- [ ] 3.2 `/login` page with safe `next` handling; verify `next=/profile` works and `next=//evil.com` falls back to `/dashboard`.
- [ ] 3.3 Display 401/403 server messages (wrong password, blocked, deleted); verify each message appears.

## 4. Forgot & reset password (vertical slice)

- [ ] 4.1 `useForgotPassword` and `useResetPassword` hooks; verify neutral response for unknown and known emails.
- [ ] 4.2 `/forgot-password` page redirecting to `/reset-password?email=`; verify the email carries over.
- [ ] 4.3 `/reset-password` page (email, OTP, new password); verify success redirects to `/login` and login works with the new password.

## 5. Redirects, guard wiring & errors

- [ ] 5.1 `GuestOnly` wrapper in the `(auth)` layout; verify a signed-in user opening `/login` lands on `/dashboard`.
- [ ] 5.2 Export the `session` query key and a `useAuthRedirect` helper for app-shell's AuthGuard; verify app-shell guard redirects guests with `next`.
- [ ] 5.3 Shared auth error component mapping 429 to the "too many attempts" state and disabling submit; verify by exceeding the limiter locally or mocking a 429.
- [ ] 5.4 Ensure the UI ignores any dev-only `data.otp` in responses; verify it is never rendered.

## 6. Integration

- [ ] 6.1 Run `bun run check` and `tsc --noEmit`; verify both pass.
- [ ] 6.2 Log decisions (session-as-query, refresh interceptor, no resend endpoint, Google deferred) in `docs/decisions.md`; verify entries exist.
- [ ] 6.3 Playwriter end-to-end: register, verify, logout, login, forgot, reset, reload persistence; verify each spec scenario.
