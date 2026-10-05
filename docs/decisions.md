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

## D23 — Per-slice implementation decisions (slices 4–9)

Merged from each change's working notes.

### user-profile-ui

- Implemented the profile data flow as `component -> hook -> apiClient`, using `/users/me` for profile detail and `/auth/me` only through the existing session cache.
- Kept profile and session caches synchronized after profile mutations by writing the returned profile to `["profile"]` and projecting it into `["session"]`.
- Sent only backend-authorized owner-scoped requests: no user id, no email on name update, and no client-side token handling.
- Added avatar client pre-checks for `image/*` and 5 MB before uploading multipart data with the `avatar` field.
- Split the profile UI into focused feature components under `src/components/modules/profile/`: page composition, state views, shared presentation, identity/avatar, account/premium, password, session, and danger-zone flows.
- Rebuilt account deletion with `MultipageModal`: the danger zone only shows a trigger, the first modal page contains the warning and typed `DELETE` confirmation, and the outcome pages reuse the shared success/error variation. A short redirect delay lets the success outcome render before clearing caches and navigating home.
- Did not add dependencies.

## Blockers

- Browser and real-session verification are reserved for the orchestrator by the worker contract, so network-tab checks, premium/non-premium account checks, and real login/delete scenarios were not run here.

### platforms-and-connections-ui

- Kept the frozen shared hook contract in `src/hooks/connection.hook.ts`: `connectionQueryKey`, `platformQueryKey`, `useConnections()`, and `usePlatforms()` remain exported with the required shapes.
- Added `src/types/platform.type.ts` for the platform catalogue while re-exporting `Platform` from `src/types/connection.type.ts` so existing imports keep working.
- Kept `listPlatforms` as a compatibility re-export from `connection.api.ts`; new code imports `getPlatforms` from `platform.api.ts`.
- `useConnectedPlatformKeys()` returns active, LIVE platform connections only, with shape `{ key, name, status, accountName }`; `EXPIRED` is included so downstream UI can block or prompt reconnect.
- The OAuth callback is a client handler with a ref guard, not a query, so the single-use `code`/`state` pair is submitted once under React strict mode.
- The Facebook Page picker uses the required `MultipageModal` and fetches `["fb-pages"]` on open so a refresh can resume while the backend Redis stash is valid.
- Error banners use safe error codes in the URL (`cancelled`, `invalid-state`, `failed`); backend messages are shown via toast at the time of the failed API call.

## Deviations

- Browser/network verification, Playwriter visual verification, and full live OAuth were not run in this worker because the task explicitly reserves dev server/browser orchestration for the coordinator.
- `bun run check`, `bun run build`, and `next build` were not run because this worker was explicitly forbidden to run them. Required local validation was limited to `npx tsc --noEmit --incremental false` and the scoped Biome command.

## Blockers

- B-01: Live LinkedIn/Facebook OAuth cannot be completed until a human registers frontend redirect URIs in the provider consoles and backend env. Required values:
  - `LINKEDIN_REDIRECT_URI=<FRONTEND_URL>/connections/callback/linkedin`
  - `FACEBOOK_REDIRECT_URI=<FRONTEND_URL>/connections/callback/facebook`
  - For local `FRONTEND_URL=http://localhost:3000`, register `http://localhost:3000/connections/callback/linkedin` and `http://localhost:3000/connections/callback/facebook`.

### post-composer-ui

## Decisions

- Implemented the repo naming convention from the coordination note: `src/types/post.type.ts`, `src/validation/post.validation.ts`, `src/api/post.api.ts`, and `src/hooks/post.hook.ts`.
- `POST /posts` is built with `FormData` and does not set `Content-Type`; the browser owns the multipart boundary.
- Image selection uses `AttachmentField` with `maxSizeKb={5120}`, which runs the shared `prepareImage` helper and keeps the composer to one held file by replacing the previous image on add.
- Save & publish creates the immutable post first, then navigates to `/posts/<id>?publish=<comma-separated-platform-keys>`. The publish slice owns reading that query param and rendering `<PublishPanel postId={post.id} />`.
- `/posts/[id]` contains the publish handoff placeholder in `src/components/modules/posts/PostDetailView.tsx` beside the post content.
- The dashboard keeps the existing overview, connection and execution widgets, and appends the posts list below them.
- `/posts/[id]` is implemented under the guarded `(dashboard)` route group; `routes.postDetail(id)` already existed and no route/config files were edited.

## Deviations

- The tasks file references bare `src/types/post.ts`, `src/api/post.ts`, `src/hooks/usePosts.ts`, and `src/validation/post.ts`; the coordination note supersedes that with the repo convention names above.
- The tasks file asks to document the publish contract in `docs/decisions.md`, but this worker owns only the OpenSpec change decisions file, so the contract is recorded here.
- Browser/network-panel, visual Playwriter, and end-to-end backend verification were not run because the coordination instructions explicitly forbid browser/Playwriter and dev/build ownership for this worker.

## Blockers

- None for code implementation.
- Manual browser verification remains for the orchestrator/integration pass.

### publish-and-executions-ui

