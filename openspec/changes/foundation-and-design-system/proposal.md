## Why

Every later slice needs the same base: a running Next.js app, one dark design language, the data-fetching
layers, and the reusable UI blocks already working. Setting it up once — and verifying it in the browser —
removes guesswork from the ten feature slices that follow.

## What Changes

- **Scaffold:** Next.js 16 (App Router, React Compiler), TypeScript, Tailwind v4, Biome, bun; L7-style folders
  (`api`, `hooks`, `routes`, `types`, `validation`, `providers`, `lib`, `utils`).
- **Design system:** Vercel-inspired tokens (`src/design-system/vercel-design-system.md`) applied as a fully
  dark theme in `globals.css`; Geist + Geist Mono; shadcn `new-york` (radix) configured.
- **Reusable UI blocks:** `components/reusable-ui-blocks` and the shadcn primitives they need, copied from the
  sibling project and adapted to compile and lint here (single-locale i18n shim, trimmed `lib/errors`).
- **Data layer:** `lib/apiClient.ts` (ofetch, `credentials: "include"`), TanStack Query provider, toaster.
- **Brand + shell skeleton:** logo mark = favicon, header, footer, and a marketing home page that exercises the tokens.
- **Project docs:** `CLAUDE.md`, `README.md`, `docs/decisions.md`, `.env.example`, OpenSpec config + ten planned changes.

## Capabilities

### New Capabilities
- `design-system`: the dark Vercel-inspired token set, typography, elevation, brand assets, and the rule that UI uses tokens only.
- `project-foundation`: the runnable scaffold, folder conventions, data-layer plumbing, and reusable UI block library.

### Modified Capabilities
<!-- None. -->

## Non-goals

- Authentication, session handling, dashboard shell, and any backend-connected feature (later changes).
- Light theme or a theme toggle.
- i18n beyond the English shim.

## Impact

- Everything under `src/` is created here; later changes extend it by composition.
- Depends on nothing; every other change depends on this one.
- Backend: none consumed yet (only `NEXT_PUBLIC_API_BASE_URL` is defined for later slices).
