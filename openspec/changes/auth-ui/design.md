## Context

See `proposal.md`. Backend auth is cookie-based: login and verify-email set httpOnly `accessToken`
(1 day) and `refreshToken` (7 days) cookies; the client never sees tokens. OTPs live 5 minutes
(`auth.constant.ts`). Registration creates no DB user until the OTP is verified (pending data in
Redis). Forgot-password always returns the same message (anti-enumeration).

## Goals / Non-Goals

**Goals:** complete credentials flow, one session source of truth, silent refresh, clear errors.
**Non-Goals:** Google auth, resend-OTP endpoint, tokens in JS, route protection UI (owned by app-shell).

## Decisions

### D1: Session = TanStack Query on `GET /auth/me`
`useSession()` (`queryKey: ["session"]`, `retry: false`, long `staleTime`) returns the user or `null`
when the API replies 401. Login/verify seed the cache with the returned user; logout and refresh
failure clear it. No Redux/Context store duplicating server state.

### D2: Refresh-on-401 lives in the ofetch client
An `onResponseError` hook on 401 calls `POST /auth/refresh-token` once (shared in-flight promise so
parallel 401s trigger one refresh), then retries the original request. `/auth/*` calls and the
retry itself are excluded to avoid loops. Refresh failure sets session to guest and routes to
`/login?next=`.

### D3: Register -> OTP is one page with two steps
Step state holds the email returned by `/auth/register` (`data.email`, normalized). Using
`MultipageModal`-style transitions is unnecessary; a simple step switch in one component keeps the
URL stable. There is no resend endpoint, so "Resend" re-calls register with the same values held in
memory (password never persisted; if lost, user retypes). Expired-code error offers "Start over".

### D4: Forgot -> Reset carries email via query string
`/forgot-password` redirects to `/reset-password?email=...`. OTP and new password stay in form state.
The neutral message is shown regardless of account existence, matching backend D7 anti-enumeration.

### D5: Error mapping
Validation mirrors backend zod (zod schemas in `src/validation/auth.ts`, same limits). Server errors
show `message` as a form-level alert; 429 shows a dedicated "Too many attempts, try again in a few
minutes" state and disables submit; 403 messages (blocked/deleted) are shown verbatim.

### D6: Redirect rules centralized
A `GuestOnly` wrapper in the `(auth)` layout redirects signed-in users to `/dashboard`; `next` is
accepted only if it starts with `/` and not `//` (open-redirect guard).

## Risks / Trade-offs

- **Dev OTP exposure.** Backend may return `data.otp` outside production; the UI SHALL ignore it.
- **Cross-origin cookies.** Needs `credentials: "include"` and matching CORS/SameSite config; verified
  in the first task slice.
- **Refresh race.** Single shared promise; verified by firing parallel requests with an expired access cookie.