- Kept the existing file names (`execution.type.ts`, `execution.api.ts`, `execution.hook.ts`, `status.ts`) to match the repository convention and the W4 ownership contract, even where the original OpenSpec task text used shorter names.
- `PublishPanel` is standalone at `src/components/modules/executions/PublishPanel.tsx` and fetches the post content via `GET /posts/:id` so it can enforce the "no empty post" publish disable state while only receiving `postId`.
- Publish is never automatic: `?publish=` only pre-selects connected platforms; the user must press **Publish now**.
- The execution detail completion toast fires only after an observed active-to-terminal transition, so reopening an already finished execution does not duplicate a completion toast.
- `@xyflow/react` was already present in `package.json` and is used only by `WorkflowGraph`; no dependency was added by W4.
- The workflow graph hides React Flow attribution with `proOptions.hideAttribution`, uses semantic CSS variables for node styles, and keeps per-platform result cards as the accessible text equivalent.
- Date filtering reuses the shared date filter utilities, then maps `start_date`/`end_date` to the executions API contract's `dateFrom`/`dateTo` query params.
- The `/executions` row click navigates to `/executions/<id>`. A global sidebar/nav entry was not added because W4 must not edit layout/navigation-owned files.

## Deviations

- OpenSpec references logging the React Flow dependency in `docs/decisions.md`, but W4's editable docs boundary only includes this change's `decisions.md`. The dependency decision is recorded here for integration.
- Browser/network verification and visual 375px checks were not run because the W4 instructions explicitly forbid browser/Playwriter and dev/build commands.

## Blockers

- B-01/B-02: A live publish run needs real LinkedIn/Facebook connections. Those require provider-console redirect URIs and a human OAuth consent click. To verify end-to-end, a human must connect/reconnect live LinkedIn and Facebook Page accounts, then run Save & publish -> post detail handoff -> Publish now -> execution detail -> forced failure/retry -> history.

### premium-payment-ui

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

### upcoming-features-ui

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

### admin-console-ui

- Admin guard lives in `AdminGuard` (client), rendered by `(dashboard)/admin/layout.tsx`. It is a UX gate only: children (and therefore every admin request) mount only for `ADMIN`/`SUPER_ADMIN` sessions; others see the Forbidden view. The parent `AuthGuard` already redirects anonymous visitors to `/login?next=`; the guard repeats the redirect defensively. Backend 403s are still surfaced as toasts.
- `/admin` redirects server-side to `/admin/platforms`.
- Admin tabs are plain `Link`s with `aria-current`, not `ScrollableTabsHeader`: that block is state-driven with light hard-coded colours, while admin sections are real routes.
- File naming follows the repo convention (`admin-platform.api.ts`, `admin-platform.hook.ts`, `admin.type.ts`, `admin.validation.ts`) instead of the nested paths in `tasks.md`.
- The shared `MultipageModal` panel is white; `AdminModal` overrides it with `!bg-card !text-card-foreground` instead of editing the shared block. `DeleteConfirmModal` is reused as-is (it is a light modal; same precedent as the posts module).
- User actions (block/unblock, premium, role) confirm inline inside the detail drawer rather than through `DeleteConfirmModal`: the drawer sits at z-999999 and the confirm modal at z-99999, so the modal would render behind it. The inline confirm defaults focus to Cancel.
- Images are a second step (D4): JSON save first, then multipart `logo`/`image`. If the upload fails the record is kept, a toast explains it, and the picked `File` is held in page state so the row shows "Retry upload".
- `sortOrder` is held as a string in the form (numeric `TextField` yields strings) validated by `/^-?\d+$/` and converted with `Number()` on submit, so the backend always receives a JSON integer. This avoids `z.coerce` input-type friction with `GenericForm`.
- Platform edit reuses the create schema with `key` read-only/disabled (its value always validates); the PATCH body never includes `key`.
- 409 on create/edit is shown inline on `key` (platform) or `slug` (feature) using the backend message.
- Pagination reuses the shared `Pagination` through `AdminPager`, a small bridge that keeps the URL as the source of truth and maps backend `meta` (`page,limit,total,totalPages`) to the block's meta shape.
- Audit filters (`action`, `entityType`) are selects of known values with an "Other..." free-text fallback; `actorId` is a debounced text input; all live in URL params and reset `page`. The API has no actor name, so ids are shown in mono with copy and "Filter by this actor".
- Platform mutations invalidate `["admin","platforms"]` and `["platforms"]`; feature mutations invalidate `["admin","features"]`, `["upcoming-features"]`, `["upcoming-feature"]`; user mutations write `["admin","user",id]` and invalidate `["admin","users"]` and `["admin","audit-logs"]`.
- Not implemented (UX policy only, not enforced by the backend): hiding block/premium controls for equal or higher roles. Only self-row status/role and deleted-user actions are disabled, per `docs/ui-spec.md` S23.
- No tables/badges from shadcn exist in `components/ui`, so semantic `<table>` markup and a small token-styled `AdminBadge` are used. No dependencies were added.

## Blockers

- Browser verification (guards for USER/ADMIN/anonymous, multipart field names, audit entries, role-specific controls) is left for the orchestrator pass; the backend was not running.

## D24 — Dark-theme fixes in two shared blocks

**Problem:** `NoResultFoundWrapper` hard-coded light-theme text colours (`#141414`, `#666`) and a 60px pill
button, and `CardSkeletonV2` sat on `bg-white`, so empty states were unreadable and loading cards flashed
white on the dark theme. Several slices had worked around it with local empty-state cards.
**Decision:** Fixed both in place with semantic tokens (`text-foreground`, `text-muted-foreground`,
`bg-card`, `text-primary-foreground`) and the 6px in-app button radius, per CLAUDE.md ("fix genuine bugs
in place and log it").
**Why:** One fix in the shared block beats per-page workarounds; the unused demo charts and community
skeletons in the same folder still carry light colours and were deliberately left untouched.
