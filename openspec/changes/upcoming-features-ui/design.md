## Context

See `proposal.md` - Why. Both read routes sit behind `auth()` + `requirePremium`, which re-reads
`isPremium` from the DB on every request. A non-premium call returns 403 with message "This area is
for premium members"; an unauthenticated call returns 401 (handled globally by the auth layer). A
slug that is missing or `isPremiumVisible=false` returns the same 404 "Upcoming feature not found".

## Goals / Non-Goals

**Goals:** attractive card grid, clean gate, no flash of forbidden content.
**Non-Goals:** admin tooling, personalization, delivering the features.

## Decisions

### D1: Gate by both profile flag and 403
Use `isPremium` from the profile hook to decide nav visibility and to skip the request entirely
(render `UpgradeGate` immediately). Still handle a 403 from the API (stale profile) by rendering the
same gate. Rationale: the backend is authoritative; the flag is only an optimisation.

### D2: Server order is display order
Render the array as returned (already `orderBy sortOrder asc`); do not re-sort client-side, so admin
reordering is reflected exactly.

### D3: Status badge mapping
`COMING_SOON`, `IN_DEVELOPMENT`, `PLANNED` map to labelled badges using Vercel dark tokens (e.g.
blue/amber/neutral); unknown values fall back to a neutral badge.

### D4: Images via BaseImage with fallback
`imageUrl` may be null: show a gradient placeholder with the feature initial. Use `BaseImage`
(lazy, fixed aspect ratio) to avoid layout shift.

### D5: Slug detail is a dynamic route
`/upcoming-features/[slug]` fetches by slug (cached under its own query key, seeded from the list when
available). 404 shows a not-found state with a back link, not Next's global 404.

## Risks / Trade-offs

- **Stale premium flag after upgrade/revoke.** -> 403 handling (D1) and invalidation from
  premium-payment-ui keep it consistent.
- **Long descriptions.** -> render as plain text with preserved line breaks (no HTML injection).

## Migration Plan

1. api + hooks; 2. card + list page; 3. detail; 4. gate + nav hiding; 5. verify with premium and
non-premium accounts via Playwriter.
