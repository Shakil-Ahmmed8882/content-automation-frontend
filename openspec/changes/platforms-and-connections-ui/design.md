## Context

See `proposal.md`. Verified against backend source: `connection.controller.ts` `callback` responds
with a 200 JSON envelope via `sendResponse` — it performs **no redirect**, and `config.frontend_url`
(`FRONTEND_URL`) is used only for CORS (`src/app.ts`). The `.env.example` redirect URIs point at the
backend callback itself, so as-built a browser landing there would just see raw JSON.

## Goals / Non-Goals

**Goals:** a smooth connect round-trip ending back in the app; accurate status display; safe disconnect.
**Non-Goals:** changing backend code; token management UI.

## Decisions

### D1: Provider redirect URI = a frontend route that forwards to the backend callback
Set `LINKEDIN_REDIRECT_URI` / `FACEBOOK_REDIRECT_URI` to `<FRONTEND_URL>/connections/callback/<platform>`
(env + provider console only). That page reads `code` and `state` from the query and calls
`GET /api/v1/connections/<platform>/callback?code&state` with ofetch. The endpoint is deliberately
unauthenticated (state resolves the user) and CORS allows our origin, so this works. Outcomes:
`connected` -> toast + `router.replace("/connections")`; `select-page` -> `/connections?select=facebook`
opens the Page picker; HTTP error -> `/connections?error=<message>` shown as an error banner.
Provider-side denial arrives as `?error=...` with no `code`: treat as cancelled, no API call.
*Alternative rejected:* backend 302 redirect — needs a backend change; a possible follow-up that
would let the frontend drop the forwarding page.

### D2: Single-use callback guard
`code`/`state` are single-use; React strict mode or a refetch would double-call and yield "Invalid or
expired OAuth state". Run the callback in a `useMutation` fired once (ref guard), never in a query.

### D3: Status derived from two queries
Merge `GET /platforms` (catalogue, ordering, COMING_SOON) with `GET /connections` by `platform.key`.
Card state: `COMING_SOON` -> disabled "Coming soon"; connection `EXPIRED` -> warning + "Reconnect"
(same connect flow, backend upserts); `CONNECTED` -> account name + Disconnect; none -> Connect.

### D4: Facebook Page picker is resumable
The backend stashes Pages in Redis (TTL-bound). The picker fetches `GET /connections/facebook/pages`
on open, so a refresh keeps working; a 400 "no selection in progress" shows "Selection expired —
connect Facebook again". One-Page accounts are auto-connected by the backend (`kind: connected`).

### D5: Cache invalidation
Connect success, select-page and disconnect invalidate `["connections"]`; the composer derives
connectable targets from the same cache.

## Risks / Trade-offs

- **Redirect URI mismatch** (provider rejects callback). -> Log exact URIs in `docs/decisions.md`;
  verify with a real round trip.
- **Cookie/CORS on callback fetch.** -> Callback needs no cookie; still use the shared ofetch client.
- **Platform key assumptions.** -> Keys are data (`linkedin`, `facebook`); only the Page picker is
  special-cased on `facebook`.

## Migration Plan

1. Types + api + hooks. 2. Page + cards. 3. Callback route. 4. Page picker + disconnect.
5. Update backend `.env` and provider consoles; verify end to end in the browser.
