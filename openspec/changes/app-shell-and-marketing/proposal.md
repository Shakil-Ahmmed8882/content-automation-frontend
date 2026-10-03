## Why

The foundation change ships a scaffold, dark Vercel tokens, providers, apiClient and a skeleton home
page/navbar/footer. Users still need a real public face (marketing home that sells the product and the
premium tier) and a real signed-in frame (sidebar dashboard shell, route protection, error states) for
every later feature UI to plug into.

## What Changes

- **Marketing home (`/`):** hero with mesh gradient, features, how-it-works, pricing/premium teaser,
  final CTA, footer. Public; a signed-in user can still open it.
- **Shared navbar/footer:** session-aware. Guests see Login / Get started; signed-in users see a
  Dashboard button plus an avatar menu with Profile and Logout.
- **Route groups:** `(marketing)` public, `(auth)` login/register/forgot/reset, `(app)` protected.
- **Dashboard shell:** sidebar with Dashboard, Create Post, Connections, Executions, Profile;
  **Upcoming Features** shown only to premium users; **Upgrade** entry shown to non-premium users.
  Collapses to a drawer on mobile.
- **Dashboard overview (`/dashboard`):** welcome header, premium status card, quick links to Create
  Post / Connections / Executions, empty states until those features ship.
- **AuthGuard** for all `(app)` routes, driven by `GET /auth/me`.
- **404, error boundary and loading** states for each route group.

Consumes: `GET /api/v1/auth/me` (`src/app/module/auth/auth.route.ts`, `auth.controller.ts#getMe`) via
the session hook owned by `auth-ui`. Reads `isPremium` and `role` from the returned user row
(`docs/data-model.md` section 4.1). No new backend endpoints.

## Capabilities

### New Capabilities
- `app-shell`: public marketing site, shared navigation, the authenticated dashboard shell and its
  route protection and fallback states.

### Modified Capabilities
<!-- None. Replaces foundation skeleton pages in place. -->

## Impact

- **Routes:** `src/app/(marketing)`, `(auth)` (layout only), `(app)` plus `not-found`/`error`/`loading`.
- **Components:** `src/modules/marketing/*`, `src/modules/layout/{Navbar,Footer,Sidebar,AppTopbar}`,
  `AuthGuard`. Reuses `reusable-ui-blocks/{buttons/BaseButton, images/variations/avatar,
  layouts/wrapper/error, placeholder/skeletons, placeholder/no-results-found-wrapper, guard/ShowIf}`.
- **Depends on:** `foundation-and-design-system` (tokens, providers, apiClient); `auth-ui` supplies the
  `useSession` hook that this change consumes.
- **Non-goals:** contents of Create/Connections/Executions/Payment/Upcoming/Admin pages (their own
  changes); real pricing/checkout (premium-payment-ui); dashboard analytics/charts; light theme;
  SEO beyond basic metadata.
