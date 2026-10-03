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
