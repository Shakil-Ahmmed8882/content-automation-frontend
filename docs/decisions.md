# Decision log

Case-study log of every dependency and non-trivial decision: the problem, the choice, the why.
Newest at the bottom. Add an entry as you make the decision, not afterwards.

---

## D1 — Stack mirrors the L7 PH-Healthcare Next.js foundation

**Problem:** Needed a frontend structure that is already proven and easy to extend for ten slices.
**Decision:** Next.js 16 App Router + TanStack Query + ofetch, with the `api → hooks → components`
layering, `routes/`, `types/`, `validation/`, `providers/` folders of the L7 foundation.
**Why:** One mental model across projects; the thin `api` layer keeps the backend contract in one place.

## D2 — Reusable UI blocks copied from a sibling project

**Problem:** Building buttons, forms, modals, infinite scroll, date/time pickers from scratch is slow and inconsistent.
**Decision:** Copied `components/reusable-ui-blocks` (+ the shadcn primitives it needs) from the
housekeeping-front project (read-only source; our copy is independent).
**Adaptations made so it works here:**
- `lib/i18n` replaced by a single-locale (English) `useTranslation` over the copied `en.json`.
- `lib/errors` reduced to `ErrorCode` + `ActionResult` (the rest was coupled to that project's API layer).
- Removed `constants/roles.tsx` (housekeeping-specific icons); `ScrollableTabsHeader` now defaults to no tabs.
- Biome overrides relax a handful of style lint rules for the copied folders only.
**Why:** Reuse what's already battle-tested; keep feature code on our stricter lint rules.

## D3 — shadcn `new-york` (radix) instead of `base-nova` (base-ui)

**Problem:** The copied primitives are radix-based; the L7 starter uses the base-ui style.
**Decision:** `components.json` style `new-york` with `radix-ui`. **Why:** New `shadcn add` output then matches the copied blocks.

## D4 — `react-day-picker` pinned to v9

**Problem:** v10 removed the `table` classNames key the copied calendar relies on (type error).
**Decision:** `react-day-picker@^9.14`. **Why:** Matches the source project; revisit when the calendar is reworked.

## D5 — Dependencies added

| Package | Why |
|---|---|
| `@tanstack/react-query` | Server-state cache, loading/error states, invalidation |
| `ofetch` | Tiny fetch wrapper; `credentials: "include"` for cookie auth |
| `react-hook-form` + `@hookform/resolvers` + `zod` | Forms + schema validation (copied form blocks use them) |
| `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` | shadcn/ui runtime |
| `lucide-react` | Icons |
| `react-icons` | Brand icons (LinkedIn/Facebook) — lucide v1 dropped brand glyphs |
| `framer-motion` | Modal / drawer / multipage transitions in the copied blocks |
| `recharts` | Charts in the copied blocks (dashboard use later) |
| `date-fns`, `dayjs`, `react-day-picker` | Date/time pickers and filters in the copied blocks |
| `use-context-selector` | Selector contexts in the copied blocks (modal, pagination, infinite scroll) |
| `sonner` | Toasts |
| `next-themes` | Reserved for theme handling; app is dark-only today |

Removed after scaffolding: `@tanstack/react-table`, `@tanstack/react-form` (not needed; avoids two form libs).

## D6 — Dark-only theme derived from a light-first design system

**Problem:** The Vercel-inspired design file is light-first; the product must be fully dark.
**Decision:** Apply the system's own "polarity-flipped dark band" rule globally: ink `#171717`/`#0a0a0a`
become the surface ladder, the black CTA becomes a white pill, hairlines become `white/10`, and stacked shadows
get an inset white hairline. All values live as tokens in `globals.css`; `html` carries `class="dark"`.
**Why:** One place to tune the look; components use semantic tokens only, so consistency is automatic.

## D7 — Single brand mark for logo, favicon and in-app header

`public/logo.svg`, `src/app/icon.svg` and `components/brand/Logo.tsx` share one original glyph
(one input branching to two outputs = write once, publish to many). No third-party logo → no licensing issues.

## D8 — Package manager and tooling

bun for install/scripts (matches L7), Biome for lint/format (no ESLint/Prettier), React Compiler enabled.

## D9 — OpenSpec for planning

Ten vertical-slice changes planned up front under `openspec/changes/`, mirroring the backend's flows,
so implementation never starts "randomly". Each slice is applied, verified in the browser, reviewed, then archived.

## D10 — Planned: `@xyflow/react` for the read-only workflow view (not installed yet)

**Problem:** PRD §11/§26 asks for a visible, read-only workflow (post → platforms → result) on the
execution screens; no copied block draws node graphs.
**Decision:** Add `@xyflow/react` (React Flow) when `publish-and-executions-ui` is applied — read-only,
no editing, nodes styled with the dark tokens. **Why:** It is the library the PRD names, it is the standard
for node graphs in React, and drawing a graph by hand would be a primitive built from scratch (CLAUDE.md rule 1).

## D11 — Planning documents derived from the implemented backend

`docs/api-contract.md` (every endpoint, verified from backend source), `docs/ui-spec.md` (every screen),
`docs/frontend-architecture.md` (data layer, cache, session, polling, uploads, security) and
`docs/spec-traceability.md` (each backend requirement / PRD section → frontend change). **Why:** the backend is
already built and working, so the frontend plan is checked against what exists, not against assumptions.

## D12 — Canonical names where the planning documents disagree

The plan was written by several passes and some names drifted. Canonical choices (the repo wins):
- Route groups: `(public)/(marketing)`, `(public)/(authentication)`, `(dashboard)` — not `(app)` / `(auth)`.
- `/dashboard` hosts both the overview widgets and the posts feed; there is no `/posts` index. `/posts/[id]` is the only post route.
- Before applying a slice, reconcile its tasks with `docs/frontend-architecture.md` (query keys, file names) and `docs/ui-spec.md` (screen IDs).
- Copied blocks use light-theme colours in places; the nine in-place fixes (RT-1…RT-9) in `docs/ui-spec.md` §5.4 are folded into the first slice that touches them.

## D13 — Authentication first, using the canonical module names

Implementation starts with `auth-ui` at the user's request. The canonical paths remain
`api/auth.api.ts`, `hooks/auth.hook.ts`, `validation/auth.validation.ts`, and
`(public)/(authentication)`, rather than the older artifact's abbreviated paths.
Session state belongs exclusively to TanStack Query's `["session"]`. Login and verification
seed it; logout cancels outstanding queries and clears all private cache entries.
Credentials and OTPs are never persisted, and dev-only response OTPs are discarded in the API layer.

## D14 — Refresh is a single-flight request wrapper, not a response hook

An explicit ofetch wrapper can return the retried response, unlike an error notification hook.
It disables ofetch retries, shares concurrent refresh attempts, and retries each protected request
at most once. Business auth endpoints are excluded; `/auth/me` is not excluded, so reload can
renew an expired access cookie. Refresh network/5xx failures surface as errors without signing
the user out. Failed refresh authentication clears the private cache and preserves a safe `next`
path, with a query-only session-expiry notice. The initial guest check does not show that notice.

## D15 — Recovery confirmation, resend, and unavailable providers

Forgot password displays the same neutral confirmation for every email, followed by an explicit
"Enter code" link carrying the email into reset. Registration resend repeats `/auth/register`
with component-memory credentials and a 30-second cooldown. There is no invented resend endpoint.
HTTP 429 has a shared cooldown (readable Retry-After, otherwise 60 seconds), no automatic retry,
and a countdown. Google sign-in remains deferred: the backend exposes no Google auth route.

## D16 — Auth form port fixes and backend validation parity

RT-2 and the auth-facing portion of RT-9 are applied when the forms first ship: semantic dark
tokens, 40px inputs, 6px in-app radii, named password-toggle controls, and explicit button
transition properties. Existing GenericForm/TextField/SubmitButton are reused; OTP is composed
from their exported form primitives. Backend errors are inline alerts, with structured field
errors mapped only to known fields; 5xx text and raw response bodies are never rendered.

| Frontend schema / rule | Backend source |
|---|---|
| register: trimmed nonempty name, valid email, password minimum 8 | `../content-automation-backend/src/app/module/auth/auth.validation.ts`, `register` |
| login: valid email, nonempty password (not minimum 8) | same file, `login` |
| verify: valid email, exactly 6 numeric digits | same file, `verifyEmail` |
| forgot: valid email | same file, `forgotPassword` |
| reset: valid email, exactly 6 numeric digits, new password minimum 8 | same file, `resetPassword` |

Local verification uses the existing development PostgreSQL/Redis with runtime-only backend
connection overrides. SMTP is pointed at a closed local port for synthetic test users, so no
external email or credentials are sent; the backend's existing development OTP exposure is
consumed by the test runner only. Frontend `.env.local` selects the local API and is gitignored.

## D17 — Opt-in, prefilled demo login

At the user's request the local login form defaults to a dedicated, regular demo account.
`lib/demo-login.ts` reads opt-in `NEXT_PUBLIC_DEMO_*` configuration; the example leaves it disabled
and credentials empty. Local values are in gitignored `.env.local`, never in committed source.
These are intentionally public demo credentials, not secrets: never configure an administrator,
personal account, or production private account. The notice explains that users may replace the
prefilled details. No automatic login occurs and all authentication still goes through the API.

## D18 — Dashboard shell and real overview data

The shell consumes the completed auth hooks, uses a 240px sidebar from 960px and a 64px topbar,
and derives navigation/crowns only from the backend session. Shared connections/platforms and
recent-executions read hooks are implemented now, rather than returning stub data until later
slices. Their mutation/detail surfaces remain owned by those slices. Unimplemented destinations
have explicit module-pending pages; they are not presented as completed API features.

The existing drawer had neither focus trapping nor restoration. It now composes the installed
Radix Dialog focus/dismissal infrastructure while retaining its existing sizing, page history,
animations, and Escape behavior; its chrome is ported to dark tokens (RT-1). The action-menu
registry command stalled resolving dependencies and was stopped. UserMenu therefore composes
the already-installed Radix DropdownMenu directly, with semantic tokens and its built-in
keyboard/roving-focus behavior. No new dependencies were added.

Marketing actions are session-aware, with neutral pending and explicit retry states. Publishing
examples are labeled illustrations and say manual retry, not automatic retry. Footer copy no
longer claims operational health without a health query. Route error boundaries use this
installed Next version's `retry` prop, rather than the older `reset` prop.

Browser verification exposed two integration bugs: session-aware regions can hydrate after an
earlier region has already populated the query cache, so their initial markup uses a shared
server/client hydration snapshot. Also, removing the session query during logout stranded
mounted home-page observers on their previous user. Logout/expiry now publish `null` to the
existing session query and remove every other query plus mutation cache; a regression test
asserts mounted observers receive the guest transition and private data disappears.

The guest guard and successful login now use the same validated `next` destination, so a guard
effect cannot overwrite a connection/profile return path with `/dashboard`. After a previously
authenticated session becomes guest, the session provider owns expiry redirects; the protected
guard only redirects initial guests. This avoids racing a deliberate logout's home navigation.
Logout cancels in-flight private queries before clearing the backend cookies, as well as before
removing private cache entries.

## D19 — Parallel slice delivery with frozen cross-worker contracts

**Problem:** Slices 4-7 (`user-profile-ui`, `platforms-and-connections-ui`, `post-composer-ui`,
`publish-and-executions-ui`) are independent products of the same plan, but building them one
after another wastes most of the available execution time, while building them simultaneously
risks two authors editing the same file.
**Decision:** Each slice is owned by one worker with an exclusive file boundary, recorded in
`openspec/EXECUTION-STATE.md`. Files consumed by more than one slice are frozen contracts:
`connection.hook.ts` keeps `useConnections` / `usePlatforms` / `connectionQueryKey` and adds
`useConnectedPlatformKeys()`; `src/types/connection.type.ts` may gain fields but never lose them;
`src/lib/status.ts` keeps its existing `executionStatus` record for the dashboard widgets.
Shared infrastructure (`package.json`, `docs/`, `src/routes/`, `src/lib/apiClient.ts`,
`providers/`, `globals.css`, layout and reusable blocks) stays single-owner.
**Why:** Ownership boundaries, not coordination chatter, are what actually prevent conflicts;
the frozen signatures let dependent slices be written before their dependency is finished.

## D20 — The publish panel is a drop-in component, not an edit to the post page

**Problem:** `publish-and-executions-ui` has to put a publish control on `/posts/[id]`, which
belongs to `post-composer-ui`. Both slices were being built at the same time.
**Decision:** `post-composer-ui` leaves a marked placeholder on the post detail page;
`publish-and-executions-ui` ships `components/modules/executions/PublishPanel.tsx`
(`PublishPanel({ postId })`) which reads its pre-selected platforms from the
`?publish=<comma-separated-keys>` query parameter that the composer's "Save & publish" sets.
The two are wired together in a single integration step.
**Why:** Keeps the cross-slice seam to one component boundary and one query-parameter contract,
so neither slice has to wait for the other.

## D21 — `@xyflow/react` for the execution workflow graph

**Problem:** PRD sections 11 and 26 ask for a visual workflow of a publish run
(START -> PREPARE CONTENT -> one node per platform -> END) with live status.
**Decision:** Added `@xyflow/react` v12, rendered read-only (`nodesDraggable`,
`nodesConnectable`, `elementsSelectable` all false) and styled with the existing dark tokens.
The per-platform status list stays on the page as the text equivalent.
**Why:** Hand-rolling node layout, edge routing and panning is a large amount of code for a
view the PRD describes precisely; the graph must never be the only way to read status, so the
accessible list remains authoritative.

## D22 — Local backend runs through a temporary dev entry

**Problem:** The backend's committed `.env` points `REDIS_*` at a Render-internal hostname that
does not resolve off-platform, and its empty `REDIS_USER` makes node-redis send a two-argument
`AUTH` that the bundled portable Redis 5 rejects, so the API could not boot locally and no slice
could be verified against real data.
**Decision:** Added `content-automation-backend/scripts/dev-local-redis.ts`, which patches the
resolved config object (overriding `process.env` is not enough, because `src/app/config`
re-runs `dotenv.config()`) and then boots the normal server. Verification fixtures are seeded
through the public API plus `scripts/seed-demo-connections.ts`.
**Why:** Verifying against the real API beats verifying against assumptions; patching a local-only
dev entry leaves the committed environment file untouched. Both scripts are temporary and should
be deleted once `.env` carries working local Redis defaults.
