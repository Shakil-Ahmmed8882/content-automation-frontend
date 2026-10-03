# UI Specification — Content Automation Frontend

Screen-by-screen specification for the frontend, derived from the **implemented backend**
(`../content-automation-backend`: `docs/PRD.md`, `docs/data-model.md`, `src/app/module/*`) and the existing
frontend plan (`openspec/changes/*`, `CLAUDE.md`, `docs/decisions.md`, `src/design-system/vercel-design-system.md`,
`src/app/globals.css`, `src/components/**`).

Status: planning only. No app code is implied to exist beyond what the repo already contains
(foundation + marketing skeleton + login/register placeholders).

Companion document: `docs/api-contract.md` (written by another agent). This file names endpoints exactly as the
backend routes define them; if `api-contract.md` uses different function names, the **HTTP method + path** here is
authoritative (both derive from backend source).

Verification legend used throughout:
- (V) verified against backend source in this pass.
- UNVERIFIED — could not be confirmed from source; do not build on it without checking.
- GAP — backend does not provide it; UI must degrade honestly (CLAUDE.md rule 8: no fake functionality).
- DEVIATION — this spec intentionally differs from an existing OpenSpec change; the change must be amended.

---

## 0. Conventions used by every screen

### 0.1 API basics (V)

| Item | Value |
|---|---|
| Base URL | `NEXT_PUBLIC_API_BASE_URL` **already includes `/api/v1`** (`.env.example`). Paths below are relative to it, e.g. `GET /auth/me`. |
| Auth | httpOnly cookies `accessToken` (1 day) + `refreshToken` (7 days), set by backend on login/verify-email. `credentials: "include"` is set in `src/lib/apiClient.ts`. JS never reads tokens. |
| Success envelope | `{ success: true, statusCode, message, data, meta? }`; `meta = { page, limit, total, totalPages }` on paginated lists (`utils/sendResponse.ts`). |
| Error envelope | `{ success: false, statusCode, message, name, ... }` from `globalErrorHandler`. Only `message` is reliable. In production `error`/`stack` are absent. |
| Validation errors | `validateRequest` joins all zod issue messages into ONE string: `issues.map(m => m.message).join(", ")`, status 400. There is **no field-level error map**. UI therefore validates with a mirrored zod schema first, and shows any server 400 `message` as a form-level alert (`role="alert"`). |
| Unknown route | 404 `{ success:false, message:"Route not found", path, date }` (`notFound.ts`). |
| Rate limits | Global 300 req / 15 min / IP (`app.ts`); auth limiter 20 req / 15 min / IP on register, verify-email, login, forgot-password, reset-password (`rateLimiter.ts`, responds 429 JSON `message: "Too many attempts. Please try again later."`). The global limiter's 429 is express-rate-limit's default **plain-text** body (api-contract 1.8), so `apiClient` must treat any 429 as rate-limited without parsing JSON. The auth counter is ONE shared counter across all five auth routes and successful requests count too. |
| Dev-only OTP | `register` / `forgot-password` may return `data.otp` outside production (`EXPOSE_OTP_IN_RESPONSE`). UI MUST ignore it. |
| Google sign-in | PRD §6.2 asks for it, but **backend exposes no `/auth/google` routes** (`auth.route.ts`; only `lib/googleAuth.ts` scaffold). GAP — no Google button anywhere (rule 8). `providers` may still contain `"GOOGLE"` for linked accounts. |

### 0.2 Roles, status, enums (V — `prisma/schema/enums.prisma`)

| Enum | Values |
|---|---|
| `Role` | `SUPER_ADMIN`, `ADMIN`, `USER` |
| `UserStatus` | `ACTIVE`, `BLOCKED` |
| `AuthProvider` | `CREDENTIALS`, `GOOGLE` |
| `PlatformStatus` | `LIVE`, `COMING_SOON` |
| `ExecutionStatus` | `PENDING`, `RUNNING`, `COMPLETED`, `PARTIALLY_COMPLETED`, `FAILED` |
| `PublicationStatus` | `PENDING`, `RUNNING`, `SUCCESS`, `FAILED` |
| `PaymentStatus` | `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED` (provider `BKASH`, purpose `PREMIUM_UPGRADE`) |
| `UpcomingFeatureStatus` | `COMING_SOON`, `IN_DEVELOPMENT`, `PLANNED` |
| Connection status (derived, not an enum) | `CONNECTED` or `EXPIRED` (`expiresAt < now`) — `connection.service.ts#toPublicConnection` |

### 0.3 Query keys (one owner per key — owned by the hook file named)

| Key | Hook file | Fetches |
|---|---|---|
| `["session"]` | `auth.hook.ts` | `GET /auth/me` (401 -> `null`) |
| `["profile"]` | `user.hook.ts` | `GET /users/me` |
| `["platforms"]` | `platform.hook.ts` | `GET /platforms` |
| `["connections"]` | `connection.hook.ts` | `GET /connections` |
| `["fb-pages"]` | `connection.hook.ts` | `GET /connections/facebook/pages` |
| `["posts", {search, sort}]` (infinite) | `post.hook.ts` | `GET /posts` |
| `["post", id]` | `post.hook.ts` | `GET /posts/:id` |
| `["executions", params]` | `execution.hook.ts` | `GET /executions` |
| `["execution", id]` | `execution.hook.ts` | `GET /executions/:id` (polled) |
| `["payments", params]` | `payment.hook.ts` | `GET /payments` |
| `["payment", id]` | `payment.hook.ts` | `GET /payments/:id` |
| `["upcoming-features"]` | `upcoming-feature.hook.ts` | `GET /upcoming-features` |
| `["upcoming-feature", slug]` | `upcoming-feature.hook.ts` | `GET /upcoming-features/:slug` |
| `["admin","platforms"]` | `admin/*.hook.ts` | `GET /admin/platforms` |
| `["admin","users", params]` / `["admin","user", id]` | | `GET /admin/users` / `/:id` |
| `["admin","audit-logs", params]` | | `GET /admin/audit-logs` |
| `["admin","features"]` | | `GET /admin/upcoming-features` |

File naming follows `CLAUDE.md` (`src/api/<name>.api.ts`, `src/hooks/<name>.hook.ts`); the OpenSpec changes use
slightly different names (`src/api/auth.ts`); `CLAUDE.md` wins (newer).

### 0.4 Route-group naming note

`CLAUDE.md` says guarded group `(dashboard)`; `app-shell-and-marketing/design.md` says `(app)` and `(auth)`;
the repo today has `(public)/(marketing)` and `(public)/(authentication)`. URLs are flat in all cases. **This spec
uses the repo's real names**: `(public)/(marketing)`, `(public)/(authentication)`, `(dashboard)` (guarded).
Log the choice in `docs/decisions.md` when change 2 lands.

---

## 1. Route map

Access legend: **public** = no session needed; **guest-only** = signed-in users are bounced to `/dashboard`;
**auth** = any signed-in ACTIVE user; **premium** = auth + `isPremium` (UX gate; backend `requirePremium` is authoritative);
**admin** = role `ADMIN`/`SUPER_ADMIN` (UX gate; backend `auth("ADMIN","SUPER_ADMIN")` is authoritative).

Layout legend: **Marketing** = `components/layout/public/{Header,Footer}`; **Auth** = centred card on `bg-background`
(`(public)/(authentication)/layout.tsx`); **App shell** = sidebar + topbar (`(dashboard)/layout.tsx`, change 2);
**Admin** = App shell + admin tab bar (`(dashboard)/admin/layout.tsx`, change 10).

Change numbers follow `CLAUDE.md` build order: 1 foundation, 2 app-shell-and-marketing, 3 auth-ui, 4 user-profile-ui,
5 platforms-and-connections-ui, 6 post-composer-ui, 7 publish-and-executions-ui, 8 premium-payment-ui,
9 upcoming-features-ui, 10 admin-console-ui.

| # | Route | Screen | Access | Built by | Layout |
|---|---|---|---|---|---|
| S01 | `/` | Marketing home | public (signed-in allowed, never redirected) | 2 (skeleton exists from 1) | Marketing |
| S02 | `/login` | Login (+ session-expired variant `?reason=session-expired`) | guest-only | 3 | Auth |
| S03 | `/register` | Register + verify-email OTP (two steps, one URL) | guest-only | 3 | Auth |
| S04 | `/forgot-password` | Forgot password | guest-only | 3 | Auth |
| S05 | `/reset-password?email=` | Reset password (email + OTP + new password) | guest-only | 3 | Auth |
| S06 | `/dashboard` | Dashboard overview | auth | 2 (frame), widgets filled by 5, 6, 7 | App shell |
| S07 | `/create` | Create post (composer) | auth | 6 | App shell |
| S08 | `/dashboard` (section) | Posts list / feed — a section of the dashboard page (see 1.1) | auth | 6 | App shell |
| S09 | `/posts/[id]` | Post detail + Publish panel | auth | 6 (detail), 7 (publish panel) | App shell |
| S10 | `/connections` | Connections (+ `?select=facebook` page picker, `?error=`) | auth | 5 | App shell |
| S11 | `/connections/callback/[platform]` | OAuth return handler | auth (works on state alone, see S11) | 5 | App shell (minimal) |
| S12 | `/executions` | Executions list | auth | 7 | App shell |
| S13 | `/executions/[id]` | Execution detail (workflow + per-platform results + retry) | auth | 7 | App shell |
| S14 | `/profile` | Profile (edit name, avatar, change password, delete account) | auth | 4 | App shell |
| S15 | `/payment` | Upgrade to Premium | auth | 8 | App shell |
| S16 | `/payment/success` | Payment return — success/pending result | auth | 8 | App shell |
| S17 | `/payment/failure` | Payment return — failed/cancelled | auth | 8 | App shell |
| S18 | `/payment/history` | Payment history | auth | 8 | App shell |
| S19 | `/payment/history/[id]` | Payment detail | auth | 8 | App shell |
| S20 | `/upcoming-features` | Upcoming features list (gate for non-premium) | premium | 9 | App shell |
| S21 | `/upcoming-features/[slug]` | Upcoming feature detail | premium | 9 | App shell |
| S22 | `/admin/platforms` | Admin: platforms | admin | 10 | Admin |
| S23 | `/admin/users` | Admin: users (+ detail drawer) | admin (role change: SUPER_ADMIN) | 10 | Admin |
| S24 | `/admin/audit-logs` | Admin: audit logs | admin | 10 | Admin |
| S25 | `/admin/upcoming-features` | Admin: upcoming features CRUD | admin | 10 | Admin |
| S26 | any unknown URL | 404 (`not-found.tsx`) | public | 2 | context-aware (Marketing or App shell) |
| S27 | any route segment error | Error boundary (`error.tsx`, `global-error.tsx`) | n/a | 2 | per group |
| S28 | `/login?reason=session-expired` | Session expired (not a separate route) | guest-only | 3 (interceptor in 3, banner in 3) | Auth |
| S29 | `/admin/*` as non-admin | 403 Forbidden view (rendered by admin layout, not a route) | auth | 10 | App shell |

### 1.1 Decision D-UI-1 — `/dashboard` hosts overview widgets AND the posts feed

`post-composer-ui` D7 and `docs/frontend-architecture.md` put the posts list (infinite scroll + search) on `/dashboard`;
`app-shell-and-marketing` puts the overview (welcome, premium card, quick links) there too. This spec **keeps both on one page**
(no extra route, no extra nav item, matches the three existing documents):

- `/dashboard` top: overview widgets (S06). Below them: the **Posts feed** section (S08) — search, sort, infinite scroll, delete.
- There is no `/posts` index route. `/posts/[id]` (post detail, S09) is the only `/posts/*` route.
- If the page feels heavy in practice, the feed can later move to its own `/posts` route without changing any component (`PostsList` is self-contained).

### 1.2 Sidebar (`src/routes/nav.routes.ts`, single `navItems` array with `visible(user)` predicates)

| Order | Label | Href | Icon (lucide) | Visible when |
|---|---|---|---|---|
| 1 | Dashboard | `/dashboard` | `LayoutDashboard` | always |
| 2 | Create post | `/create` | `PenSquare` | always |
| 3 | Connections | `/connections` | `Link2` | always |
| 4 | Executions | `/executions` | `Workflow` | always |
| 5 | Upcoming features | `/upcoming-features` | `Sparkles` | `user.isPremium` |
| 6 | Upgrade | `/payment` | `Crown` | `!user.isPremium` |
| 7 | Profile | `/profile` | `User` | always |
| 8 | Admin | `/admin/platforms` | `Shield` | `role in (ADMIN, SUPER_ADMIN)` |

Predicates are UX only; the backend enforces every route (PRD §23).

---

## 2. Global UI rules

### 2.1 Dark tokens (source: `src/app/globals.css`; never raw hex, never `bg-black`/`text-white`)

