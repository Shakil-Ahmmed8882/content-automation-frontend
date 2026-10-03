## 1. API & types (vertical slice)

- [ ] 1.1 Add `src/types/payment.ts` (`PaymentStatus`, `Payment` = toPublicPayment shape, `CreatePaymentResult { paymentId, redirectUrl }`) and `src/validation/payment.ts` (`verify` zod `{ paymentId }`); verify types match `payment.service.ts` and tsc passes.
- [ ] 1.2 Add `src/api/payment.ts` with `createPayment`, `verifyPayment`, `getPayment(id)`, `listPayments({page,limit,status})` using the ofetch client (credentials include) and unwrapping the `sendResponse` envelope incl. `meta`; verify against the live backend via curl/Playwriter network log.
- [ ] 1.3 Add `src/hooks/usePayments.ts` (`useCreatePayment`, `useVerifyPayment`, `usePayment`, `usePaymentHistory`) with query keys; verify hooks return typed data and surface backend `message` on error.

## 2. Upgrade page

- [ ] 2.1 Build `/payment` with benefits card and "Upgrade to Premium" `BaseButton` using Vercel dark tokens; verify it renders for a non-premium user.
- [ ] 2.2 Wire create -> store `paymentId` in guarded `sessionStorage` -> `window.location.assign(redirectUrl)`; verify the browser lands on the bKash sandbox page.
- [ ] 2.3 Add double-click protection (disabled while pending/after success) and error+retry state; verify only one `POST /payments/create` appears in the network log on a double click.
- [ ] 2.4 Add already-premium state (`isPremium` from profile hook, `premiumSince`); verify the CTA is hidden for a premium user.

## 3. Return pages & premium refresh

- [ ] 3.1 Build `/payment/success`: read stored `paymentId` (fallback `GET /payments?limit=1`), call verify, render SUCCESS/FAILED/CANCELLED/PENDING states; verify with a sandbox success payment.
- [ ] 3.2 Add bounded PENDING retry (2 attempts, 2s) + manual Retry button; verify the pending UI by delaying the response in devtools.
- [ ] 3.3 On SUCCESS invalidate session (`/auth/me`) and profile (`/users/me`) queries and clear stored id; verify the premium badge and sidebar entry appear without reload.
- [ ] 3.4 Build `/payment/failure` using `GET /payments/:id` to distinguish CANCELLED vs FAILED, with "Try again" and history links; verify cancel and failure sandbox paths.
- [ ] 3.5 Handle direct visit with no stored id and no payments (neutral failure state); verify typing `/payment/success` unpaid never shows success.

- [ ] 3.6 Fire the "Payment successful. Welcome to Premium." toast once (ref/flag), show the crown, and keep return pages idempotent on reload; verify reload shows SUCCESS with no second create call.

## 4. History & detail

- [ ] 4.1 Build `/payment/history` table/list with `Pagination` (meta), skeleton loading and `NoResultFoundWrapper` empty state; verify pagination drives `page`/`limit`.
- [ ] 4.2 Add status filter (tabs or select) resetting page to 1; verify `status=` param in the request.
- [ ] 4.3 Build `/payment/history/[id]` detail with 404 state; verify a foreign/unknown id shows "not found".
- [ ] 4.4 Add shared `PaymentStatusBadge` and amount/date formatters; verify all four statuses render distinct dark-theme badges.

## 5. Integration & docs

- [ ] 5.1 Add routes to the route config, add "Payment" nav + history link, require session; verify an unauthenticated visit redirects to login.
- [ ] 5.2 Run Biome check and `tsc --noEmit`; verify both pass.
- [ ] 5.3 Log decisions (sessionStorage paymentId, verify-on-return) in `docs/decisions.md`; verify entries exist.
- [ ] 5.4 End-to-end Playwriter run: upgrade -> bKash sandbox -> success -> badge visible -> history shows SUCCESS; verify, then repeat for cancel.
