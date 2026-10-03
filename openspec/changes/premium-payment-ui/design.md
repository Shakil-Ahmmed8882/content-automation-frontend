## Context

See `proposal.md` - Why. Backend flow (payment.service.ts): `create` records a PENDING payment and
returns `{ paymentId, redirectUrl }` (HTTP 201); the browser pays on bKash; bKash calls the
unauthenticated `GET {backend}/api/v1/payments/callback?paymentID=...&status=success|failure|cancel`;
the backend executes/confirms, flips PENDING->SUCCESS atomically (granting `isPremium`), and redirects
the browser to `{FRONTEND_BASE_URL}/payment/success` or `/payment/failure` (any error -> failure).
The redirect carries **no query params**, so the frontend cannot learn the payment from the URL.

## Goals / Non-Goals

**Goals:** a trustworthy, resumable return experience; instant premium reflection; a clear history.
**Non-Goals:** other gateways, refunds, receipts, polling beyond a short bounded re-verify.

## Decisions

### D1: Persist `paymentId` across the redirect
After `POST /payments/create`, store `{ paymentId }` in `sessionStorage` (try/catch guarded) and then
`window.location.assign(redirectUrl)`. The return pages read it. Rationale: the callback redirect has
no params. Fallback when storage is empty (new tab/cleared): load `GET /payments?limit=1` and use the
newest payment.

### D2: Backend is the only source of truth for status
Success page calls `POST /payments/verify { paymentId }` (owner-scoped, idempotent, 404 if not
owned) rather than trusting the URL (`/payment/success` is just a hint; anyone can type it). It
renders from the returned `status`. Failure page calls `GET /payments/:id` to distinguish `FAILED`
from `CANCELLED` and to catch the race where a payment is actually `SUCCESS`.

### D3: Premium refresh by query invalidation
On `status === "SUCCESS"`, invalidate the session (`/auth/me`) and profile (`/users/me`) query keys,
then clear the stored paymentId. Sidebar badge, upcoming-features entry and gates re-render from the
refreshed data. No optimistic premium flag.

### D4: Double-click / re-entry protection
The create mutation disables the button while pending and after success (until navigation). A second
`create` would make a second PENDING row, so the CTA is also hidden when the profile is already
premium. A PENDING payment found on return is verified, not recreated.

### D5: Status vocabulary
`PENDING` (amber "Confirming"), `SUCCESS`, `FAILED`, `CANCELLED` map to badge variants from the
Vercel dark design tokens; amount shown as `amount currency` (amount arrives as a Decimal string or
number - parse via a shared formatter).

## Risks / Trade-offs

- **Storage cleared mid-flow.** -> D1 fallback to latest payment from the list.
- **Callback not yet settled when the page loads.** -> verify is idempotent; one bounded retry (2
  attempts, 2s apart) while status is PENDING, then show "still processing" with a Retry button.
- **User lands on /payment/success unpaid.** -> D2 shows the true status, never assumes success.

## Migration Plan

1. api + hooks; 2. upgrade page; 3. return pages + invalidation; 4. history; 5. browser verify with
bKash sandbox (success, cancel, failure) via Playwriter.