| Purpose | Token / utility |
|---|---|
| Page | `bg-background` (#0a0a0a), text `text-foreground` |
| Card / panel | `bg-card` + `shadow-card` (stacked shadow with inset hairline) |
| Raised band / sidebar / table header | `bg-canvas-soft` |
| Popover, dropdown, toast | `bg-popover` + `shadow-float` |
| Modal / drawer | `bg-card` + `shadow-modal` |
| Secondary text | `text-muted-foreground`; tertiary `text-mute` |
| Hairlines | `border-border` (white/10); subtle `border-border-extra-light` |
| Hover / selected row | `bg-accent` / `bg-selector` |
| Input border | `border-input`; focus `ring-ring` |
| Primary CTA | `bg-primary text-primary-foreground` (white on ink) |
| Links | `text-link` |
| Semantic | `text-success`/`bg-success/15` published; `text-warning` partial/expired/confirming; `text-destructive` failed; `text-link` running; `text-muted-foreground` queued |

No sixth accent colour (design system "Don't"). Gradients (`.mesh-gradient`) only on marketing hero scale.

### 2.2 Button scale rule

- **In-app (everything inside `(dashboard)`, auth cards, modals): 6px radius** (`--radius-sm`, `rounded-sm`), heights 32/36/40
  (`size="sm"|"default"|"lg"`), label 14px/500.
- **Marketing only (`/`): pill** — `Button size="pill"` (48px) or `size="pill-sm"`. Never mix pill and 6px on one screen
  (design system "Don't"). Today `Header.tsx` uses `size="sm"` (6px) while `Hero` uses `size="pill"`, mixing scales on `/`;
  **the header buttons on the marketing layout must use `pill-sm`** (change 2 task). Inside `(dashboard)` the topbar uses 6px.
- Destructive: `variant="destructive"`. Cancel/secondary: `variant="outline"`. Tertiary: `variant="ghost"`.
- Component choice: `@/components/ui/button` (`Button`) is the canonical button. `BaseButton` is usable only after the
  re-theme pass RT-1 (section 5.4) because its intents reference undefined tokens. Submit buttons in forms always use
  `SubmitButton` from `reusable-ui-blocks/form`.
- **VERIFY/FIX (genuine bug, log in decisions.md):** `components/ui/button.tsx` and `components/ui/input.tsx` use `rounded-md`,
  and `globals.css` sets `--radius-md: 8px`, so in-app controls render 8px, not the 6px the rule requires. Change to
  `rounded-sm` (= `--radius`, 6px) in place in change 2.

### 2.3 Typography

- Font: Geist (sans), Geist Mono (mono). Weights 400/500/600 only; never >600.
- Headlines: sentence case, period-terminated on marketing, `tracking-[-0.04em]`; use the type-scale utilities
  `text-display-xl` (48) marketing hero only, `text-display-lg` (32) section/page titles on marketing, `text-display-md` (24)
  and `text-display-sm` (20) for in-app page titles and card titles.
- In-app page title: `text-display-sm` or `-md`, `tracking-[-0.03em]`; subtitle `text-sm text-muted-foreground`.
- Eyebrow/labels: `.eyebrow` (mono, uppercase, xs). Body never mono. IDs, timestamps-as-codes, JSON, OTP digits may use `font-mono`.
- Body 14px (`text-sm`) in-app; 16px on marketing and auth copy.

### 2.4 Spacing & layout

- 4px base. In-app page padding `px-4 sm:px-6`, content max width 1400px (`max-w-[1400px] mx-auto`), page vertical rhythm
  `py-6`, section gap `gap-6`, card padding `p-6` (`p-4` on dense lists), form field gap `space-y-4`.
- App shell: sidebar 240px (desktop >= 960px), topbar 64px (`--header-height`), content scrolls inside the shell.
- Auth card: `max-w-sm` (`ex-auth-form-card`: `bg-card shadow-float rounded-lg p-8`).

### 2.5 Breakpoints (design system "Responsive Strategy")

| Name | Width | Shell behaviour | Grids |
|---|---|---|---|
| Mobile | < 600px | Sidebar becomes a drawer (`overlays/drawer`) opened from the topbar menu button; tables collapse to stacked cards; tab rows scroll horizontally (`ui/HorizontalScroller`) | 1-up |
| Tablet | 600-959px | Drawer sidebar; two-column forms allowed | 2-up |
| Desktop | 960-1199px | Fixed 240px sidebar | 3-up |
| Wide | 1200-1399px | Same | 3-up |
| Ultra-wide | >= 1400px | Content centred at 1400px | 3-up |

Tailwind mapping (v4 default `sm`=640, `md`=768, `lg`=1024): use `sm:` for the 600 tablet step, `lg:` for the 960 desktop step
(accepted approximation; log once). Touch targets >= 44x44px on mobile (pad icon buttons to `size-11` below `sm`).

### 2.6 Toasts (`sonner`, mounted in `providers/index.tsx`, dark, top-right)

- Success: 4s, text from the backend `message` when it is user-readable, else the copy given per screen.
- Error: 6s; shows backend `message` verbatim for 4xx (they are written for users: "Connect LinkedIn before publishing to it"),
  and **"Something went wrong. Please try again."** for 5xx / network failures (never raw server errors, tokens, stacks — PRD §22).
- Long-running: `toast.loading` is not used; async progress lives inline on the page.
- Dedupe by `id` (e.g. `"session-expired"`, `"offline"`) so interceptors cannot stack toasts.
- Toasts are supplementary: every outcome that matters also appears inline (alert / badge) because toasts vanish.
- Required standard copy (PRD §21): "Publishing started. You can leave this page." · "Published successfully." ·
  "LinkedIn published successfully, but Facebook failed." · "Payment successful. Welcome to Premium."

### 2.7 Confirm dialogs

Use `modal/veriations/DeleteConfirmModal` (props: `open`, `title`, `message`, `confirmLabel`, `cancelLabel`, `loading`, `onConfirm`,
`onClose`) after RT-3 (dark re-theme + 6px buttons). Rules:

- Required for: delete post, disconnect platform, delete account (typed `DELETE`), block/unblock user, change role,
  grant/revoke premium, delete upcoming feature. Not required for: retry, publish (already an explicit click), logout.
- Destructive confirm button is the left/first action and uses `variant="destructive"`; default focus goes to **Cancel/Keep**.
- While `loading`, both buttons disabled; modal does not close on backdrop click; on error the modal stays open and shows the
  server `message` in an inline `role="alert"` (`DeleteConfirmModal` has no error slot today -> extend by composition: render
  the alert as `message` content, or use `GenericModalWrapper` directly for the typed-DELETE variant).
- `Esc` closes (unless loading); focus is trapped and restored to the trigger (verify the wrapper does both — UNVERIFIED in
  `GenericModalWrapper`; add if missing, log in decisions.md).

### 2.8 Skeleton vs spinner

- **Skeleton** whenever the page layout is known and data is loading for the first time (lists, cards, detail, profile). Use
  `placeholder/skeletons/BaseSkeleton` composed to mirror the final layout (no layout shift). `CardSkeletonV2List`/`ListSkeleton`
  after RT-5.
- **Spinner (button-level)** for user-initiated mutations: `SubmitButton` loading label, or `BaseButton isLoading`. Never a
  full-page spinner except `/connections/callback/[platform]` and `/payment/success` (the only "work is happening" pages).
- Refetch (background) shows no skeleton; show a subtle `Loader2` in the page header only for long polls.
- `CustomSuspense` wrapper (`layouts/wrapper/CustomSuspense`) takes `isLoading` + `fallback`; its default fallback is the text
  "loading..." — always pass a skeleton fallback.

### 2.9 Empty-state pattern

`NoResultFoundWrapper` (`data`, `title`, `message`, `icon`, `fallback`, `showTryAgain`) wraps every list. Each empty state has:
icon, a one-line statement of what is missing, one line on why/what next, and ONE primary action (or none if informational).
Example: "No posts yet" / "Write your first post and publish it to LinkedIn and Facebook." / `[Create post]`.
Distinguish **empty** (no data exists) from **no results** (filter/search active): the latter says "No results for “x”" with
`[Clear filters]`. `showTryAgain` reloads the whole window — do NOT use it; use the error pattern with a refetch instead.

### 2.10 Error-state pattern

Every async region = `CustomSuspense` -> `CustomErrorBoundary(isError)` -> `NoResultFoundWrapper` -> content.
Error UI (replace `DefaultErrorUI`'s light colours, RT-6): icon `AlertCircle text-destructive`, title (what failed, e.g.
"Couldn't load your posts"), message = backend `message` if 4xx else generic, and a **Try again** button calling
`query.refetch()`. Error classes:

| Class | Detection | Copy | Action |
|---|---|---|---|
| Unauthenticated | 401 after failed refresh | handled globally -> S28 | redirect |
| Forbidden | 403 | "You don't have access to this." (premium: UpgradeGate; admin: S29) | link home / upgrade |
| Not found | 404 | "We couldn't find that." + entity-specific text | back link |
| Rate limited | 429 | "Too many requests. Please wait a few minutes and try again." | disable submit/refetch for 60s |
| Server | 5xx / 502 (`BAD_GATEWAY` from LinkedIn/Facebook/bKash) | "Something went wrong on our side. Please try again." | Try again |
| Offline | `FetchError` with no response, `navigator.onLine === false` | "You're offline. We'll retry when you're back." | auto + Try again |

Offline: use TanStack `onlineManager`; a thin sticky banner under the topbar ("You're offline. Changes can't be saved.")
with `role="status"`; mutations are not queued (publishing must not be silently deferred) — buttons show a disabled state with
tooltip "You're offline".

### 2.11 Form pattern

- `GenericForm` (schema = zod from `src/validation/*`, `initialValues`, `onSubmit`) + self-wiring fields from
  `reusable-ui-blocks/form`: `TextField` (types text/email/password/number/…; `action`+`icon` for a password-visibility toggle),
  `TextareaField` (`autoResize`, `rows`), `CheckboxField`, `SelectField`, `SwitchField`, `RadioGroupField`, `SubmitButton`,
  `ResetButton`. `values` (not `initialValues`) for edit forms so they resync after a refetch.
- Mode: `"onSubmit"` default; `"onTouched"` for long forms (admin modals, change password).
- Server error: `onSubmit` is `async` and catches the mutation error -> `setServerError(message)`, rendered above the submit button
  as `<div role="alert" class="text-sm text-destructive">`. Field-specific server messages are mapped explicitly (e.g. 401
  "Current password is incorrect" -> `currentPassword`, 409 email exists -> `email`).
- Zod mirrors the backend **exactly** (message strings copied from the backend so the user sees identical text either way):
  email `z.email("Invalid email address")`; password min 8 `"Password must be at least 8 characters long"`; OTP
  `length(6,"OTP must be exactly 6 digits").regex(/^\d{6}$/,"OTP must contain only digits")`; name `trim().min(1,"Name is required")`;
  new password min 8 `"New password must be at least 8 characters long"`; etc. Per-form schemas are listed on each screen.
- Required fields marked by `required` prop (asterisk via `FieldLabel`); error text under the field via `FormMessage`
  (`aria-describedby` already wired); invalid field gets `aria-invalid`.
- RT-2 prerequisite: `TextField`'s `BASE_INPUT_CLASS` is a 54px pill with `#F0F0F0` border (source project look). Edit the documented
  `BASE_*_CLASS` literals (the README's sanctioned port point) to the design system's `form-input`: `h-10 rounded-sm border-input
  bg-transparent px-3 text-sm`, label `text-sm font-medium text-foreground`, required marker `text-destructive`.

### 2.12 Data fetching conventions

- `component -> hook -> api fn -> backend`. No `fetch` in components. Mutations own invalidation in the hook.
- `QueryProvider` defaults: `staleTime 60s`, `retry 1`, `refetchOnWindowFocus false`. Per-query overrides: `["session"]`
  `staleTime: Infinity`-ish (5 min) + `retry: false`; polled execution `retry: 3`, `staleTime: 0`.
- Never retry mutations. 4xx are never retried (`retry: (n, err) => status >= 500 && n < 1`).
- Multipart (post create, avatar, logo, feature image): `FormData`, no manual `Content-Type`.
- Dates: ISO strings from API -> `dayjs`/`Intl.DateTimeFormat` in the user's locale; relative ("2 min ago") for < 24h, absolute
  otherwise; full ISO in `title` attribute / `<time datetime>`.
- IDs are UUID strings; never parse as numbers.

### 2.13 Accessibility baseline

- One `<h1>` per page (the page title). Landmarks: `header`, `nav aria-label="Primary"`, `main id="main"`, skip link
  "Skip to content" as the first focusable element in both layouts.
- Visible focus ring everywhere (`focus-visible:ring-[3px] ring-ring/50` is in `ui/button`; keep for custom controls).
- Status never by colour alone: badges carry icon + text (design D3 of publish change).
- Async status text is announced: `aria-live="polite"` on execution status, upload progress, OAuth finishing; `role="alert"` on
  form/server errors.
- Modals: `role="dialog"`, `aria-modal`, labelled by title, focus trap, `Esc`. Drawers likewise.
- Respect `prefers-reduced-motion` (framer-motion `useReducedMotion`) for modal/drawer slide and the mesh-gradient fade.
- Contrast: tokens `muted-foreground` (#a1a1a1) on `background` passes AA for body text; `mute` (#888) only for non-essential hints.

---

## 3. Screens

Per-screen template: Purpose · Layout · Components · Data & API calls · Actions · States · Validation · Gating · Accessibility ·
Responsive. "Component" paths are under `src/components/` unless stated; **NEW** = feature component to be built (props in section 5.3).

---

### S01 — Marketing home `/`

**Purpose.** Sell "write once, publish to LinkedIn + Facebook"; route visitors to `/register`; tease Premium. Signed-in users may
open it and are never redirected away (config.yaml).

**Layout (Marketing layout; pill scale).**
```
+--------------------------------------------------------------+
| Header: Logo | Features  How it works  Premium | [Log in][Sign up]   (signed-in: [Dashboard] (avatar v))
+--------------------------------------------------------------+
| HERO  mesh-gradient backdrop                                  |
|   eyebrow                                                     |
|   H1 display-xl (sentence case, period)                      |
|   lead (text-lg muted)                                        |
|   [Get started (pill)] [Log in (pill outline)]                |
+--------------------------------------------------------------+
| #features   4 cards (3-up -> 2-up -> 1-up)                    |
+--------------------------------------------------------------+
| #how-it-works  4 numbered steps: connect, write, publish, track|
+--------------------------------------------------------------+
| #premium  copy + perks card + [CTA pill]                      |
+--------------------------------------------------------------+
| Footer 3 columns (Product / Account / Platforms)              |
+--------------------------------------------------------------+
```

**Components (existing).** `layout/public/Header`, `layout/public/Footer`, `modules/homepage/{Hero,Features,HowItWorks,PremiumCta}`,
`brand/Logo`, `brand/PlatformIcons`, `ui/button` (`size="pill"`), `reusable-ui-blocks/images/variations/avatar/BaseAvatar`,
`reusable-ui-blocks/dropdown/Dropdown` (avatar menu), `reusable-ui-blocks/placeholder/skeletons/BaseSkeleton` (session-loading
placeholder). **NEW:** `SessionNav` (session-aware right side of `Header`).

**Data & API.** `GET /auth/me` via `useSession()` (`["session"]`) — fired on mount of any page that mounts `Header`; 401 = guest
(no toast). No other calls. Static copy except the CTA targets. No price is shown (GAP: no endpoint exposes
`PREMIUM_PRICE`/`PREMIUM_CURRENCY`; they live in backend env only).

**Actions.**
- Hero primary: guest -> `/register`; signed-in -> `/dashboard`. Secondary: guest -> `/login`; signed-in hidden.
- Premium CTA target: guest `/register`; signed-in non-premium `/payment` ("Upgrade to Premium"); premium `/upcoming-features`
  ("See upcoming features").
- Avatar menu items: Profile (`/profile`), Log out (`POST /auth/logout`, then `queryClient.clear()`, toast "Logged out", stay on `/`).
- In-page anchors `#features`, `#how-it-works`, `#premium` smooth-scroll (`scroll-mt-16` already on sections).

**States.** Session loading: header right side shows two `BaseSkeleton` pills (no layout shift, no flash of wrong buttons). Session
error (non-401, e.g. network): treat as guest, no error UI on a marketing page. Offline banner not shown on marketing. Rate-limited: n/a.

**Validation.** none.
**Gating.** none. Admin link is not shown on marketing.
**Accessibility.** Header `nav aria-label="Primary"`; mobile menu button has `aria-expanded` and label (already present); hero image/gradient
is decorative (`aria-hidden`); anchor targets are `section` with headings; skip link first.
**Responsive.** Header collapses to logo + hamburger < 768px (existing); hero stacks; feature cards 3-up (>=960) -> 2-up (600-959) -> 1-up;
footer 3 columns -> 1. Pill scale everywhere on this page including header buttons (see 2.2).

---

### S02 — Login `/login` (+ S28 session-expired variant)

**Purpose.** Sign in with email + password (`POST /auth/login`). Honour safe `?next=`.

**Layout (Auth layout).**
```
          [Logo]
 +----------------------------+
 | Log in                     |
 | (alert: session expired /  |
 |  server error)             |
 | Email    [______________]  |
 | Password [____________ (o)]|
 | [ Log in ]                 |
 | Forgot password?           |
 +----------------------------+
 New here? Create an account
```

**Components.** `reusable-ui-blocks/form` `GenericForm`, `TextField` (email, password with visibility toggle via `action`/`icon`), `SubmitButton`;
`ui/button` (link-style via `asChild`); `brand/Logo`. **NEW:** `AuthCard` (centred card shell), `AuthAlert` (role="alert" banner with variants
info/warning/error).

**Data & API.**
- Page-level guard: `GuestOnly` wrapper in the Auth layout reads `useSession()`; while loading show a `BaseSkeleton` card; if a user
  exists -> `router.replace("/dashboard")`.
- `POST /auth/login` body `{ email, password }` (V `auth.validation.ts#login`). Success **200**, `data` = full user row
  `{ id, name, email, emailVerified, avatarUrl, avatarPublicId, role, isPremium, premiumSince, status, isDeleted, deletedAt, createdAt, updatedAt }`
  and sets cookies.
- On success: `queryClient.setQueryData(["session"], data)`; no toast (navigation is the feedback);
  `router.replace(safeNext ?? "/dashboard")`. `safeNext` = `next` only if it starts with `/`, not `//`, and not `/login`.

**Actions -> effects.**
- Submit -> mutation `useLogin`. Pending: `SubmitButton` loading label "Logging in...".
- Show/hide password toggle (icon button, `aria-label="Show password"/"Hide password"`, `aria-pressed`).
- "Forgot password?" -> `/forgot-password`. "Create an account" -> `/register`.

**States.**
| State | Trigger | Copy / behaviour |
|---|---|---|
| Loading | submit | button label "Logging in..."; inputs disabled |
| Wrong credentials | 401 `"Invalid email or password"` | form-level alert shows backend message verbatim; password cleared, email kept, focus to password |
| Blocked | 403 `"This account has been blocked"` | alert verbatim + "Contact support if you think this is a mistake." |
| Deleted | 403 `"This account has been deleted"` | alert verbatim |
| Rate-limited | 429 | alert "Too many attempts. Please try again later."; submit disabled 60s with countdown (`aria-live="polite"`) |
| Network/5xx | | alert "Couldn't reach the server. Check your connection and try again." |
| Session-expired variant (S28) | `?reason=session-expired` (set by the interceptor when token refresh fails) | warning `AuthAlert`: "Your session expired. Please log in again to continue." Also used when the backend says "Your session is no longer valid" (blocked/deleted mid-session). `next` preserves the page the user was on. |
| Already signed in | session present | silent redirect to `/dashboard` |
| OAuth-only account | backend returns the same 401 | no special case (backend anti-enumeration) |

**Validation (zod `loginSchema` mirrors `auth.validation.ts`).** `email: z.email("Invalid email address")`;
`password: z.string().min(1, "Password is required")` (NOT min 8 — login only requires non-empty). Errors on submit, then live.

**Gating.** Guest-only. **A11y.** `autoComplete="email"` / `"current-password"`; `h1` "Log in"; errors `role="alert"`; first invalid field focused on submit;
countdown announced politely. **Responsive.** Card `max-w-sm` centred; 16px gutters on narrow screens; 16px input font on mobile to avoid iOS zoom.

---

### S03 — Register + verify email `/register`

**Purpose.** Create an account. `POST /auth/register` stages the registration in Redis and emails a 6-digit OTP; `POST /auth/verify-email`
creates the user and signs them in. Two steps in ONE page/URL (step state in the component).

**Layout.**
```
STEP 1 "details"                         STEP 2 "verify"
 +----------------------------+           +-------------------------------+
 | Create your account        |           | Check your email              |
 | Name     [____________]    |           | We sent a 6-digit code to     |
 | Email    [____________]    |           | a@b.com. It expires in 5 min. |
 | Password [__________ (o)]  |   --->    | Code [ _ _ _ _ _ _ ]          |
 | hint: at least 8 chars     |           | [ Verify email ]              |
 | [ Create account ]         |           | Didn't get it? Resend (30s)   |
 +----------------------------+           | Use a different email         |
 Already have an account? Log in          +-------------------------------+
```

**Components.** `GenericForm`, `TextField`, `SubmitButton`, `ui/button`. **NEW:** `AuthCard`, `AuthAlert`, `OtpField` (6 digits,
`inputMode="numeric"`, `autoComplete="one-time-code"`, built from the `FormField`/`FormControl`/`FormMessage` escape hatches exported by
`reusable-ui-blocks/form` plus `ui/input`, because `TextField` exposes no `inputMode`/`maxLength`), `RegisterFlow` (step state).

**Data & API.**
- Step 1: `POST /auth/register` body `{ name, email, password }`. **200** `data = { email (normalized lowercase), message, otp? }`.
  Keep `data.email` as the email for step 2; ignore `otp`.
- Step 2: `POST /auth/verify-email` body `{ email, otp }`. **201** `data` = user row; cookies set.
  On success: `setQueryData(["session"], data)`; toast "Email verified. Your account is ready."; `router.replace("/dashboard")`.
- Resend: there is **no resend endpoint** -> re-call `POST /auth/register` with the held name/email/password (kept only in component
  memory; never persisted or logged). If the password is no longer in memory (page reload), "Resend" becomes "Start over".

**Actions.**
- Create account -> step 2 (no toast; the content change is the feedback; focus moves to the OTP field; heading change announced via `aria-live="polite"`).
- Verify -> signed in + redirect. Resend -> toast "A new code has been sent."; 30s client cooldown (UX only; each resend counts against the 20/15min auth limiter).
- "Use a different email" / "Start over" -> back to step 1 (clears memory).

**States.**
| State | Trigger | Copy |
|---|---|---|
| 409 on register | `"An account with this email already exists"` | field error on email + inline link "Log in instead" |
| 409 on verify | same message | alert + link to `/login` |
| Wrong code | 400 `"Invalid verification code"` | field error under OTP; keep step; clear field |
| Expired code | 400 `"Your verification code has expired. Please register again"` | alert + button "Start over" |
| Registration expired | 400 `"Your registration has expired. Please register again"` | same as expired |
| Rate-limited | 429 | "Too many attempts. Please try again later."; disable submit and resend 60s |
| Email delivery failure | 5xx on register | "We couldn't send the code. Please try again." |
| Offline/network | | generic alert |

**Validation (`registerSchema`, `verifyEmailSchema`).** `name: z.string().trim().min(1,"Name is required")`;
`email: z.email("Invalid email address")`; `password: z.string().min(8,"Password must be at least 8 characters long")`;
`otp: z.string().length(6,"OTP must be exactly 6 digits").regex(/^\d{6}$/,"OTP must contain only digits")`. Helper text under password: "At least 8 characters."
(Backend has no other password rules — do not invent any.) Auto-submit on the 6th digit is optional; if used, guard against double submit.

**Gating.** Guest-only. **A11y.** Step change announced (`aria-live`), OTP field `aria-describedby` = "expires in 5 minutes" + error; pasting 6 digits works;
autocomplete tokens `name`, `email`, `new-password`. **Responsive.** Same card; OTP input full width, large mono digits (`font-mono text-2xl tracking-[0.5em]`).

---

### S04 — Forgot password `/forgot-password`

**Purpose.** Request a reset code. `POST /auth/forgot-password` body `{ email }` always returns **200** with the same neutral message
(`"If an account exists for that email, a password reset code has been sent."`) — anti-enumeration. `data` is `null` (or `{otp}` in dev: ignore).

**Layout.** `AuthCard`: title "Forgot your password?", helper "Enter your email and we'll send a 6-digit reset code.", Email field, `[Send code]`,
link "Back to log in".

**Components.** `GenericForm`, `TextField`, `SubmitButton`, **NEW** `AuthCard`, `AuthAlert`.

**Actions.** Submit -> on 200 replace the form with the neutral message (info `AuthAlert`, `role="status"`) and a primary button `[Enter code]` that
navigates to `/reset-password?email=<url-encoded, lower-cased email>`. (auth-ui design D4 redirects directly; this spec shows the neutral text first so
the page never implies the account exists, then continues on click. No timers.)

**States.** Success (neutral) as above; 429 -> "Too many attempts. Please try again later."; 5xx -> "We couldn't process that. Please try again.";
invalid email inline. Never show different copy for known vs unknown emails. The reset screen says "Didn't get a code? Check your spam folder or request a new one."

**Validation.** `email: z.email("Invalid email address")`. **Gating.** Guest-only. **A11y.** Confirmation `role="status"`, focus moves to `[Enter code]`.
**Responsive.** as S02.

---

### S05 — Reset password `/reset-password?email=`

**Purpose.** Set a new password with the emailed code. `POST /auth/reset-password` body `{ email, otp, newPassword }` -> 200
`message: "Password reset successfully. You can now log in with your new password."`, `data: null`.

**Layout.** `AuthCard`: "Reset your password"; Email (prefilled from `?email=`, editable; empty if the param is missing); `OtpField`; New password
(visibility toggle); `[Reset password]`; links "Request a new code" -> `/forgot-password`, "Back to log in".

**Components.** `GenericForm`, `TextField`, **NEW** `OtpField`, `SubmitButton`, `AuthCard`, `AuthAlert`.

**Actions.** Submit -> toast "Password reset. Log in with your new password." -> `router.replace("/login")` (no auto-login; backend sets no cookies here).

**States.** Invalid/expired code: 400 `"Invalid or expired reset code"` -> field error on the OTP (one generic message for a bad code or unknown account) + link
"Request a new code"; 429 as before; 5xx generic. Missing `email` param: show the empty editable field (not an error).

**Validation (`resetPasswordSchema`).** `email: z.email("Invalid email address")`; `otp` as S03; `newPassword: z.string().min(8,"New password must be at least 8 characters long")`.
**Gating.** Guest-only. **A11y.** `autoComplete="one-time-code"` and `"new-password"`; errors announced. **Responsive.** as S02.

---

### S06 — Dashboard overview `/dashboard`

**Purpose.** Landing page after login: who am I, am I Premium, what is connected, quick path to Create post, how recent publishes went.
Intentionally simple (PRD §20): no complex analytics. Hosts the posts feed (S08) below the overview widgets (decision D-UI-1).

**Layout (App shell content area).**
```
+---------------------------------------------------------------+
| h1 "Welcome back, Ada."  [Crown Premium badge if premium]      |
|                                   [ Create post ] (primary)    |
+-----------------------+-----------------------+---------------+
| Stat: Published       | Stat: Partial         | Stat: Failed  |
+-----------------------+-----------------------+---------------+
| Connections (card)            | Premium (card)                 |
|  LinkedIn  Connected as X [..]|  Premium since <date>  OR      |
|  Facebook  Not connected [Connect] | "Unlock upcoming features" [Upgrade] |
+---------------------------------------------------------------+
| Recent executions (table/list, 5)               [View all ->]  |
|  title/preview | LinkedIn ok  Facebook x | status badge | when |
+---------------------------------------------------------------+
| POSTS FEED  (S08: search, sort, infinite scroll)               |
+---------------------------------------------------------------+
```

**Components.** Existing: `reusable-ui-blocks/placeholder/skeletons/BaseSkeleton`, `CustomSuspense`, `CustomErrorBoundary`,
`NoResultFoundWrapper`, `images/BaseImage`, `images/variations/avatar/BaseAvatar`, `ui/button`. **NEW:** `WelcomeHeader`, `PremiumBadge`
(crown + "Premium"; shared with sidebar/profile/topbar), `StatTile`, `ConnectionsSummaryCard`, `PremiumStatusCard`,
`RecentExecutionsCard`, `PostsList` (S08), `ExecutionStatusBadge`, `PlatformStatusChip` (shared, see 5.3).

**Data & API (all fire on mount, independent; each widget has its own state).**
| Widget | Call | Key | Notes |
|---|---|---|---|
| Welcome, Premium card | `GET /auth/me` (cached) | `["session"]` | `name`, `isPremium`, `premiumSince`, `avatarUrl` |
| Connections | `GET /platforms` + `GET /connections` | `["platforms"]`, `["connections"]` | merged by `platform.key` |
| Recent executions | `GET /executions?limit=5&sort=-createdAt` | `["executions", {limit:5}]` | row = `{id,status,startedAt,completedAt,createdAt,post:{id,title,contentPreview},platforms:[{key,name,status}]}` |
| Stats (trivial, optional) | `GET /executions?limit=1&status=COMPLETED`, `...PARTIALLY_COMPLETED`, `...FAILED` | `["executions", {limit:1,status}]` | use `meta.total` only. GAP: no stats endpoint; 3 cheap calls. If any fails the tile shows "—". |
| Posts feed | `GET /posts?page&limit=10&sort&search` | `["posts", {search, sort}]` (infinite) | see S08; `data[]`: `{id,userId,title,content,imageUrl,imagePublicId,isDeleted,createdAt,updatedAt}` |

**Actions.** `[Create post]` -> `/create`. Connection `[Connect]` -> same connect flow as S10 (calls `GET /connections/:platform/connect`, then browser redirect) — or simply link to `/connections`
(prefer the link; keeps OAuth logic in one screen). `[Upgrade]` -> `/payment`. Execution row -> `/executions/[id]`. Post card -> `/posts/[id]`. "View all" -> `/executions`.

**States (per widget).**
| Widget | Loading | Empty | Error |
|---|---|---|---|
| Stats | 3 `BaseSkeleton` tiles | value `0` | "—" + tooltip "Couldn't load" |
| Connections | 2 skeleton rows | "No platforms available yet." (platform list empty) | "Couldn't load connections." `[Try again]` |
| Recent executions | 5 skeleton rows | "No publishes yet" / "Create a post and publish it to LinkedIn or Facebook." `[Create post]` | "Couldn't load executions." `[Try again]` |
| Posts feed | see S08 | see S08 | see S08 |
First-visit hint: when connections are all not-connected, show an info callout at the top: "Connect LinkedIn or Facebook to start publishing." `[Go to connections]`.
Offline: shell-level banner (2.10). Rate-limited: widgets keep last data and show a muted "Updates paused — too many requests".

**Validation.** none. **Gating.** auth (shell guard). Premium card branches on `session.isPremium`. Admin sees no extra widgets.
**Accessibility.** One `h1`; stat tiles are `dl` pairs ("Published" / "12"); each card is a `section` with `aria-labelledby`; status badges have text.
**Responsive.** >=960: stats 3-up, connections + premium 2-up, tables full width; <960: single column; recent executions table -> stacked cards (platform chips wrap).

---

### S07 — Create post `/create`

**Purpose.** The primary screen: write content (+ optional title, + optional single image), choose target platforms, preview, then save (draft) or save & publish.
Backend facts (V): `POST /posts` is **multipart**; a post stores **no platforms** — targets are chosen at publish time (`POST /posts/:id/publish`); no per-platform text and no character limit exist server-side.

**Layout.**
```
+------------------------------------------------+-----------------------------+
| h1 Create post                                 |  Preview (approximate)       |
| Title (optional)  [______________________]     |  +-------------------------+ |
| Content *         [                       ]    |  | LinkedIn  · Ada Lovelace | |
|                   [  textarea auto-resize ]    |  |  title                   | |
|                   n characters                 |  |  content...              | |
| Image (optional)  [ +  Add image ]  [thumb x]  |  |  [image]                 | |
| Publish to        [x] LinkedIn  (Connected)    |  +-------------------------+ |
|                   [ ] Facebook  Connect first  |  | Facebook · Page name     | |
|                   [ ] ...                      |  +-------------------------+ |
| (server error alert)                           |                             |
| [ Save draft ]  [ Save & publish ]             |                             |
+------------------------------------------------+-----------------------------+
```

**Components.** Existing: `form/{GenericForm,TextField,TextareaField,SubmitButton}`, `attachment/AttachmentField` + `attachment/prepareImage` (`prepareImage(file,{maxBytes})`),
`images/BaseImage`, `images/variations/avatar/BaseAvatar`, `ui/checkbox`, `ui/button`, `placeholder/skeletons/BaseSkeleton`, `NoResultFoundWrapper`
(no-connections empty state), `ShowIf`. **NEW:** `TargetPlatforms` (checkbox list driven by `useConnections()`), `PostPreview` (per-platform frame), `ComposerForm`.

**Data & API.**
- On mount: `GET /platforms` (`["platforms"]`) and `GET /connections` (`["connections"]`) to build the target list (shared hooks `usePlatforms`, `useConnections`, `useConnectedPlatformKeys()` returning key + status).
- `POST /posts` (multipart/form-data): `content` (required), `title?`, `image?` (field name exactly `image`; 1 file; `image/*`; <= 5 MB). **201** `data` = post. 400 messages: `"Content is required"`,
  `"Only image files are allowed"`, `"File too large"` (multer, > 5 MB), `"Unexpected field"` (wrong field name — a bug if it ever appears). Handle by showing `message`.
  No idempotency key exists: a double submit creates two posts, so both buttons stay disabled for the whole request.
- On success: invalidate `["posts"]`; `setQueryData(["post", id], data)`.

**Actions -> effects.**
- **Save draft**: validate -> `POST /posts` -> toast "Post saved." -> `router.push("/posts/[id]")`.
- **Save & publish**: requires >= 1 selected target (inline error "Select at least one platform to publish to." — mirrors backend publish message) -> `POST /posts` -> `router.push("/posts/[id]?publish=linkedin,facebook")`. The post detail pre-checks those platforms in the Publish panel and **waits for the user's explicit "Publish now"** (publish design D2: no auto-publish on load, so a refresh never double-publishes). Toast "Post saved. Review and publish."
- Image pick: `AttachmentField` (`accept="image/*"`, `maxSizeKb={5120}`) with `prepareImage(file, {maxBytes: 5*1024*1024})` re-encoding oversize photos; single-image enforced by the form: `onAdd` replaces the held `File`, `onRemove` clears it. Object URL revoked on unmount/replace.
- Target checkbox: toggles composer-local state; preview frames appear/disappear live (`watch`).
- Leaving with unsaved text/image: `beforeunload` + route-change confirm ("Discard this post?").

**States.**
| State | Behaviour / copy |
|---|---|
| Connections loading | target list = 2 skeleton rows; save buttons usable for Save draft only |
| No connected platform | in place of checkboxes: "Connect LinkedIn or Facebook to publish." `[Go to connections]`; Save draft still works; Save & publish disabled |
| Platform `COMING_SOON` | row disabled, badge "Coming soon" |
| Platform not connected | row disabled "Connect first" + link to `/connections` |
| Connection `EXPIRED` | row disabled, warning "Connection expired — Reconnect" link (backend would accept it at publish but it would fail) |
| Empty content submit | field error "Content is required" (mirrors backend); no request |
| Image rejected | inline under uploader: wrong type "Only image files are allowed."; too large after compression "Image is larger than 5 MB."; undecodable "That image couldn't be read." While `onRejectedChange(true)`, disable submit (AttachmentField contract) |
| Submitting | both buttons disabled; the clicked one shows "Saving..."; upload may take seconds (Cloudinary) — keep form state |
| Server 400/5xx | form-level alert with `message`; form state preserved; image kept |
| Rate-limited 429 | alert "Too many requests. Please wait a few minutes." |
| Offline | buttons disabled + tooltip |

**Validation (`createPostSchema`, mirrors `post.validation.ts` + `lib/multer.ts`).** `title: z.string().trim().optional()` (blank -> omitted; backend normalises);
`content: z.string().trim().min(1, "Content is required")`; `image: z.instanceof(File).refine(f => f.type.startsWith("image/"), "Only image files are allowed").refine(f => f.size <= 5*1024*1024, "Image must be 5 MB or smaller").optional()`;
`platformKeys: z.array(z.string()).min(1, "Select at least one platform to publish to")` — enforced only on Save & publish (two submit handlers share the schema; the second adds the refinement). A live character count is shown with **no limit** (backend has none; do not display platform limits we don't enforce).

**Gating.** auth. **A11y.** Textarea labelled; count `aria-live="polite"` throttled (announce every 100 chars); target checkboxes grouped in `fieldset` + `legend` "Publish to"; disabled rows have `aria-describedby` reason; preview region `aria-label="Preview"`, `aria-hidden` on decorative frame chrome; image remove button labelled "Remove image".
**Responsive.** >=960 two columns (form 60%, preview 40% sticky); <960 stacked, preview collapses into an accordion "Preview" below the form; action buttons full width on mobile, sticky bottom bar.

---

### S08 — Posts list / feed (section of `/dashboard`)

**Purpose.** Find, open and delete saved posts. Rendered as the lower section of `/dashboard` (decision D-UI-1); the component is route-agnostic.

**Layout.**
```
| h2 Your posts                    [ Create post ]  |
| [ Search posts...        ]   Sort: Newest v        |
| +--------+ +--------+ +--------+                  |
| | thumb  | | thumb  | |        |   PostCard grid  |
| | title  | | title  | |        |                  |
| | excerpt| | excerpt| |        |                  |
| | date   | | date   | |        |                  |
| +--------+ +--------+ +--------+                  |
| (infinite scroll sentinel / "Loading more...")     |
```

**Components.** Existing: `pagination/infinite-scroll/provider/InfiniteScrollProvider` + `ui/InfiniteScrollRenderer` (`paginationSkeleton` prop), `placeholder/skeletons/CardSkeletons` (after RT-5),
`NoResultFoundWrapper`, `form/TextField` (`type="search"`, `action` clear) or `ui/input`, `hooks/useDebounce`, `images/BaseImage` (`fallback`), `modal/veriations/DeleteConfirmModal`,
`ui/select` (sort), `ui/button`. **NEW:** `PostCard`, `PostsList`.

**Data & API.** `GET /posts?page=N&limit=10&sort=-createdAt|createdAt|title|-title&search=term` -> `data[]` + `meta {page,limit,total,totalPages}` (V: limit default 10, max 100; sort allow-list `createdAt|title`,
`-` = desc, anything else falls back to `-createdAt`; `search` = case-insensitive contains on title/content; soft-deleted excluded). `useInfiniteQuery` key `["posts", {search, sort}]`,
`getNextPageParam = meta.page < meta.totalPages ? meta.page + 1 : undefined`. Search debounced 300ms and part of the key; sort change resets to page 1.

**Actions.** Card click -> `/posts/[id]`. Card overflow `Delete` -> `DeleteConfirmModal` ("Delete this post?" / "It will be removed from your list. Past execution history is kept.") -> `DELETE /posts/:id` -> **200** `data:null`;
on success remove from cache optimistically (`useOptimisticListMutation` can wrap this; rollback on error), invalidate `["posts"]`, remove `["post", id]`, toast "Post deleted." Delete 404 "Post not found" -> toast "That post no longer exists." and refetch.
`[Create post]` -> `/create`. "Clear search" resets.

**States.** Loading: `CardSkeletonV2List` (6). Empty (no posts at all): "No posts yet" / "Write your first post and publish it to LinkedIn and Facebook." `[Create post]`.
No results: "No results for “term”" `[Clear search]`. Error: pattern 2.10 "Couldn't load your posts" `[Try again]`. Next-page error: inline "Couldn't load more." `[Retry]` (do not blank the list). Last page: no extra UI.

**Validation.** search trimmed; max 100 chars client-side (backend has none; keep URLs sane). **Gating.** auth.
**A11y.** Grid is a `ul` of `li` cards, card = one link (`aria-label` = title or "Untitled post"); overflow menu is a labelled button; infinite loading announced `aria-live="polite"` ("Loaded 10 more posts"); sentinel not focusable.
**Responsive.** 3-up >=960, 2-up 600-959, 1-up <600; thumbnails 16:9, `object-cover`; title clamps 1 line, excerpt 3 lines (`line-clamp`), content excerpt is plain text from `content` (140 chars).

---

### S09 — Post detail + Publish `/posts/[id]`

**Purpose.** View one post in full, delete it, and **publish it** (PRD §10). The Publish panel is built in change 7; this screen is built in change 6 with a reserved slot.

**Layout.**
```
| < Back to dashboard                                         |
| h1 title (or "Untitled post")        [Delete]               |
| created Mar 3, 2026 · 10:32                                 |
+---------------------------+---------------------------------+
| content (pre-wrap, plain) | PUBLISH PANEL (card)            |
| [image 16:9]              |  Publish to                     |
|                           |  [x] LinkedIn (Ada L.)          |
|                           |  [ ] Facebook (Page name)       |
|                           |  [ Publish now ]                |
|                           |  "Publishing runs in the        |
|                           |   background. You can leave."   |
+---------------------------+---------------------------------+
```

**Components.** Existing: `images/BaseImage`, `modal/veriations/DeleteConfirmModal`, `NoResultFoundWrapper`, `CustomSuspense`, `CustomErrorBoundary`, `ui/checkbox`, `ui/button`, `BaseSkeleton`.
**NEW:** `PostDetailView`, `PublishPanel` (change 7; reuses `TargetPlatforms` from S07).

**Data & API.**
- `GET /posts/:id` (`["post", id]`) -> post. 404 `"Post not found"` for missing / other user's / soft-deleted.
- Publish panel: `useConnections()`/`usePlatforms()` as in S07; initial checked set = `?publish=a,b` ∩ connected+CONNECTED keys (unknown keys ignored).
- `POST /posts/:id/publish` body `{ platforms: string[] }` (min 1; backend dedupes) -> **202** `data = { executionId, status: "PENDING" }`.
- `DELETE /posts/:id` as in S08.

**Actions -> effects.**
- **Publish now**: disabled until >=1 platform checked and while pending (double-click guard). On 202: toast "Publishing started. You can leave this page." -> clear `?publish` -> `router.push("/executions/<executionId>")`; invalidate `["executions"]`.
- Delete -> modal -> `DELETE` -> toast "Post deleted." -> `router.replace("/dashboard")`.
- Back link uses router back when history exists (preserves feed scroll), else `/dashboard`.

**States.**
| State | Copy / behaviour |
|---|---|
| Loading | skeleton: title bar, 4 paragraph lines (`ParagraphSkeleton`), image block, panel card |
| 404 | "Post not found" / "It may have been deleted." `[Back to dashboard]` (not Next global 404) |
| Publish 400 not connected | inline alert in panel: "Connect LinkedIn before publishing to it." + link `/connections` (backend: `Connect {Name} before publishing to it`) |
| Publish 400 not LIVE | "{Name} is not available to publish to yet" (verbatim) |
| Publish 404 unknown platform | "Unknown platform: key" -> refetch `["platforms"]` |
| Publish 400 empty content | "This post has no content to publish" (verbatim; cannot normally happen) |
| No connected platforms | panel shows "Connect a platform to publish." `[Go to connections]`; button disabled |
| Expired connection | row disabled + "Reconnect" link |
| Rate-limited / 5xx / offline | alert + button re-enabled; offline disables button |

**Validation.** `platforms.min(1)` -> "Select at least one platform to publish to". **Gating.** auth; owner-scoped by backend.
**A11y.** Status of publish click announced via toast + `aria-live` region in the panel; delete modal returns focus to Delete button; image `alt` = title or "Post image".
**Responsive.** >=960 two columns; <960 panel moves above content as a sticky card; image full width.

---

### S10 — Connections `/connections`

**Purpose.** Connect/disconnect LinkedIn and Facebook Page; show status. Platform catalogue (`GET /platforms`, active only, sorted) merged with the user's connections.

**Layout.**
```
| h1 Connections                                              |
| (error banner from ?error=)                                 |
| +----------------------------+ +--------------------------+ |
| | [logo] LinkedIn            | | [logo] Facebook Page     | |
| | Connected ✓ as Ada Lovelace| | Not connected            | |
| | since Mar 3 · expires Jun 1| |                          | |
| | [Disconnect]               | | [Connect]                | |
| +----------------------------+ +--------------------------+ |
| +----------------------------+  (COMING_SOON card: dimmed,  |
| | [logo] Instagram  Coming soon|  no button)                |
```

**Components.** Existing: `images/BaseImage` (platform `logoUrl` with fallback to `brand/PlatformIcons`), `modal/veriations/DeleteConfirmModal` (disconnect), `GenericModalWrapper` + `form/RadioGroupField` (page picker),
`placeholder/skeletons/CardSkeletons`, `NoResultFoundWrapper`, `ui/button`, `CustomSuspense`, `CustomErrorBoundary`. **NEW:** `PlatformCard`, `ConnectionStatusBadge`, `FacebookPagePicker`, `OAuthErrorBanner`.

**Data & API.**
- `GET /platforms` -> `[{id,key,name,logoUrl,logoPublicId,status LIVE|COMING_SOON,isActive,sortOrder,createdAt,updatedAt}]` (V: full row; UI ignores `logoPublicId`).
- `GET /connections` -> `[{id, platform:{key,name}, platformAccountName, status CONNECTED|EXPIRED, expiresAt, createdAt}]` (V; tokens never returned).
- Connect: `GET /connections/:platform/connect` -> `{ authUrl }` then `window.location.assign(authUrl)`. Errors: 404 "Platform not found"; 400 "This platform is not available to connect yet"; 501 "No integration is wired for this platform yet"; 5xx generic.
- Disconnect: `DELETE /connections/:platform` -> `data: null`; 404 "You are not connected to this platform".
- Facebook page picker (opened when `?select=facebook`): `GET /connections/facebook/pages` (`["fb-pages"]`) -> `[{id,name}]`; `POST /connections/facebook/select-page` body `{ pageId }` -> connection;
  400 "No Facebook Page selection in progress. Start connecting Facebook first."; 400 "That Page is not among your available Pages". Pages are kept server-side for 10 minutes (Redis TTL), so reload keeps working.

**Card state machine (derived by `platform.key`).**
| Platform.status | Connection | Card |
|---|---|---|
| COMING_SOON | any | dimmed, badge "Coming soon", no action |
| LIVE | none | "Not connected", `[Connect]` |
| LIVE | CONNECTED | "Connected" + account name, `[Disconnect]` |
| LIVE | EXPIRED | warning "Connection expired", `[Reconnect]` (same connect flow; backend upserts) + `[Disconnect]` |

**Actions -> effects.**
- Connect/Reconnect: button shows "Redirecting..." (disabled); full-page redirect to the provider. Failure -> toast with backend message; button re-enabled.
- Disconnect -> `DeleteConfirmModal` title "Disconnect LinkedIn?" message "You won't be able to publish to LinkedIn until you reconnect. Existing posts and history are kept." confirm "Disconnect"
  -> on success invalidate `["connections"]`, toast "LinkedIn disconnected."; pending posts already queued may fail (do not claim otherwise).
- Page picker: radio list of Pages + `[Connect this Page]` (disabled until chosen) -> select-page -> invalidate `["connections"]`, close, strip `?select`, toast "Facebook Page connected: <name>."
  Cancel closes the modal and leaves Facebook "Not connected" (stash still exists until TTL; reopen via the card showing "Finish connecting" when `GET /connections/facebook/pages` returns Pages — optional enhancement; v1: user clicks Connect again).
- `?error=` banner: fixed copy by code (`cancelled`: "Connection cancelled."; `invalid-state`: "That connection attempt expired. Please try again."; `failed`: "We couldn't complete the connection. Please try again."), dismissible, removed from URL on dismiss. **DEVIATION (minor) from platforms design D1** which puts the raw server message in `?error=`: arbitrary text in a URL is spoofable; the callback page shows the server message in a toast and redirects with a code.

**States.** Loading: 2 card skeletons. Empty platform list: "No platforms available yet." Error (either query): 2.10 pattern. Picker: loading skeleton rows; expired -> "Selection expired. Connect Facebook again." `[Connect Facebook]`; one Page only -> backend auto-connects (never reaches the picker); **zero Pages** (`kind: "select-page"` with an empty list is possible per api-contract 6.3) -> "No Facebook Pages found. You need to be an admin of a Facebook Page to connect." `[Try again]`.
Quirk (api-contract 6.5): a Facebook Page token has no `expiresAt`, so the card stays "Connected" even if Facebook later invalidates it; the failure only appears at publish time as a FAILED publication whose reason says to reconnect (S13 shows `[Reconnect Facebook]`).
Provider token expiry display: `expiresAt` shown "Expires <date>"; never show tokens.

**Validation.** `selectPageSchema = { pageId: z.string().trim().min(1, "pageId is required") }` (picker prevents empty). **Gating.** auth. All platforms/connections owner-scoped by backend.
**A11y.** Each card is a `section` with `aria-labelledby` (platform name); status badges text+icon; picker is a `radiogroup` with legend "Choose a Facebook Page"; arrow-key navigation; "Redirecting..." announced via `aria-live`.
**Responsive.** 2-up >=600, 1-up below; buttons full width on mobile.

---

### S11 — OAuth return `/connections/callback/[platform]`

**Purpose.** The provider's redirect URI points at this **frontend** route (platforms design D1) because the backend callback returns JSON and does not redirect (V `connection.controller.ts#callback`).
Requires backend env change: `LINKEDIN_REDIRECT_URI` / `FACEBOOK_REDIRECT_URI` = `<FRONTEND_URL>/connections/callback/<platform>` and the same URI registered in each provider console (config dependency, no code change) — today's `.env.example` points at the backend.

**Layout.** Centred minimal state inside the shell (or bare): spinner + "Finishing connection..." (`role="status"`), no other controls.

**Components.** `Loader2` (lucide), `ui/button` (error state), **NEW** `OAuthCallbackHandler`.

**Data & API.** On mount, **exactly once** (ref guard; never in a `useQuery` — `code`/`state` are single-use and strict mode/refetch would double-call):
1. Read `code`, `state`, `error` from the query string; validate `platform` against `/^[a-z0-9-]+$/`.
2. If `error` present (user denied / provider error) -> **no API call**, `router.replace("/connections?error=cancelled")`.
3. Else `GET /connections/:platform/callback?code=<code>&state=<state>` (unauthenticated endpoint; state resolves the user, 10-minute TTL) -> `data`:
   - `{ kind: "connected", connection }` -> invalidate `["connections"]`, toast "{Platform} connected.", `router.replace("/connections")`.
   - `{ kind: "select-page", pages: [{id,name}] }` -> seed `["fb-pages"]`, `router.replace("/connections?select=facebook")`.
   - 400 `"Invalid or expired OAuth state"` / `"Missing authorization code"` -> toast server message, `router.replace("/connections?error=invalid-state")`.
   - 502 `"Failed to exchange ... authorization code"` etc. -> `...?error=failed`. 501/404 -> `failed`.

**States.** Working (spinner), success/failure redirect immediately; missing `code` and `state` (direct visit) -> `router.replace("/connections")` with no message; session missing (guest) -> shell guard sends to `/login?next=...`
(the `next` keeps `code`/`state`; after login the one-time call still works if within 10 min — acceptable).
**Validation.** none. **Gating.** auth shell, but the API call itself needs no cookie. **A11y.** `aria-live="polite"` "Finishing connection"; no focus trap. **Responsive.** n/a.

---

### S12 — Executions list `/executions`

**Purpose.** History of every publish run with per-platform outcome (PRD §14). Page-based pagination (filters + totals matter), filters stored in the URL.

**Layout.**
```
| h1 Executions                                              |
| [All][Completed][Partial][Failed][Running]   Date: [range v][Clear] |
| +------------------------------------------------------------+
| | Content            | LinkedIn | Facebook | Status  | Started   |
| | "Product launch…"  |  ✓       |  ✓       | Published| 2h ago   |
| | "New announcement" |  ✓       |  ✕       | Partial | Yesterday |
| +------------------------------------------------------------+
| Showing 1–10 of 42                      < 1 2 3 4 5 >        |
```

**Components.** Existing: `common-modules/scrollable-tabs-header/ScrollableTabsHeader` + `tabs/{TabsProvider,TabItem}` (status tabs; mobile scroll), `dates/date-filter/DateRangePresetFilter` (+ `DateFilterButton`),
`pagination/{Pagination, provider/PaginationContext}` (needs an adapter, RT-7), `placeholder/skeletons/BaseSkeleton`, `NoResultFoundWrapper`, `CustomSuspense`, `CustomErrorBoundary`.
Table markup via `bunx shadcn@latest add table` (shadcn, not a custom primitive). **NEW:** `ExecutionsTable`, `ExecutionStatusBadge`, `PlatformStatusChip`, `ExecutionFilters`.

**Data & API.** `GET /executions?page&limit=10&sort=-createdAt&status=<ExecutionStatus>&dateFrom=<ISO>&dateTo=<ISO>` (V). `status` is one of `PENDING|RUNNING|COMPLETED|PARTIALLY_COMPLETED|FAILED`
(unknown values are silently ignored by the backend, so the UI must only send valid ones). `sort` allow-list `createdAt|startedAt|completedAt`, `-` = desc. Dates filter on `createdAt`; invalid dates ignored.
Convert the date filter's output to ISO (`dayjs.utc(...).toISOString()`) in the api layer, with `dateTo` = end of the chosen day (`DateRangePresetFilter` emits "YYYY-MM-DD HH:mm" strings — passing those raw is ambiguous: UNVERIFIED how Node parses them). Key `["executions", {page,limit,status,dateFrom,dateTo,sort}]`.
Row: `{ id, status, startedAt, completedAt, createdAt, post:{id,title,contentPreview(140)}, platforms:[{key,name,status}] }`. URL params: `?page=&status=&dateFrom=&dateTo=` (shareable, survives refresh); changing a filter resets `page` to 1.
Tabs map (the backend accepts a single `status` value, so each tab sends exactly one): All (no param) · Queued (`PENDING`) · Running (`RUNNING`) · Completed (`COMPLETED`) · Partial (`PARTIALLY_COMPLETED`) · Failed (`FAILED`).

**Actions.** Row click (whole row is a link) -> `/executions/[id]`. Tab/date change -> URL update (replace). Pagination -> `page`. Row title shows `post.title ?? contentPreview`. `[Create post]` in the empty state.

**States.** Loading: 5 row skeletons (cards on mobile). Empty (no executions at all): "No publishes yet" / "When you publish a post, every run and its result shows up here." `[Create post]`.
No results (filter active): "No executions match these filters." `[Clear filters]`. Error: pattern 2.10 "Couldn't load executions". Rate-limited: keep rows, banner "Too many requests. Retrying shortly." Active runs (PENDING/RUNNING) in the visible page cause a **single list refetch every 10s** (not 3s; detail page owns fast polling) so badges move; paused when tab hidden.

**Validation.** URL params sanitised: `page` integer >=1, `status` in enum else dropped, dates parseable else dropped. **Gating.** auth; owner-scoped by backend.
**A11y.** Table with `<caption class="sr-only">Executions</caption>`, `scope="col"`, row link covers the row (`aria-label` "Open execution: title, status"); tabs use roving tabindex (`role="tablist"`); filter changes announce "Showing N executions" via `aria-live="polite"`; platform chips have text ("LinkedIn: Published").
**Responsive.** >=960 table; <960 stacked cards (title, chips, badge, time); tabs scroll horizontally (`HorizontalScroller`); date filter becomes a full-width button opening the calendar popover.

---

### S13 — Execution detail `/executions/[id]` (workflow, results, retry)

**Purpose.** Watch a publish run live, see the read-only workflow, per-platform result and reason, and retry only what failed (PRD §10–§13, §26). This is where "Publishing started" lands.

**Layout.**
```
| < Executions                                                      |
| h1 Execution a1b2c3d4  [ Partial ]            [ Retry 1 failed ]  |
| Started 10:32 · Completed 10:33 · took 41s   Post: "Product…" ->  |
+-------------------------------------------------------------------+
| WORKFLOW (read-only, React Flow)                                  |
|  (START) -> (PREPARE CONTENT) -> (LINKEDIN ✓) -> (FACEBOOK ✕) -> (END) |
+-------------------------------------------------------------------+
| RESULTS                                                           |
|  LinkedIn · Ada Lovelace   ✓ Published  10:32  [View on LinkedIn] |
|  Facebook · My Page        ✕ Failed     Reason: Facebook rejected  |
|     the post — the Page token may be expired; reconnect Facebook…  |
|     Retried 1 time        [Reconnect Facebook]  [Retry Facebook]  |
+-------------------------------------------------------------------+
| CONTENT  post content (pre-wrap) + image                           |
```

**Components.** Existing: `images/BaseImage`, `placeholder/skeletons/BaseSkeleton`, `ParagraphSkeleton`, `CustomSuspense`, `CustomErrorBoundary`, `NoResultFoundWrapper`, `ui/button`, `ui/tooltip`, `hooks/useOptimisticListMutation` (retry; see note).
**NEW:** `ExecutionHeader`, `WorkflowGraph` (React Flow), `PublicationRow`, `ExecutionStatusBadge`, `PublicationStatusBadge`, `RetryButton`, `ExecutionPoller` (completion-toast effect).
**GAP in the plan / dependency flag.** PRD §11/§26 and acceptance criteria require React Flow; **no OpenSpec change schedules it and it is not in `package.json`**. Add to change 7: task "Add `@xyflow/react`, log in `docs/decisions.md`, build `WorkflowGraph`" (library, not a from-scratch primitive).
Fallback if the dependency is rejected: `WorkflowStepper` (CSS flex + connector lines) with identical node states.

**Data & API.**
- `GET /executions/:id` (`["execution", id]`) -> `{ id, status, startedAt, completedAt, createdAt, post:{id,title,content,imageUrl,isDeleted}, publications:[{ id, platform:{key,name}, platformAccountName, status, externalPostId, externalPostUrl, publishedAt, failureReason, retryable, retryCount }] }` (V).
  `failureReason` is the latest attempt's sanitised message and only when `status === FAILED`; `retryable === (status === FAILED)`; `retryCount = attempts - 1`. The API exposes **only the latest attempt**; there is no attempt timeline.
- **Polling** (`refetchInterval`): while execution status is `PENDING` or `RUNNING` -> 3000 ms; after 60 s of polling -> 5000 ms; stop on terminal status (`COMPLETED|PARTIALLY_COMPLETED|FAILED`); `refetchIntervalInBackground: false` (paused when the tab is hidden; one immediate refetch on visibility return).
  Budget check (global limiter 300 req/15 min/IP): 3 s x 60 s = 20 calls, then 5 s = <= 180 calls per 15 min; other screens are not polled at that rate. After 5 min of continuous activity show "Taking longer than expected" + `[Refresh]` (worker may be down); keep polling at 10 s.
- `POST /publications/:id/retry` (no body) -> **202** `data { executionId, publicationId }`.
- `POST /executions/:id/retry` (no body) -> **202** `data { executionId, retried }` (retries every FAILED publication).

**Workflow graph (read-only).** Nodes: START -> PREPARE CONTENT -> one node per publication in `createdAt` order (LinkedIn then Facebook, only those selected) -> END, drawn as a linear chain (PRD §11.1).
Node status derivation (V/UNVERIFIED: the API has no per-step state for START/PREPARE/END, so those are derived):
| Node | pending | running | done | failed |
|---|---|---|---|---|
| START | — | — | always done | — |
| PREPARE CONTENT | execution `PENDING` | execution `RUNNING` and no publication has progressed | execution not `PENDING` | — |
| Platform node | publication `PENDING` | publication `RUNNING` (animated) | `SUCCESS` (green check) | `FAILED` (red cross) |
| END | until execution terminal | — | `COMPLETED` (green) / `PARTIALLY_COMPLETED` (amber) | `FAILED` (red) |
Configuration: `nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} panOnDrag={false} zoomOnScroll={false} preventScrolling={false} fitView`, hide controls/attribution only if the licence permits (UNVERIFIED — check `@xyflow/react` licence terms before removing attribution). Node colours from tokens (`border-success`, `border-destructive`, `border-link`, `border-border`).
The graph is `aria-hidden="true"`; the **Results list is the accessible equivalent**. Mobile (<600): vertical layout.

**Actions -> effects.**
- **Retry {Platform}** (shown only when `publication.retryable`): `POST /publications/:id/retry` -> optimistic: set that publication `status: "PENDING"`, clear `failureReason`, execution `status: "RUNNING"`; on 202 toast "Retrying {Platform}..."; invalidate `["execution", id]` and `["executions"]`; polling resumes automatically (status active). On error roll back the optimistic change.
  (`useOptimisticListMutation` is list-oriented and expects the copied `ActionResult` shape — use a plain `useMutation` with `onMutate`/`onError` here; do not bend the block.)
- **Retry N failed** (header, shown when >= 1 retryable): `POST /executions/:id/retry`; same optimistic update for all failed rows; toast "Retrying N failed platform(s)...". The header button is shown only when N >= 2; with exactly one failed row only that row's button is shown.
- **Completion toast (exactly once per transition)**: an effect compares previous vs next execution status held in a `useRef`; on entering a terminal state: `COMPLETED` -> "Published successfully."; `PARTIALLY_COMPLETED` -> "{OK names} published successfully, but {failed names} failed." (e.g. "LinkedIn published successfully, but Facebook failed."); `FAILED` -> "Publishing failed. You can retry." No toast on first load of an already-terminal execution.
- External link `[View on LinkedIn]` opens `externalPostUrl` in a new tab (`target="_blank" rel="noopener noreferrer"`, only if the URL parses as `https:`).
- `[Reconnect {Platform}]` link to `/connections` shown when `failureReason` matches `/reconnect/i` (backend wording: "...reconnect Facebook and retry" — UNVERIFIED as a stable contract; harmless if it never matches).
- Post link -> `/posts/[post.id]` unless `post.isDeleted` (then the note "This post was deleted. Its history is kept." and content stays readable, design D6).

**States.**
| State | Copy / behaviour |
|---|---|
| Loading | skeleton header + graph block + 2 result rows |
| 404 | "Execution not found" / "It may not exist or may belong to another account." `[Back to executions]` |
| Pending | badge "Queued"; "Publishing started. You can leave this page — we'll keep going." (`aria-live="polite"`) |
| Running | badge "Publishing" (animated); per-row spinner "Publishing to LinkedIn…" |
| Completed | badge "Published"; rows with links |
| Partial | badge "Partial"; banner "Some platforms failed. You can retry them." |
| Failed | badge "Failed"; banner "Publishing failed. You can retry." |
| Retry 400 `"Only a failed publication can be retried"` | toast "That item is no longer failed." + refetch |
| Retry 400 `"Connect {Name} before retrying"` | inline alert on the row + `[Go to connections]` |
| Retry 400 `"This execution has no failed publications to retry"` | refetch, hide button |
| Retry 404 | "Publication not found" toast + refetch |
| Poll error (transient) | keep last data; small status "Reconnecting…" (`role="status"`); after 3 consecutive failures show alert + `[Try again]`; stop polling until success |
| Taking too long | after 5 min: "Taking longer than expected." + `[Refresh]` |
| Offline | banner; polling pauses (onlineManager) |

**Validation.** none (no user input). **Gating.** auth; owner-scoped by backend (foreign id -> 404).
**Accessibility.** Status text in an `aria-live="polite"` region (updated copy, not repeated on every poll — only on change); per-row badge = icon + text; Retry buttons labelled "Retry Facebook"; focus is not stolen on poll updates; graph `aria-hidden` with equivalent list.
**Responsive.** >=960 graph horizontal full width; <960 graph vertical compact or hidden behind "Show workflow" disclosure; result rows stack, buttons full width.

---

### S14 — Profile `/profile`

**Purpose.** Manage identity (name, avatar), see account info and Premium status, change password, log out, delete account (PRD §20). Each section is its own card/form/mutation so one failure never blocks another.

**Layout.**
```
| h1 Profile                                                  |
| +- Identity ---------------------------------------------+ |
| | (avatar 96)  [Change photo] [Remove]                    | |
| | Name [____________] [Save]                              | |
| +- Account ----------------------------------------------+ |
| | Email a@b.com (read-only)   Role USER   Member since …  | |
| | Sign-in methods: [Email & password] [Google]            | |
| | Premium: [Crown Premium] since Mar 3  | or [Upgrade]    | |
| |   View payment history ->                               | |
| +- Security (CREDENTIALS only) --------------------------+ |
| | Current [____] New [____] Confirm [____] [Update]       | |
| +- Session ----------------------------------------------+ |
| | [ Log out ]                                             | |
| +- Danger zone ------------------------------------------+ |
| | Delete account … [ Delete account ] (destructive)       | |
| +---------------------------------------------------------+ |
```

**Components.** Existing: `form/{GenericForm,TextField,SubmitButton}`, `images/variations/avatar/BaseAvatar` (initials fallback, `size="xl"`), `modal/veriations/DeleteConfirmModal`, `modal/GenericModalWrapper`, `ui/button`, `ui/input`, `BaseSkeleton`, `CustomSuspense`, `CustomErrorBoundary`.
**NEW:** `ProfileIdentityCard`, `AvatarUploader` (file input + client checks, wraps `BaseAvatar`), `AccountInfoCard`, `PremiumBadge`, `ChangePasswordCard`, `DangerZoneCard`, `TypedConfirmDialog` (built on `GenericModalWrapper`: message + `Input` that must equal `DELETE`; `DeleteConfirmModal` has no input slot).

**Data & API (V `user.route.ts`, `user.service.ts#toProfile`).**
- `GET /users/me` (`["profile"]`) -> `{ id,name,email,emailVerified,avatarUrl,avatarPublicId,role,isPremium,premiumSince,status,isDeleted,deletedAt,createdAt,updatedAt, providers: ("CREDENTIALS"|"GOOGLE")[] }`. (Richer than `/auth/me` because of `providers`.)
- `PATCH /users/me` body `{ name }` -> profile. Only `name` is accepted; `email` is silently dropped by zod, so the UI never sends it.
- `PATCH /users/me/avatar` multipart field `avatar` (image/*, <= 5 MB) -> profile. `DELETE /users/me/avatar` -> profile.
- `PATCH /users/me/password` body `{ currentPassword, newPassword }` -> 200 (response body not used).
- `DELETE /users/me` -> 200; backend soft-deletes and clears auth cookies. 
- `POST /auth/logout` -> 200 `data:null` (idempotent; works even with an expired session).
- After every successful profile mutation: `setQueryData(["profile"], data)` **and** `setQueryData(["session"], d => ({...d, name: data.name, avatarUrl: data.avatarUrl}))` (or invalidate `["session"]`) so navbar/sidebar update instantly.

**Actions -> effects.**
- Save name: toast "Profile updated." (button disabled until dirty).
- Change photo: client pre-check (`file.type.startsWith("image/")`, `size <= 5 MB`) -> optimistic local preview with spinner overlay -> upload -> toast "Photo updated."; failure reverts preview, inline error under avatar. Remove photo -> `DeleteConfirmModal`? (low-risk; direct action with toast "Photo removed." and Undo not available) -> initials fallback.
- Update password: success -> reset form, toast "Password updated." (session stays valid; backend does not revoke tokens). A password-changed email is sent by the backend (mention: "We'll email you a confirmation.").
- Log out: `POST /auth/logout` -> `queryClient.clear()` -> `router.replace("/")` -> toast "Logged out." (no confirm).
- Delete account: opens `TypedConfirmDialog` (title "Delete your account?", body "Your account will be deactivated and you'll be logged out. Your email stays reserved. This can't be undone from the app.", input "Type DELETE to confirm", confirm disabled until exact match) -> `DELETE /users/me` -> `queryClient.clear()` -> toast "Account deleted." -> `router.replace("/")`.

**States.**
| State | Copy / behaviour |
|---|---|
| Loading | skeleton cards (avatar circle + 2 lines per card) |
| Error loading | 2.10 pattern "Couldn't load your profile" `[Try again]` |
| Wrong current password | 401 `"Current password is incorrect"` -> field error on `currentPassword` (NOT a global logout; see interceptor rule in 4.1) |
| No password set | providers lacks `CREDENTIALS` -> the Security card is replaced by: "You signed in with Google. To set a password, use Forgot password." `[Forgot password]` (backend 400 "This account has no password set. Use forgot-password to set one first." never reached) |
| Avatar not an image / > 5 MB | inline "Please choose an image." / "Image must be 5 MB or smaller." (backend: "Only image files are allowed") |
| Upload failure 5xx | "Couldn't upload your photo. Please try again." |
| Delete failure | alert inside the dialog with `message`; dialog stays open |
| Rate-limited / offline | as 2.10; forms disabled offline |

**Validation (`src/validation/user.ts`, mirrors `user.validation.ts`).** `updateProfileSchema = { name: z.string().trim().min(1,"Name is required") }`;
`changePasswordSchema = { currentPassword: z.string().min(1,"Current password is required"), newPassword: z.string().min(8,"New password must be at least 8 characters long"), confirmPassword }` with `.refine(newPassword === confirmPassword, "Passwords do not match")` and `.refine(newPassword !== currentPassword, "New password must be different")` (client-only rules; confirm is not sent). Confirm field name `confirmPassword` is never posted.
**Gating.** auth. Premium card branches on `profile.isPremium` (display only). **A11y.** Each card `section` + `h2`; avatar uploader is a `<button>` that opens a hidden `input type="file" accept="image/*"` (label "Change profile photo"); upload progress `aria-live="polite"`; typed-confirm input labelled; destructive button described by its consequence (`aria-describedby`).
**Responsive.** Cards single column max 720px; forms stack; avatar and buttons stack on mobile; danger zone buttons full width.

---

### S15 — Upgrade to Premium `/payment`

**Purpose.** Start the bKash payment (`POST /payments/create`) and redirect to the gateway. Premium is granted only by the backend after server-side verification.

**Layout.**
```
| h1 Go Premium                                              |
| +--------------------------------------+                   |
| | [Crown] Premium                       |                   |
| |  ✓ Early access to upcoming features  |                   |
| |  ✓ Premium badge on your profile      |                   |
| |  ✓ Priority on the roadmap            |                   |
| |  One-time payment with bKash.         |                   |
| |  [ Upgrade to Premium ]               |                   |
| +--------------------------------------+                   |
| Payment history ->                                          |
```
Already premium: card shows "You're Premium" + "Premium since <date>" + `[See upcoming features]`; **no Upgrade button**.

**Components.** Existing: `ui/button`, `BaseSkeleton`, `CustomSuspense`. **NEW:** `PremiumBenefitsCard`, `UpgradeButton`, `PremiumBadge`. (Perk list reuses the copy of `modules/homepage/PremiumCta`.)

**Data & API.** `useSession()`/`useProfile()` for `isPremium`, `premiumSince`. `POST /payments/create` (no body) -> **201** `data { paymentId, redirectUrl }` (V). Provider = bKash sandbox, purpose `PREMIUM_UPGRADE`.
**GAP:** amount/currency are backend env (`PREMIUM_PRICE`, `PREMIUM_CURRENCY`) and are **not returned** by `create` nor exposed by any endpoint, so this page cannot truthfully display a price. Copy uses "You'll see the amount on bKash before you confirm." Amount appears in history/detail after the payment exists. Recommend (backend follow-up, not assumed) adding `amount`/`currency` to the create response or a config endpoint — until then do not hard-code a price (plan non-goal).

**Actions -> effects.**
- `[Upgrade to Premium]`: disabled on click (pending + after success until navigation; guards double-click which would create a 2nd PENDING row); on 201 store `sessionStorage["ca.pendingPaymentId"] = paymentId` (try/catch guarded) then `window.location.assign(redirectUrl)`. Button text "Redirecting to bKash...".
- Failure -> alert "We couldn't start the payment. Please try again." (backend 502 "Could not start the bKash payment" / "Could not authenticate with bKash" shown verbatim when present) + `[Try again]`.

**States.** Loading session: skeleton card. Already premium (above). 429/5xx/offline per 2.10. If `redirectUrl` is not an `https:` URL (defensive) -> treat as failure.
**Validation.** none. **Gating.** auth; CTA hidden when `isPremium`. **A11y.** CTA has `aria-busy` when pending; redirect state announced "Redirecting to bKash". **Responsive.** Single centred card (`max-w-md`), full-width CTA on mobile.

---

### S16 — Payment return: success `/payment/success`

**Purpose.** Landing after bKash -> backend `GET /payments/callback` -> **302 to `{FRONTEND_BASE_URL}/payment/success` with NO query params** (V `payment.controller.ts#callback`). The URL proves nothing (anyone can type it), so the page asks the backend what actually happened.

**Layout.** Centred card, state-driven:
```
 CONFIRMING:  (spinner) Confirming your payment...
 SUCCESS:     (crown) Payment successful. Welcome to Premium.   [Explore upcoming features] [View receipt]
 PENDING:     Still processing... (retrying)  -> [Check again]
 FAILED/CANCELLED: -> see S17 copy, [Try again] [View history]
 UNKNOWN:     We couldn't find a recent payment.  [Go to Premium page]
```

**Components.** `ui/button`, `lucide-react` icons, `BaseSkeleton`. **NEW:** `PaymentResultCard`, `PaymentStatusBadge`, `PremiumBadge`.

**Data & API (order matters).**
1. Resolve `paymentId`: `sessionStorage["ca.pendingPaymentId"]`; fallback `GET /payments?limit=1&page=1` (newest) **only if** `createdAt` is within the last 30 minutes (otherwise UNKNOWN — avoids showing an old success for a hand-typed URL).
2. **Read first:** `GET /payments/:id` (read-only, owner-scoped; 404 `"Payment not found"`) -> public payment `{ id, provider, purpose, amount, currency, status, merchantInvoiceNumber, providerTransactionId, paidAt, createdAt }`. `SUCCESS` -> done (the backend callback already settled it before redirecting here).
3. Only if the read returns `PENDING`: call the safety net `POST /payments/verify` body `{ paymentId }` (idempotent; asks bKash to execute/confirm). **Quirk (api-contract 9.3):** verify on a payment the user has not actually finished at bKash can flip it to `FAILED`, so it is only ever called from a page the user reached via the gateway redirect, never from history/detail pages. `PENDING` after verify -> up to **2 automatic re-reads, 2 s apart**, then "Still processing" + manual `[Check again]` (re-reads with `GET /payments/:id`; re-verifies at most once more).
4. On `SUCCESS`: `invalidateQueries(["session"])`, `invalidateQueries(["profile"])`, `invalidateQueries(["payments"])`, clear the stored id, fire toast "Payment successful. Welcome to Premium." once (ref guard). Sidebar swaps "Upgrade" for "Upcoming features" and the crown appears **without reload**.

**Actions.** `[Explore upcoming features]` -> `/upcoming-features`; `[View receipt]` -> `/payment/history/[id]`; `[Check again]` -> verify again; `[Try again]` -> `/payment`.

**States.** Confirming (verify in flight) · Success · Pending (processing) · Failed · Cancelled · Unknown (no id / no recent payment: neutral, never success) · Verify 404 (stored id not ours): treat as Unknown · 502 gateway error from verify ("Could not verify the bKash payment"): "We couldn't confirm your payment yet. If you were charged, it will appear in your history shortly." + `[Check again]` · offline/429 per 2.10.
**Validation.** none. **Gating.** auth (cookies ride the top-level redirect: `sameSite=lax` in dev, `none; secure` in prod, V `auth.utils.ts`). **A11y.** `role="status"`/`aria-live="polite"` on the result region; focus moves to the result heading when confirmation completes; success icon decorative. **Responsive.** centred card, full-width buttons on mobile.

---

### S17 — Payment return: failure `/payment/failure`

**Purpose.** Landing after a failed/cancelled payment (backend redirects here on any error or non-success status).

**Layout.** Same card: icon + title + reason + `[Try again]` `[View payment history]`.

**Data & API.** Resolve `paymentId` as in S16 (stored id, fallback newest within 30 min). `GET /payments/:id` (`["payment", id]`) -> `status`:
- `CANCELLED` -> title "Payment cancelled" / "You cancelled the payment. You haven't been charged." 
- `FAILED` -> "Payment failed" / "We couldn't complete your payment. Please try again. Your payment history shows the latest status." (Do not claim whether money was or was not charged — the status cannot prove it, and the product has no support channel to refer to.)
- `SUCCESS` (race: the callback settled it after the redirect) -> `router.replace("/payment/success")`.
- `PENDING` -> "Payment not completed" + `[Check status]` which only re-reads `GET /payments/:id` (never `verify` here: on a payment the user abandoned, verify would mark it `FAILED`).
- No id / 404 -> neutral "We couldn't find a recent payment." `[Go to Premium page]`.
**Actions.** `[Try again]` -> `/payment`; history -> `/payment/history`. Clear stored id when status is terminal.
**States/validation/gating/a11y/responsive** as S16.

---

### S18 — Payment history `/payment/history`

**Purpose.** List all of the user's payments including FAILED/CANCELLED (V `listMine`: newest first, all statuses unless filtered).

**Layout.**
```
| h1 Payment history                    [Upgrade] (hidden if premium)|
| [All][Success][Pending][Failed][Cancelled]                         |
| Date        | Amount     | Status   | Transaction ID | Invoice     |
| Mar 3, 10:32| 500 BDT    | Success  | 9AB…           | INV-…       |
| Showing 1–10 of 3                                    < 1 >         |
```

**Components.** Existing: `ScrollableTabsHeader` + `tabs`, `pagination/Pagination` (+ adapter RT-7), `BaseSkeleton`, `NoResultFoundWrapper`, shadcn `table`, `ui/button`. **NEW:** `PaymentsTable`, `PaymentStatusBadge`, `formatMoney`/`formatDate` helpers.

**Data & API.** `GET /payments?page&limit=10&status=PENDING|SUCCESS|FAILED|CANCELLED` (V) + `meta`. Key `["payments",{page,limit,status}]`. `amount` is a Prisma `Decimal` — serialised as a **string** in JSON (UNVERIFIED; the formatter must accept string or number): `Intl.NumberFormat(undefined,{style:"currency",currency})` with fallback `${amount} ${currency}` for non-ISO codes.
`providerTransactionId` and `paidAt` are null until success.
**Actions.** Row -> `/payment/history/[id]`. Tab change resets page to 1 (`status` param in the request, URL param too). Status filter value sent only if valid.
**States.** Loading skeleton rows; empty: "No payments yet" / "When you upgrade, your payments appear here." `[Go Premium]` (hidden if premium); no results for filter: "No {status} payments." `[Show all]`; error pattern 2.10.
**Validation.** URL params sanitised as in S12. **Gating.** auth (owner-scoped). **A11y.** table caption "Payment history"; status badges text+icon. **Responsive.** table -> stacked cards <960 (date + amount + status first).

---

### S19 — Payment detail `/payment/history/[id]`

**Purpose.** Receipt-like view of one payment.
**Layout.** Card: status badge + amount (display-md), then definition list: Provider (bKash), Purpose ("Premium upgrade"), Invoice number (mono), Transaction ID (mono, copy button), Created, Paid at; `[Back to history]`. If `status === "PENDING"`: `[Check status]` re-reads `GET /payments/:id` (read-only; never `verify` from here).
**Data & API.** `GET /payments/:id` (`["payment", id]`); 404 `"Payment not found"` -> "Payment not found" state (also for another user's id). Copy-to-clipboard uses `navigator.clipboard` with toast "Copied." (guard for unsupported).
**States.** Loading skeleton; 404; error; PENDING action as above (read-only re-check).
**Validation.** `id` is a UUID string; do not call the API if the param is empty. **Gating.** auth. **A11y.** Use `dl/dt/dd`; copy button `aria-label="Copy transaction ID"`. **Responsive.** single column.

---

### S20 — Upcoming features list `/upcoming-features`

**Purpose.** Premium-only catalogue of planned capabilities (PRD §16–§17), data-driven. For non-premium users it is a clear upgrade gate, never a raw error.

**Layout.**
```
| h1 Upcoming features   [Crown Premium]                        |
| lead: "What we're building next."                             |
| +---------------+ +---------------+ +---------------+          |
| | [16:9 image]  | | [16:9 image]  | |               |  server  |
| | Title         | | Title         | |               |  order   |
| | short desc    | | short desc    | |               |          |
| | (In development) (Coming soon)  | |               |          |
| +---------------+ +---------------+ +---------------+          |
NON-PREMIUM:  [lock] "Upcoming features are for Premium members."  [Upgrade to Premium]
```

**Components.** Existing: `images/BaseImage` (`fallback`), `placeholder/skeletons/CardSkeletons`, `NoResultFoundWrapper`, `CustomSuspense`, `CustomErrorBoundary`, `guard/ShowIf`, `ui/button`.
**NEW:** `FeatureCard`, `FeatureStatusBadge`, `UpgradeGate`, `PremiumBadge`.

**Data & API.** `GET /upcoming-features` (`["upcoming-features"]`, `enabled: session.isPremium`) -> array (no `meta`) of `{ id, slug, title, shortDescription, description, imageUrl, imagePublicId, status, sortOrder, isPremiumVisible, createdAt, updatedAt }` (V). The backend filters `isPremiumVisible = true` and orders by `sortOrder asc`; **render in the order received**, never re-sort.
403 `"This area is for premium members"` (backend `requirePremium` re-reads `isPremium` from the DB each request) -> render `UpgradeGate` and invalidate `["session"]` (the client flag was stale).

**Actions.** Card -> `/upcoming-features/[slug]`. `UpgradeGate` `[Upgrade to Premium]` -> `/payment`.

**Status badge map.** `COMING_SOON` "Coming soon" (muted) · `IN_DEVELOPMENT` "In development" (link tone) · `PLANNED` "Planned" (neutral outline); unknown value -> neutral badge with the raw text title-cased.
**Image fallback.** `imageUrl` null/failed -> `bg-canvas-soft` tile with the title's first letter (no brand gradient — it is hero-scale only).

**States.** Non-premium: gate rendered immediately, **no request fired**. Loading: `CardSkeletonV2List`. Empty: "Nothing here yet" / "New ideas will show up here as we plan them." Error: 2.10 pattern. 401: global handling. The sidebar entry is hidden unless premium, but a direct visit by a non-premium user shows the gate (not a 404).
**Validation.** none. **Gating.** premium (UX flag + backend 403). **A11y.** Cards in a `ul`; each card one link with `aria-label` "{title}, {status}"; gate uses a normal heading + button, `role` not `alert`. **Responsive.** 3-up -> 2-up -> 1-up; images 16:9.

---

### S21 — Upcoming feature detail `/upcoming-features/[slug]`

**Purpose.** Full description of one feature.
**Layout.** Back link; hero image 16:9 (rounded-lg, `shadow-card`); status badge; `h1` title; description (`whitespace-pre-line`, plain text only — never `dangerouslySetInnerHTML`); `[Back to features]`.
**Data & API.** `GET /upcoming-features/:slug` (`["upcoming-feature", slug]`; `initialData` from the list cache when present). 404 `"Upcoming feature not found"` is returned for a missing slug **and** for `isPremiumVisible = false` (indistinguishable) -> not-found state "This feature isn't available." `[Back to features]`. 403 -> `UpgradeGate`.
**States.** Loading skeleton (image block + 3 lines); 404; 403; error 2.10. **Validation.** `slug` matches `^[a-z0-9-]+$` before calling (else immediate not-found). **Gating.** premium. **A11y.** `img alt` = title; heading hierarchy h1 -> none below. **Responsive.** image full width; text max-w-prose.

---

### S22 — Admin: platforms `/admin/platforms`

**Purpose.** Maintain the platform catalogue without code changes (PRD §17). Platforms are never deleted; retire with `isActive=false`.

**Layout (Admin layout: tab bar Platforms | Users | Audit logs | Upcoming features).**
```
| h1 Admin · Platforms                              [ New platform ] |
| Logo | Key (mono) | Name | Status      | Active | Order | [Edit]   |
| [in] | linkedin   | LinkedIn | LIVE     | on     | 1     | Edit     |
| [fb] | facebook   | Facebook | LIVE     | on     | 2     | Edit     |
| [..] | instagram  | Instagram| COMING_SOON | off | 3     | Edit     |
```

**Components.** Existing: `modal/multipage-modal/MultipageModal` (create/edit; `useMultipageModal().open(pageId,payload)`), `form/{GenericForm,TextField,SelectField,SwitchField,SubmitButton}`, `attachment/AttachmentField` + `prepareImage`,
`images/BaseImage`, `modal/veriations/DeleteConfirmModal` (retire confirm), `common-modules/scrollable-tabs-header` (admin tabs), shadcn `table`/`badge`, `BaseSkeleton`, `NoResultFoundWrapper`. **NEW:** `AdminTabs`, `PlatformsTable`, `PlatformForm`, `PlatformStatusBadge`.

**Data & API (V `platform.route.ts`).**
- `GET /admin/platforms` (`["admin","platforms"]`) -> all platforms incl. inactive, ordered by `sortOrder`. Row `{ id, key, name, logoUrl, logoPublicId, status, isActive, sortOrder, createdAt, updatedAt }`.
- `POST /admin/platforms` JSON `{ key, name, status?, sortOrder?, isActive? }` -> created. 409 `"A platform with this key already exists"`.
- `PATCH /admin/platforms/:id` JSON `{ name?, status?, sortOrder?, isActive? }` (**`key` is immutable and not in the schema**).
- `PATCH /admin/platforms/:id/logo` multipart field `logo` (image/*, <= 5 MB).
- (`GET /admin/platforms/:id` exists; UI uses list rows.)
- Image is a **second step**: create/update JSON first, then upload logo. If the upload fails the record still exists: show "Saved, but the logo couldn't be uploaded." + `[Retry upload]` on the row; do not roll back.

**Actions -> effects.** `[New platform]` -> modal. Edit -> modal prefilled (`values`), `key` read-only. Save -> mutation -> invalidate `["admin","platforms"]` **and** `["platforms"]` (the public list) -> toast "Platform created." / "Platform updated." Toggle Active off -> confirm "Retire {name}? It will disappear from connect and publish pickers. Existing connections and history are kept." -> PATCH `{isActive:false}`. Status `LIVE` hint: "Needs a connector in the backend; otherwise connect returns 'No integration is wired for this platform yet'."
**States.** Loading rows; empty "No platforms yet" `[New platform]`; error 2.10; 409 -> error on the `key` field "A platform with this key already exists"; 403 (role revoked mid-session) -> toast "Forbidden." + refetch session; upload error per row.
**Validation (`platformSchema`, mirrors `platform.validation.ts`).** `key: z.string().trim().min(1,"Key is required").regex(/^[a-z0-9-]+$/,"Key must be a lowercase slug (letters, numbers, hyphens)")` (create only); `name: z.string().trim().min(1,"Name is required")`; `status: z.enum(["LIVE","COMING_SOON"])`; `sortOrder: z.coerce.number().int()` (`TextField type="number"` yields a string — coerce, send a number); `isActive: z.boolean()`.
**Gating.** admin (`ADMIN`/`SUPER_ADMIN`). **A11y.** Table semantics; modal focus trap; `Switch` labelled "Active". **Responsive.** table -> cards <960; modal full-screen on mobile.

---

### S23 — Admin: users `/admin/users`

**Purpose.** Find users; block/unblock; grant/revoke Premium; (SUPER_ADMIN) change role.

**Layout.**
```
| h1 Admin · Users          [ Search name or email...        ]   |
| Name/Email        | Role  | Status  | Premium | Joined | [ ⋯ ] |
| Ada  a@b.com      | USER  | Active  | Crown   | Mar 3  |  View |
| (row click opens right Drawer: details + actions)              |
| Showing 1–10 of 134                           < 1 2 3 >        |
```

**Components.** Existing: `overlays/drawer/Drawer` (detail; has `aria-modal`, Esc, close button), `pagination/Pagination` (+ adapter RT-7), `form/{TextField,SelectField,SwitchField}` or `ui/{input,select,switch}`, `hooks/useDebounce`, `modal/veriations/DeleteConfirmModal` (confirms), `images/variations/avatar/BaseAvatar` (initials only — admin payload has no `avatarUrl`), shadcn `table`/`badge`, `BaseSkeleton`, `NoResultFoundWrapper`. **NEW:** `UsersTable`, `UserDetailDrawer`, `UserStatusBadge`, `RoleSelect`.

**Data & API (V `admin.route.ts`, `admin.service.ts`).**
- `GET /admin/users?page&limit=10&search=` -> `data[]` + `meta`; `search` = case-insensitive contains over email/name; newest first. Row (`SAFE_USER_SELECT`): `{ id, name, email, role, isPremium, premiumSince, status, emailVerified, isDeleted, createdAt }` (**no avatar, no providers**). Key `["admin","users",{page,limit,search}]`.
- `GET /admin/users/:id` (`["admin","user",id]`) -> same shape; 404 `"User not found"`.
- `PATCH /admin/users/:id/status` `{ status: "ACTIVE"|"BLOCKED" }`; 400 `"You cannot change your own status"`.
- `PATCH /admin/users/:id/premium` `{ isPremium: boolean }` (no self-guard in the backend; allowed on any user incl. self).
- `PATCH /admin/users/:id/role` `{ role: "SUPER_ADMIN"|"ADMIN"|"USER" }` — route is `auth("SUPER_ADMIN")`; 400 `"You cannot change your own role"`.
All three PATCHes return the updated safe user; write it into `["admin","user",id]` and invalidate `["admin","users"]`. Each action writes an audit row server-side (no client work).

**Actions -> effects (all behind confirm dialogs).**
- Block: "Block {name}? They can't log in and any active session stops working on its next request." -> toast "User blocked." / Unblock: "Unblock {name}?" -> "User unblocked."
- Grant premium: "Grant Premium to {name}? This doesn't create a payment." -> "Premium granted." / Revoke: "Revoke Premium from {name}? They'll lose access to Upcoming features." -> "Premium revoked."
- Change role (SUPER_ADMIN only): `RoleSelect` + confirm "Change {name}'s role to ADMIN?" -> "Role updated."
- Own row (`row.id === session.id`): status and role controls disabled with tooltip "You can't change your own status/role."; deleted users (`isDeleted`) show a "Deleted" badge and all actions disabled (UX; backend would still accept — UNVERIFIED intent).
- Search typing -> debounced 300 ms -> `?search=&page=1` in URL.
**States.** Loading rows; empty (no users match): "No users match “term”" `[Clear search]`; error 2.10; 403 on role change for ADMIN is prevented by hiding the control (still handle 403 with toast); 404 on action -> "User not found" + refetch.
**Validation.** `search` trimmed. **Gating.** admin; role control `ShowIf role === "SUPER_ADMIN"`. **A11y.** Drawer labelled by user name, focus returns to the row; switches/selects labelled; destructive confirms default focus on Cancel. **Responsive.** table -> cards <960; drawer full width on mobile (`width` responsive object).

---

### S24 — Admin: audit logs `/admin/audit-logs`

**Purpose.** Read-only, append-only trail of sensitive actions.
**Layout.** Filters row (`Action` select + free-text fallback, `Entity type` select, `Actor ID` text, `[Reset]`); table: Time · Action · Entity (type + id) · Actor ID (mono) · [expand]; expanded row shows `metadata` JSON (collapsible `<pre>` mono), `ipAddress`, `userAgent`; pagination.

**Components.** Existing: `ui/select`/`form/SelectField`, `ui/input`, `ui/button`, `Pagination` (+ adapter), `BaseSkeleton`, `NoResultFoundWrapper`, shadcn `table`. **NEW:** `AuditLogsTable`, `AuditFilters`, `JsonDisclosure`.
**Data & API.** `GET /admin/audit-logs?page&limit=10&actorId&action&entityType` (V; **exact-match** filters, no date filter, newest first) -> `data[]` of `{ id, actorId, action, entityType, entityId, metadata, ipAddress, userAgent, createdAt }` + `meta`. Key `["admin","audit-logs",{...}]`; filters live in URL params; any filter change resets `page`.
Known `action` values written by the backend today (V): `PLATFORM_CREATED`, `PLATFORM_UPDATED`, `FEATURE_CREATED`, `FEATURE_UPDATED`, `FEATURE_DELETED`, `USER_BLOCKED`, `USER_UNBLOCKED`, `USER_ROLE_CHANGED`, `USER_PREMIUM_GRANTED`, `USER_PREMIUM_REVOKED`, `PAYMENT_VERIFIED`, `CONNECTION_DISCONNECTED`.
Known `entityType`: `User`, `Payment`, `Platform`, `UpcomingFeature`, `SocialConnection`. Both are plain strings server-side (new kinds need no schema change), so the selects offer "Other…" with free text.
GAP: the API returns `actorId` only (no actor name/email); show the id in mono with a copy button and a "Filter by this actor" action. `entityId` for `CONNECTION_DISCONNECTED` is the platform key, not a UUID (V `connection.controller.ts`).
**Actions.** Filter/reset; expand row; copy id; paginate. No edit/delete/export (non-goals).
**States.** Loading; empty "No audit entries yet" / filtered "No entries match these filters." `[Reset filters]`; error 2.10; `metadata` null -> "No metadata". **Validation.** inputs trimmed; empty -> param omitted. **Gating.** admin. **A11y.** expand button `aria-expanded`/`aria-controls`; JSON in `<pre tabindex="0">` scrollable; times in `<time>`. **Responsive.** table -> stacked cards; filters wrap into a collapsible panel.

---

### S25 — Admin: upcoming features `/admin/upcoming-features`

**Purpose.** CRUD the data-driven catalogue shown at S20/S21 (includes hidden items).
**Layout.** Table: thumb · Title · Slug (mono) · Status · Visible (switch/badge) · Order · [Edit][Delete]; `[New feature]`; edit/create in `MultipageModal`.

**Components.** Existing: `MultipageModal`, `form/{GenericForm,TextField,TextareaField,SelectField,SwitchField,SubmitButton}`, `attachment/AttachmentField` + `prepareImage`, `images/BaseImage`, `DeleteConfirmModal`, `AdminTabs`, shadcn `table`/`badge`, `BaseSkeleton`, `NoResultFoundWrapper`. **NEW:** `FeaturesTable`, `FeatureForm`.
**Data & API (V `upcomingFeature.route.ts`).**
- `GET /admin/upcoming-features` (`["admin","features"]`) -> all, ordered by `sortOrder`.
- `POST /admin/upcoming-features` JSON `{ slug, title, shortDescription, description, status?, sortOrder?, isPremiumVisible? }` -> created; 409 `"A feature with this slug already exists"`.
- `PATCH /admin/upcoming-features/:id` JSON (all fields optional, `slug` included; same 409).
- `PATCH /admin/upcoming-features/:id/image` multipart field `image` (second step, retryable; "Saved, but the image couldn't be uploaded." `[Retry upload]`).
- `DELETE /admin/upcoming-features/:id` (hard delete; 404 `"Upcoming feature not found"`).
- After any mutation invalidate `["admin","features"]`, `["upcoming-features"]`, `["upcoming-feature", slug]`.
**Actions.** Create/Edit/Delete with toasts "Feature created." / "Feature updated." / "Feature deleted." Delete confirm: "Delete {title}? This can't be undone. To hide it from Premium users without deleting, turn off “Visible to Premium”." (confirm label "Delete").
**States.** Loading; empty "No features yet" `[New feature]`; error; 409 -> `slug` field error; hidden rows muted with badge "Hidden".
**Validation (`featureSchema`).** `slug: z.string().trim().min(1,"Slug is required").regex(/^[a-z0-9-]+$/,"Slug must be a lowercase slug (letters, numbers, hyphens)")`; `title: z.string().trim().min(1,"Title is required")`; `shortDescription: z.string().trim().min(1,"Short description is required")`; `description: z.string().trim().min(1,"Description is required")`; `status: z.enum(["COMING_SOON","IN_DEVELOPMENT","PLANNED"])`; `sortOrder: z.coerce.number().int()`; `isPremiumVisible: z.boolean()`.
**Gating.** admin. **A11y/Responsive.** as S22.

---

### S26 — 404 Not found

`app/not-found.tsx` (root; renders for any unmatched URL) plus `not-found.tsx` inside the `(dashboard)` group for `notFound()` calls from authenticated routes. Copy: h1 "Page not found" / "The page you're looking for doesn't exist or has moved." Actions: signed-in -> `[Go to dashboard]`; guest -> `[Go home]` + `[Log in]` (choice made client-side from `useSession()`; while the session is loading show only `[Go home]`). Inside the shell the sidebar remains. Entity-level not-founds (post, execution, payment, feature, user) are handled **inside** their screens (not Next's 404) so the user keeps context. a11y: `h1`, no auto-redirect. Layout: Marketing layout for root; App shell for dashboard group.

### S27 — Error boundary

`error.tsx` per group (`"use client"`, props `{ error, reset }`) and `app/global-error.tsx` (must include its own `<html><body>`; dark tokens via class `dark`). Copy: "Something went wrong" / "An unexpected error occurred. Try again, or head back." Buttons `[Try again]` (calls `reset()`), `[Go home]`. Show `error.digest` as "Reference: <digest>" in mono if present; **never** render `error.message`/stack. Log to `console.error` in dev only. Uses `CustomErrorBoundary`'s visual language (RT-6 re-themed `DefaultErrorUI`). Data-fetch errors are NOT routed here — they use the inline pattern (2.10).

### S28 — Session expired (variant of S02)

Not a route. Trigger: the `apiClient` interceptor (4.1) cannot refresh the session (refresh 401 / "Your session is no longer valid"). Effect: `queryClient.clear()`, toast id `"session-expired"` once ("Your session expired. Please log in again."), `router.replace("/login?reason=session-expired&next=<current path>")`. S02 shows the warning alert. No data is shown from stale caches after this point. Public routes (marketing) are not redirected — a 401 there just means guest.

### S29 — Admin forbidden view

Rendered by `(dashboard)/admin/layout.tsx` when `session.role` is not `ADMIN`/`SUPER_ADMIN`: inside the shell, h1 "You don't have access to this page." / "This area is for administrators." `[Back to dashboard]`. No admin API calls are made in this state. Anonymous users never reach it (the shell guard redirects to `/login?next=`). If the session role is stale and the backend returns 403 `"Forbidden. You don't have permission to access this resource."` on an admin call -> invalidate `["session"]`; the layout re-evaluates and renders this view.

---

## 4. Cross-screen interactions

### 4.1 Session bootstrap, refresh and guards

```
first paint -> useSession(): GET /auth/me
   200 -> user  -> ["session"] = user (role, isPremium, name, avatarUrl, ...)
   401 -> POST /auth/refresh-token (refresh cookie, 7d) -- single in-flight promise
            200 -> cookies rotated -> retry GET /auth/me once -> user | null
            401 -> ["session"] = null (guest)
```
- `["session"]`: `retry:false`, `staleTime` 60 s, `refetchOnWindowFocus: true` (cheap; keeps premium/role/blocked state honest across tabs).
- **Interceptor (ofetch `onResponseError`)** — on 401 from any call **except** `/auth/login`, `/auth/register`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/refresh-token`, `/auth/logout`, and the connection callback: one shared refresh attempt, then replay the original request **once**.
  - Refresh fails -> S28 flow (clear cache, toast once, redirect to login with `next`).
  - **Replay returns 401 again** (e.g. `PATCH /users/me/password` -> "Current password is incorrect", which is a 401 by design): the refresh succeeded, so the session is valid; surface the error to the caller; **do not log out**. This is the one place a 401 means "bad input", so mutations must never assume 401 == expired.
- `AuthGuard` (client, `(dashboard)/layout.tsx`): session loading -> shell-shaped skeleton (sidebar + content blocks, no flash of forbidden content); null -> `router.replace("/login?next=" + encodeURIComponent(path+search))`; user -> render. No Next `proxy.ts` auth (cookie lives on the API origin; it cannot be verified at the edge).
- `GuestOnly` in the Auth layout: user present -> `router.replace("/dashboard")`. `/` never redirects.
- Logout (any screen): `POST /auth/logout` -> `queryClient.clear()` -> `router.replace("/")`. Delete account the same, after `DELETE /users/me`.
- Blocked/deleted mid-session: `auth()` returns 401 "Your session is no longer valid. Please log in again." and refresh also fails -> S28.
- Open-redirect guard for `next`: must start with `/`, must not start with `//`, must not contain `\` or a scheme.

### 4.2 Premium upgrade reflected everywhere

Single source of truth: `["session"].isPremium` (and `premiumSince`). Consumers: sidebar (Upcoming features vs Upgrade), `PremiumBadge` (topbar/avatar menu, profile, dashboard, upcoming list), S15 (hides CTA), S20/S21 (`enabled`), marketing CTA targets.
Triggers that refresh it: (1) S16 on `SUCCESS` -> invalidate `["session"]`, `["profile"]`, `["payments"]`; (2) window focus refetch (admin granted/revoked it elsewhere); (3) any 403 `"This area is for premium members"` -> invalidate `["session"]`; (4) S14 mount (`["profile"]` refetch also syncs session via `setQueryData`). No optimistic premium flag, ever (the backend flips it atomically in the same transaction that marks the payment `SUCCESS`).
Admin revoke: the user keeps the flag in cache until the next refetch/403; the backend gate (`requirePremium`) is DB-checked so no premium data leaks in the meantime.

### 4.3 Publish status polling (end to end)

```
S07 Save&publish -> POST /posts (201)  -> /posts/:id?publish=linkedin,facebook
S09 Publish now  -> POST /posts/:id/publish {platforms} -> 202 {executionId,status:PENDING}
                 -> toast "Publishing started. You can leave this page." -> /executions/:executionId
S13              -> GET /executions/:id every 3s (5s after 60s) while PENDING|RUNNING
                 -> terminal: stop polling; one completion toast (COMPLETED | PARTIALLY_COMPLETED | FAILED)
                 -> Retry -> 202 -> optimistic PENDING -> polling resumes -> terminal toast again (new transition)
user leaves page -> polling stops (unmount); backend continues (BullMQ worker); returning shows current state
S06/S12 lists    -> active rows trigger a 10s list refetch while visible
```
Invalidation after publish/retry: `["executions"]`, `["execution", id]`. Toast on a terminal state is fired only for a **transition observed in this session** (not on first load of a finished run). If the worker is down the run stays `PENDING` -> "Taking longer than expected" after 5 min.
Backend caveat (V): the publish endpoint verifies a connection **exists** but does not check expiry, so an `EXPIRED` connection is accepted and will fail at publish; the UI therefore blocks selecting `EXPIRED` connections.

### 4.4 OAuth round trip (LinkedIn / Facebook Page)

```
S10 [Connect] -> GET /connections/:platform/connect -> { authUrl }  (state issued in Redis, 10 min TTL)
   -> browser -> provider consent -> provider redirects to <FRONTEND>/connections/callback/:platform?code&state
S11 -> GET /connections/:platform/callback?code&state (no auth; state resolves user)
        connected   -> invalidate ["connections"] -> /connections + toast
        select-page -> seed ["fb-pages"] -> /connections?select=facebook -> S10 picker
                          GET /connections/facebook/pages  (10 min TTL, survives refresh)
                          POST /connections/facebook/select-page {pageId} -> connection -> /connections + toast
        error/denied -> /connections?error=<cancelled|invalid-state|failed>
```
Rules: callback call fires exactly once (ref guard); `state` is single-use (a refresh of S11 yields "Invalid or expired OAuth state" -> `?error=invalid-state`); platform param validated; config dependency on provider redirect URIs (S11). Reconnect (EXPIRED) is the same flow; backend upserts one connection per user+platform.

### 4.5 Payment round trip (bKash)

```
S15 [Upgrade] -> POST /payments/create -> 201 {paymentId, redirectUrl}
   -> sessionStorage["ca.pendingPaymentId"]=paymentId -> window.location.assign(redirectUrl)
bKash -> backend GET /payments/callback?paymentID&status  (unauthenticated; server confirms with bKash, flips PENDING->SUCCESS + isPremium atomically)
   -> 302 {FRONTEND_BASE_URL}/payment/success | /payment/failure   (no query params)
S16 -> GET /payments/:id (read-only); if PENDING -> POST /payments/verify {paymentId} (safety net) then 2 re-reads x 2s
        SUCCESS -> invalidate session/profile/payments -> crown + sidebar update, toast
S17 -> GET /payments/:id -> CANCELLED | FAILED copy (SUCCESS race -> S16)
```
Rules: never trust the URL; `verify` only on the redirect landing page (it can mark an unfinished payment FAILED); a premium user can still call create (backend does not block it) so the UI hides the CTA; no stored id and no payment created in the last 30 min -> neutral state; double-click on Upgrade guarded; stored id cleared on any terminal status; `sessionStorage` access always in try/catch (private mode).

### 4.6 Invalidation matrix

| Mutation (success) | Invalidate / update |
|---|---|
| login / verify-email | `setQueryData(["session"], user)` |
| logout / delete account / session expired | `queryClient.clear()` |
| update name / avatar / remove avatar | `setQueryData(["profile"])`, update `["session"]` name/avatarUrl |
| change password | none (reset form) |
| connect callback / select-page / disconnect | `["connections"]` (+ `["fb-pages"]` removed on select/disconnect) |
| create post | `["posts"]`, set `["post", id]` |
| delete post | `["posts"]`, remove `["post", id]` |
| publish | `["executions"]` |
| retry publication / execution | `["execution", id]`, `["executions"]` |
| payment verify SUCCESS | `["session"]`, `["profile"]`, `["payments"]` |
| admin platform create/update/logo | `["admin","platforms"]`, `["platforms"]` |
| admin user status/premium/role | `["admin","user",id]`, `["admin","users"]` |
| admin feature create/update/delete/image | `["admin","features"]`, `["upcoming-features"]`, `["upcoming-feature", slug]` |

### 4.7 Global error, offline and rate-limit behaviour

- One `ApiError` shape in `src/lib/errors`: `{ status, message, isNetwork, isRateLimited }`. Map `FetchError` without a response -> network; 429 -> rate-limited (any body shape).
- Offline: `onlineManager` + `navigator.onLine` -> shell banner; queries pause; mutation buttons disabled; recovery refetches active queries.
- Rate-limit (429): per-form lockout 60 s with visible countdown (auth screens); elsewhere a toast "Too many requests. Please wait a few minutes." (id `"rate-limit"`, deduped) and widgets keep stale data.
- 5xx: generic copy; never show `error`/`stack`/`name` fields even if present.
- Every toast has an inline counterpart for important outcomes (2.6).

---

## 5. Component inventory

### 5.1 Existing blocks and where they are used

Paths under `src/components/reusable-ui-blocks/` unless stated. "RT" = needs the re-theme pass in 5.4 first.

| Block | File | Used in |
|---|---|---|
| `GenericForm` + `useGenericForm*` | `form/core/GenericForm.tsx` | S02-S05, S07, S14, S22, S25 |
| `TextField` (RT-2) | `form/fields/TextField.tsx` | S02-S05, S07, S08, S14, S22, S23, S24, S25 |
| `TextareaField` | `form/fields/TextareaField.tsx` | S07, S25 |
| `CheckboxField` / `SwitchField` / `SelectField` / `RadioGroupField` | `form/fields/*` | S22, S25 (Switch/Select), S10 picker (RadioGroup) |
| `SubmitButton`, `ResetButton` | `form/fields/*` | all forms |
| Form escape hatches `FormField/FormItem/FormControl/FormMessage` | `form/index.ts` | `OtpField` |
| `BaseButton` (RT-1) | `buttons/BaseButton.tsx` | only where `isLoading` spinner is needed outside forms |
| `Button` | `components/ui/button.tsx` | everywhere (radius fix 2.2) |
| `BaseImage` | `images/BaseImage.tsx` | S07, S08, S09, S10, S13, S20-S22, S25 |
| `BaseAvatar` | `images/variations/avatar/BaseAvatar.tsx` | topbar/avatar menu, S01 header, S14, S23 |
| `AttachmentField` + `prepareImage` | `attachment/*` | S07, S22, S25 |
| `DeleteConfirmModal` (RT-3) | `modal/veriations/DeleteConfirmModal.tsx` | S08, S09, S10, S22 (retire), S23, S25 |
| `GenericModalWrapper` / `ModalWrapper` (RT-3) | `modal/*` | `TypedConfirmDialog`, `FacebookPagePicker` |
| `MultipageModal` + `useMultipageModal` (RT-3) | `modal/multipage-modal/*` | S22, S25 |
| `Drawer` (RT-3) | `overlays/drawer/*` | mobile sidebar, S23 detail |
| `Pagination` + `PaginationProvider` (RT-7) | `pagination/*` | S12, S18, S23, S24 |
| `InfiniteScrollProvider` + `InfiniteScrollRenderer` | `pagination/infinite-scroll/*` | S08 |
| `NoResultFoundWrapper` (RT-5) | `placeholder/no-results-found-wrapper/*` | every list |
| `BaseSkeleton`, `ParagraphSkeleton`, `CardSkeletons` (RT-5), `ListSkeleton`, `TabsSkeleton` | `placeholder/skeletons/*` | every loading state |
| `CustomSuspense`, `CustomErrorBoundary` + `DefaultErrorUI` (RT-6) | `layouts/wrapper/*` | every async region |
| `ShowIf` | `guard/ShowIf.tsx` | nav predicates, role-gated controls |
| `ScrollableTabsHeader`, `TabsProvider`, `TabItem` (RT-4) | `common-modules/scrollable-tabs-header`, `tabs/*` | S12, S18, admin tabs |
| `DateRangePresetFilter`, `DateFilterButton`, `CalendarModal` (RT-4) | `dates/date-filter/*`, `date-time/calendar/*` | S12 |
| `Dropdown` (RT-4) | `dropdown/Dropdown.tsx` | avatar menu (single-select popover) |
| `useDebounce` | `hooks/useDebounce.ts` | S08, S23 |
| `Heading` | `typography/Heading.tsx` | optional page titles |
| `HorizontalScroller`, `popover`, `select`, `checkbox`, `switch`, `tooltip`, `input`, `label`, `textarea`, `calendar` | `components/ui/*` | as noted |
| `Logo`, `PlatformIcons` | `components/brand/*` | auth, shell, S01, S10 |
| `Header`, `Footer`, `Hero`, `Features`, `HowItWorks`, `PremiumCta` | `components/layout/public/*`, `components/modules/homepage/*` | S01 |
| `Sparkline` / `line-chart` / `donut-breakdown-chart` | `charts/*` | **not used** in the MVP (PRD: no complex analytics) |

### 5.2 shadcn additions (registry components, same radix dialect — D3 — not from-scratch primitives)

`bunx shadcn@latest add table badge alert dropdown-menu` (log each in `docs/decisions.md`). Reason: no table, badge, alert or action-menu primitive exists in `components/ui`; `Dropdown` is a single-select popover and is wrong for navigation/action menus (avatar menu, post card overflow). `card` is not needed (`bg-card rounded-lg shadow-card` div). **Nothing needs to be built as a primitive from scratch.**

### 5.3 NEW feature components (props sketches; all under `src/components/modules/<feature>/` unless noted)

Shared (`src/components/modules/shared/` — folder already exists):
```ts
PremiumBadge        { size?: "sm"|"md"; withLabel?: boolean }              // crown + "Premium"
ExecutionStatusBadge{ status: ExecutionStatus }                            // PENDING "Queued", RUNNING "Publishing", COMPLETED "Published", PARTIALLY_COMPLETED "Partial", FAILED "Failed"
PublicationStatusBadge{ status: PublicationStatus }                        // + SUCCESS "Published"
PlatformStatusChip  { platformKey: string; name: string; status: PublicationStatus }
PaymentStatusBadge  { status: PaymentStatus }
FeatureStatusBadge  { status: UpcomingFeatureStatus | string }
ConnectionStatusBadge{ status: "CONNECTED"|"EXPIRED"|"NOT_CONNECTED"|"COMING_SOON" }
EmptyBanner/Callout -> use shadcn Alert (no new component)
```
Status vocabulary lives in `src/lib/status.ts` (label, tone, icon, `isActiveExecution`) — one place (publish design D3).

Auth: `AuthCard { title; description?; children; footer? }`, `AuthAlert { variant: "info"|"warning"|"error"; children }`, `OtpField<T> { name; label?; description?; autoFocus? }`, `RegisterFlow {}`, `GuestOnly { children }`.
Shell: `AppShell { children }`, `Sidebar { items: NavItem[]; user }`, `AppTopbar { onMenu() }`, `AuthGuard { children }`, `SessionNav {}` (marketing header right side), `OfflineBanner {}`, `UserMenu { user }`.
Dashboard: `WelcomeHeader { user }`, `StatTile { label; value?: number; isLoading; isError }`, `ConnectionsSummaryCard {}`, `PremiumStatusCard { user }`, `RecentExecutionsCard {}`, `RecentPostsCard {}`.
Composer/posts: `ComposerForm {}`, `TargetPlatforms { value: string[]; onChange(keys): void; name?: string }` (reads `usePlatforms`/`useConnections`), `PostPreview { platform: {key,name,accountName?}; title?; content; imageUrl? }`, `PostCard { post; onDelete(id) }`, `PostsList { search; sort }`, `PostDetailView { id }`, `PublishPanel { postId; preselected: string[] }`.
Connections: `PlatformCard { platform: Platform; connection?: Connection; onConnect(); onDisconnect() }`, `FacebookPagePicker { open; onClose() }`, `OAuthErrorBanner { code }`, `OAuthCallbackHandler { platform }`.
Executions: `ExecutionsTable { rows; isLoading }`, `ExecutionFilters {}`, `ExecutionHeader { execution }`, `WorkflowGraph { execution }` (`@xyflow/react`; fallback `WorkflowStepper`), `PublicationRow { publication; onRetry(id); isRetrying }`, `RetryButton { label; onClick; isLoading }`, `ExecutionPoller { executionId }` (effect-only: completion toast once).
Profile: `ProfileIdentityCard`, `AvatarUploader { src?; name; onUpload(file); onRemove(); isUploading }`, `AccountInfoCard`, `ChangePasswordCard`, `DangerZoneCard`, `TypedConfirmDialog { open; title; message; phrase: string; confirmLabel; loading; error?; onConfirm(); onClose() }`.
Payment: `PremiumBenefitsCard {}`, `UpgradeButton { disabled? }`, `PaymentResultCard { state; payment? }`, `PaymentsTable { rows }`, `PaymentDetail { payment }`.
Upcoming: `FeatureCard { feature }`, `UpgradeGate {}`.
Admin: `AdminTabs {}`, `PlatformsTable`, `PlatformForm { platform?; onDone() }`, `UsersTable`, `UserDetailDrawer { userId; onClose() }`, `RoleSelect { value; disabled; onChange }`, `AuditLogsTable`, `AuditFilters`, `JsonDisclosure { value }`, `FeaturesTable`, `FeatureForm { feature?; onDone() }`.
Helpers (non-UI): `src/lib/format.ts` (`formatMoney`, `formatDate`, `formatRelative`, `truncate`), `src/lib/safeNext.ts`, `src/lib/pendingPayment.ts` (guarded sessionStorage), `toPaginationMeta(meta)` adapter.

### 5.4 Re-theme prerequisites for the copied blocks (genuine fixes, in place, logged — CLAUDE.md allows "fix genuine bugs in place")

The blocks were copied from a light-theme project (`docs/decisions.md` D2 lists only the i18n/errors/roles adaptations). They still hard-code light colours/`font-proxima-nova`, and the project theme defines **no** `font-proxima-nova`, `primary-light`, `dark`, or `text-white`-safe primary, so several render unreadably on the dark tokens. This was found by grepping the blocks (`#141414`, `#666`, `bg-white`, `text-white`, `rounded-[60px]`). Do this as one early task (recommend: change 2 task group "Re-theme blocks", before any screen uses them), then verify each in the browser:

| ID | Block(s) | Problem found | Fix (use tokens only) |
|---|---|---|---|
| RT-1 | `buttons/BaseButton.tsx` | intents use `bg-primary text-white` (white on #ededed primary) and undefined `primary-light`; `rounded-md` = 8px | map `primary` -> `bg-primary text-primary-foreground`; `bordered`/`ghost` -> `border-border text-foreground hover:bg-accent`; add `destructive`; radius `rounded-sm`; keep `isLoading` |
| RT-2 | `form/fields/TextField.tsx` (+ `TextareaField` if similar; UNVERIFIED) | `BASE_INPUT_CLASS` 54px pill, `#F0F0F0` border, `font-proxima-nova`, `text-dark` label | edit the documented `BASE_*_CLASS` literals to design-system `form-input` (40px, 6px radius, `border-input`, `text-sm`) |
| RT-3 | `modal/GenericModalWrapper.tsx`, `ModalWrapper.tsx`, `DeleteConfirmModal.tsx`, `multipage-modal/*`, `overlays/drawer/*` | `bg-white`, `bg-black/30`, `#141414` headings, `text-[40px]` titles, pill buttons (violates 6px in-app rule) | `bg-card shadow-modal text-foreground`, title `text-display-sm`, buttons `Button` 6px; destructive confirm first; verify focus trap/restore |
| RT-4 | `tabs/TabItem.tsx`, `ScrollableTabsHeader.tsx`, `dropdown/Dropdown.tsx`, `dates/date-filter/*`, `date-time/calendar/CalendarModal.tsx`, `date-time/time-picker/*` | hex colours, `bg-white`, `text-white` | tokens: active tab `bg-primary text-primary-foreground` (pill-sm allowed for tabs per design system `tab-ghost`), popovers `bg-popover` |
| RT-5 | `placeholder/no-results-found-wrapper/*`, `skeletons/CardSkeletons.tsx`, `SkeletonLibrary.tsx` | `bg-white`, `#141414`/`#666` text, pill `Try again` that reloads the page, light SVG | `text-foreground`/`text-muted-foreground`, accept an `action` node instead of `showTryAgain`, skeleton `bg-card`; (the `no_content_icon.svg` colours: UNVERIFIED) |
| RT-6 | `layouts/wrapper/error/error-ui-variations/DefaultErrorUI.tsx` | `#FF124B`, `#141414` text, no retry | `text-destructive`/`text-foreground`, optional `onRetry` prop (extend by composition if props are frozen) |
| RT-7 | `pagination/Pagination.tsx`, `provider/usePaginationContextHelper.ts` | light colours; meta expects **snake_case** `{current_page,last_page,per_page,total}`, backend returns `{page,limit,total,totalPages}` | tokens; add adapter `toPaginationMeta({page,limit,total,totalPages}) -> {current_page,last_page,per_page,total}` called in each list hook (no change to the block's contract); page changes must write `?page=` to the URL |
| RT-8 | `attachment/AttachmentField.tsx`, `images/variations/avatar/*` | `font-proxima-nova`, `text-white`, hairline hex | tokens (`text-foreground`, `bg-muted`); keep behaviour |
| RT-9 | `components/ui/{button,input}.tsx` | `rounded-md` resolves to 8px in this theme | `rounded-sm` (6px) for in-app controls; pill sizes unchanged |

`font-proxima-nova` utilities are no-ops here (no such theme font) and can be left or stripped when touching a file.

### 5.5 Primitive-from-scratch check

None required. Everything above is a reusable block, a shadcn registry component (5.2), a small feature composition (5.3), or a library (`@xyflow/react`, new dependency to log). If the team declines `@xyflow/react`, `WorkflowStepper` is plain flex/CSS (a feature component, not a primitive).

---

## 6. Plan amendments, gaps and open items

### 6.1 Amendments to existing OpenSpec changes (do before applying the change)

1. **post-composer-ui / app-shell**: no route change needed (D-UI-1 keeps the feed on `/dashboard`); but state explicitly in app-shell task 6 that the dashboard hosts the `PostsList` section below the widgets, and that `/posts/[id]` back/delete redirects go to `/dashboard`.
2. **publish-and-executions-ui**: add React Flow `WorkflowGraph` (dependency + tasks); add the 10 s list refetch for active rows; note the 5xx/transient poll-error states.
3. **app-shell-and-marketing**: add task group "Re-theme blocks (RT-1..RT-9)", the radius fix, header pill scale on `/`, `not-found`/`error`/`global-error`, `OfflineBanner`, route-group naming decision.
4. **auth-ui**: add `refetchOnWindowFocus` for session, the 401-replay rule (4.1), S28 as a `/login` variant, `OtpField`.
5. **platforms-and-connections-ui**: callback outcome uses `?error=<code>` not raw message; add backend env dependency (redirect URIs) to the task list as a blocking prerequisite.
6. **premium-payment-ui**: 30-minute freshness rule for the "newest payment" fallback; price is not displayable (GAP).
7. **admin-console-ui**: audit table shows `actorId` only (GAP: no actor names); `AdminTabs` route-based.

### 6.2 Backend gaps the UI cannot fill (do not fake)

- Google sign-in (no routes). Resend-OTP (none). Price/currency before payment (not returned). Per-post execution history (no `postId` filter on `GET /executions`). Publishing statistics (no endpoint; derived from `meta.total`). Actor name/email in audit logs. Field-level validation errors (single joined string). Per-platform character limits. Attempt-by-attempt history. Post editing (`PATCH /posts/:id` absent). Scheduled publishing (not in MVP).
- Behavioural quirks to design around: publish accepts `EXPIRED` connections; the global rate-limiter 429 body is plain text (not JSON); `DELETE /users/me` is a soft delete (email stays reserved); callback endpoints return JSON, not redirects.

### 6.3 UNVERIFIED items (confirm before building on them)

- `amount` exact string format (Decimal(10,2) serialises as a string; trailing zeros unconfirmed); whether `GenericModalWrapper` traps focus/restores focus; `TextareaField`'s base class literals; `no_content_icon.svg` colours; `@xyflow/react` attribution/licence terms for hiding the watermark; how Node parses `"YYYY-MM-DD HH:mm"` strings sent as `dateFrom`/`dateTo`; whether `AttachmentField` always renders an add tile when one file is held (single-image behaviour is enforced by the composer either way); seeded platform keys are exactly `linkedin` and `facebook` (backend docs say so, V in `docs/manual-testing-guide.md`, but they are data — never hard-code beyond the Facebook page-picker special case).

### 6.4 Alignment with sibling documents

- `docs/api-contract.md` (read at the end of this pass): endpoints, status codes, messages, pagination, upload limits, rate limiters and the payment `verify` quirk agree with this file; where it was stricter (verify only after the gateway redirect, empty Facebook Page list, Page token never expiring, double-submit creating two posts) this file was updated to match. Method + path here come from the backend route files and win on conflict.
- `docs/frontend-architecture.md` also hosts the posts feed on `/dashboard` (consistent with D-UI-1) and follows repo route-group names (consistent with 0.4). Its `useDeletePost` redirect to `/dashboard` matches S09.
- `docs/spec-traceability.md` records the React Flow requirement as added to the executions slice; S13 specifies the component (`WorkflowGraph`) and the fallback.
- Query-key names in 0.3 are descriptive; `frontend-architecture.md` uses a key factory (`posts.lists`, `posts.detail(id)`, ...). Use the factory names in code; the invalidation matrix (4.6) maps one-to-one.
