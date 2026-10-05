# Decisions - upcoming-features-ui

- No new dependencies.
- Gate: premium flag comes from `useSession()` (session cache is synced from the profile). Non-premium
  users never call the data endpoint (`enabled: isPremium`); a 403 from the API also renders the same
  `UpgradeGate`. While the session is unresolved the page shows the skeleton, never forbidden content.
- Server order is display order; no client-side sort.
- Retry policy: no retry on 4xx (403/404 are definitive), one retry otherwise.
- Detail query key `["upcoming-feature", slug]` is seeded from the cached list (`initialData`), still
  refetched when stale. 404 renders an in-page "Feature not found" state.
- Empty/error states are local cards in `FeatureStates.tsx` (same pattern as connections) because
  `NoResultFoundWrapper` hardcodes light-theme hex colours (`#141414`, `#666`) that are unreadable in
  the dark-only theme; `CardSkeletonV2` is still used for loading. Shared-file note, not modified.
- Status badges use semantic tokens only: COMING_SOON success, IN_DEVELOPMENT warning, PLANNED muted;
  unknown values fall back to a muted badge with a humanised label.
- Missing `imageUrl` renders a muted tile with the title initial; images use `BaseImage`.
- Description rendered as text with `whitespace-pre-line` (no HTML injection).
- Sidebar gating already exists in `nav.routes.ts`; no change made.
