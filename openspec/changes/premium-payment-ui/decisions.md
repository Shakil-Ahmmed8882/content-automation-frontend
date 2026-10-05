# premium-payment-ui decisions (to merge into docs/decisions.md)

- No new dependencies. Reused ofetch client, TanStack Query, zod, sonner, lucide, existing pagination/tabs/skeleton blocks.
- File names follow the repo convention (`payment.type.ts`, `payment.validation.ts`, `payment.api.ts`, `payment.hook.ts`), not the names in tasks.md.
- Pending payment id is kept in `sessionStorage["ca.pendingPaymentId"]` (try/catch guarded) because the backend callback redirect carries no query params. Fallback: newest payment from `GET /payments?limit=1`, only if created within 30 minutes (avoids showing an old success for a hand-typed URL).
- Return-page order follows docs/ui-spec S16/S17 (overrides design.md D2): read `GET /payments/:id` first; call `POST /payments/verify` only from the success page and only while the payment is PENDING. Verify on an abandoned payment can flip it to FAILED, so history, detail and the failure page never call verify (they re-read only).
- PENDING handling: verify once, then up to 2 automatic re-reads 2 s apart, then a manual "Check again" (which verifies at most once more).
- On SUCCESS: invalidate `["session"]`, `["profile"]`, `["payments"]`, clear the stored id. The welcome toast is deduped across reloads with `sessionStorage["ca.paymentWelcomeToast"] = paymentId`.
- Failure page redirects to `/payment/success` if the payment turns out to be SUCCESS (callback race).
- Upgrade page shows no price: the backend does not expose amount/currency before payment exists (ui-spec GAP). Amount only appears in history/detail. `redirectUrl` must be https or it is treated as a create failure. Double-click guarded by a ref plus the mutation pending state plus a `redirecting` flag.
- Payment status badge tones and formatters live in `components/modules/payment/payment.utils.ts` (could not touch `lib/status.ts`). `payment.hook.ts` imports the storage helpers from that file.
- Money formatting uses `Intl.NumberFormat` currency style with a plain `amount currency` fallback; amount accepted as string or number.
- History uses semantic link rows (stacked on mobile) instead of a table because no shadcn `table` component is installed and adding one is out of ownership.
