## Why

Premium members get a curated look at planned capabilities (PRD §16). The page is also the main
reason to upgrade, so non-premium users must see a clear gate that leads to payment rather than a
raw error. All gating is enforced by the backend; the UI only reflects it.

## What Changes

- **List page** `/upcoming-features`: responsive grid of feature cards (image, title,
  `shortDescription`, status badge `COMING_SOON|IN_DEVELOPMENT|PLANNED`), ordered by `sortOrder`
  (the backend already returns them ordered), from `GET /upcoming-features`.
- **Detail page** `/upcoming-features/[slug]`: hero image, title, status, long `description`, from
  `GET /upcoming-features/:slug`; unknown or hidden slug -> 404 state.
- **Non-premium gate:** a `403 "This area is for premium members"` response (or `isPremium: false`
  in the profile) renders an upgrade CTA linking to `/payment`; the sidebar entry is hidden for
  non-premium users.
- **States:** skeleton cards while loading, empty state, error state with retry.

## Capabilities

### New Capabilities
- `upcoming-features-ui`: premium-only browsing of the upcoming features catalogue with a
  non-premium upgrade gate.

### Modified Capabilities
<!-- None. Reads isPremium from the session/profile hooks; nav entry is contributed to the shell. -->

## Impact

- **Backend consumed (read-only):** `src/app/module/upcomingFeature/upcomingFeature.route.ts`
  (premiumRouter: `auth()` + `requirePremium`), `.service.ts` (`listVisible`, `getBySlug`),
  model `prisma/schema/upcomingFeature.prisma`
  (`id, slug, title, shortDescription, description, imageUrl, imagePublicId, status, sortOrder,
  isPremiumVisible, createdAt, updatedAt`); `src/app/middleware/requirePremium.ts` (DB-checked 403).
  Envelope `{ success, statusCode, message, data }`; list `data` is an array, no `meta`.
- **Frontend:** `src/api/upcomingFeatures.ts`, `src/hooks/useUpcomingFeatures.ts`,
  `src/modules/upcoming-features/*`, routes `src/app/(app)/upcoming-features/`.
- **Reuse:** `reusable-ui-blocks/images/BaseImage`, `placeholder/skeletons/CardSkeletons`,
  `placeholder/no-results-found-wrapper`, `buttons/BaseButton`, `guard/ShowIf`.
- **Depends on:** foundation-and-design-system, auth-ui, app-shell-and-marketing (sidebar),
  premium-payment-ui (upgrade target and premium refresh).

## Non-goals

- No admin editing here (see admin-console-ui); no voting/subscribing to features.
- No client-side enforcement as security: hiding the nav entry is UX only.
- No pagination/search (backend returns the full ordered list).
