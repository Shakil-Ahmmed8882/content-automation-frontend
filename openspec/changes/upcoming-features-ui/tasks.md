## 1. API & hooks (vertical slice)

- [x] 1.1 Add `src/types/upcomingFeature.ts` (`UpcomingFeature`, `UpcomingFeatureStatus`) matching `prisma/schema/upcomingFeature.prisma`; verify fields against the live response and tsc passes.
- [ ] 1.2 Add `src/api/upcomingFeatures.ts` (`listUpcomingFeatures`, `getUpcomingFeatureBySlug`) via ofetch with credentials include and envelope unwrapping; verify with a premium session in the network log.
- [ ] 1.3 Add `src/hooks/useUpcomingFeatures.ts` (`useUpcomingFeatures`, `useUpcomingFeature(slug)`) with keys, `enabled` tied to `isPremium`, and 403 surfaced as a typed `forbidden` flag; verify a non-premium account sets it.

## 2. List page

- [ ] 2.1 Build `FeatureCard` (BaseImage, title, short description, status badge) in dark Vercel style; verify visual match with the design system at desktop and mobile widths.
- [ ] 2.2 Build `/upcoming-features` responsive grid rendering backend order; verify order follows `sortOrder` by changing it in the backend.
- [x] 2.3 Add `FeatureStatusBadge` with label/style per status and neutral fallback; verify all three statuses.
- [ ] 2.4 Add skeleton (`CardSkeletons`), empty (`NoResultFoundWrapper`) and error+retry states; verify each by throttling, emptying the table, and stopping the backend.

- [x] 2.5 Add the crown "Premium" heading badge and ensure no feature copy is hard-coded; verify cards disappear when the backend row is deleted.

## 3. Detail page

- [x] 3.1 Build `/upcoming-features/[slug]` (hero image, status, description with preserved line breaks, back link); verify with a seeded slug.
- [x] 3.2 Add not-found state for 404 and skeleton while loading; verify an unknown slug and a hidden (`isPremiumVisible=false`) slug both show it.

## 4. Premium gate & navigation

- [x] 4.1 Build `UpgradeGate` (copy + `BaseButton` to `/payment`); verify it renders for a non-premium user without calling the data endpoint.
- [ ] 4.2 Handle a 403 from list/detail by showing `UpgradeGate`; verify by forcing a stale `isPremium=true` profile against a non-premium DB user.
- [ ] 4.3 Hide the sidebar "Upcoming Features" entry unless premium (via `ShowIf`) and add the route to the route config with session guard; verify it appears after a payment success refresh without reload.

## 5. Integration

- [x] 5.1 Run Biome check and `tsc --noEmit`; verify both pass.
- [ ] 5.2 Log decisions (profile-flag + 403 gate, server order) in `docs/decisions.md`; verify entries exist.
- [ ] 5.3 End-to-end Playwriter run with a non-premium then premium account (gate -> upgrade -> list -> detail); verify each state.
