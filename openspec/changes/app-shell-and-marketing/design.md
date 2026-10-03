## Context

See `proposal.md`. The foundation provides tokens, providers, `apiClient`, and skeleton pages. This
change defines the structure every other UI change mounts into. Backend contract: `GET /auth/me`
returns the user row in the `sendResponse` envelope `{ success, statusCode, message, data }`;
`data` carries `id, name, email, avatarUrl, role, isPremium, status`.

## Goals / Non-Goals

**Goals:** an on-brand public home, a stable dashboard frame, correct gating by session and premium.
**Non-Goals:** page content for downstream features; billing; analytics; server-side auth middleware.

## Decisions

### D1: Route groups `(marketing)`, `(auth)`, `(app)`
Each group has its own layout (marketing: navbar+footer; auth: centred card; app: sidebar shell).
URLs stay flat (`/`, `/login`, `/dashboard`) as `config.yaml` requires.

### D2: Client-side AuthGuard on the `(app)` layout, not Next middleware
Cookies are httpOnly on the API origin and cannot be verified at the edge without a backend call.
The guard reads the shared `useSession()` query (`/auth/me`), shows a skeleton while loading,
redirects guests to `/login?next=<path>`. Trade-off: brief skeleton flash; acceptable and simple.

### D3: Session-aware nav with home always reachable
Navbar uses `useSession()`; signed-in users get a Dashboard button but are never redirected away
from `/` (explicit requirement). Session loading renders a neutral placeholder to avoid flicker.

### D4: Sidebar items from a typed config with visibility predicates
One `navItems` array in `src/routes`; each item has `visible(user)`. Premium-only (Upcoming Features)
and non-premium-only (Upgrade) are predicates on `user.isPremium`. This is UX only; the backend
enforces premium on every route (PRD section 23).

### D5: Mesh gradient via CSS, no new dependency
Layered radial gradients on tokens plus a subtle framer-motion fade-in. No image or WebGL library.

### D6: Per-group `error.tsx`, `loading.tsx`, `not-found.tsx`
Reuse `CustomErrorBoundary` and skeleton blocks; errors offer retry and a link home.

## Risks / Trade-offs

- **Flash of skeleton on hard reload of /dashboard.** Skeleton mirrors the shell layout.
- **Premium state stale after payment.** Invalidate the `session` query on payment success (the
  query key is exported from `auth-ui` and used by premium-payment-ui).
- **Marketing pricing copy drifts from the real price.** Teaser links to `/payment` and avoids
  hardcoded amounts unless the PRD states them.
