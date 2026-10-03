## Why

Premium is what unlocks the Upcoming Features area (PRD §15-§16). Users need a way to pay via bKash
(sandbox), come back from the gateway to a clear success/failure result, see their premium state
update immediately, and review past payments. The backend owns all settlement; the frontend only
starts the flow, handles the return redirect, and reflects server truth.

## What Changes

- **Upgrade page** `/payment`: price/benefit card with an "Upgrade to Premium" button that calls
  `POST /payments/create` and redirects the browser to the returned bKash `redirectUrl`.
- **Return pages** `/payment/success` and `/payment/failure`: the backend's
  `GET /payments/callback` (called by bKash, not by us) confirms server-side and then 302-redirects
  the browser to `${FRONTEND_BASE_URL}/payment/success` or `/payment/failure` with NO query params.
  The frontend therefore remembers the `paymentId` from the create response and, on return, calls
  `POST /payments/verify` (idempotent safety net) / `GET /payments/:id` to show the real status.
- **Premium refresh:** on a confirmed SUCCESS, invalidate the `/auth/me` and `/users/me` queries so
  the premium badge, sidebar entry and gates update without a reload.
- **History:** `/payment/history` (paginated, optional status filter via `GET /payments`) and
  `/payment/history/[id]` detail (`GET /payments/:id`).
- **Feedback:** "Payment successful. Welcome to Premium." toast, crown badge, idempotent reloads.
- **States:** PENDING (still confirming), SUCCESS, FAILED, CANCELLED, double-click protection,
  already-premium state.

## Capabilities

### New Capabilities
- `payment-ui`: the upgrade-to-premium flow, return handling, status, and payment history UI.

### Modified Capabilities
<!-- None. Consumes the session/profile hooks from auth-ui / user-profile-ui. -->

## Impact

- **Backend consumed (read-only):** `src/app/module/payment/payment.route.ts`, `.controller.ts`,
  `.service.ts` (`toPublicPayment` shape), `.validation.ts` (`{ paymentId }`), enum `PaymentStatus`
  (`PENDING|SUCCESS|FAILED|CANCELLED`). All responses use the `sendResponse` envelope
  `{ success, statusCode, message, data, meta? }`.
- **Frontend:** `src/api/payment.ts`, `src/hooks/usePayments.ts`, `src/modules/payment/*`, routes
  under `src/app/(app)/payment/`.
- **Reuse:** `reusable-ui-blocks/buttons/BaseButton`, `pagination/Pagination`,
  `placeholder/skeletons`, `placeholder/no-results-found-wrapper`, `tabs`, `dates/date-filter`.
- **Depends on:** foundation-and-design-system, auth-ui (session hooks), app-shell-and-marketing
  (sidebar premium badge).

## Non-goals

- No card/other providers (only `BKASH`, sandbox); no refunds, invoices/PDF, or subscriptions.
- No client-side premium decision: `isPremium` always comes from the backend.
- No handling of bKash credentials; the browser only follows `redirectUrl`.
