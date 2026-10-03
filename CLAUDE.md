# CLAUDE.md — Content Automation Platform (Frontend)

Frontend for "write once → publish to LinkedIn + Facebook Page". Consumes the existing backend;
**the backend is the single source of truth** — never invent an endpoint, field, or status.
Next.js 16 (App Router, React 19, React Compiler) · TypeScript · Tailwind v4 · shadcn/ui (radix) ·
TanStack Query · ofetch · react-hook-form + zod · framer-motion · Biome · bun.

**Read before non-trivial work (pointers, not inlined):**
- Backend repo `../content-automation-backend`: `docs/PRD.md` (what), `docs/data-model.md` (schema),
  `src/app.ts` + `src/app/module/*/*.route.ts` (real endpoints), `docs/postman` (examples).
  Live API: see `.env.example` (`NEXT_PUBLIC_API_BASE_URL`).
- `openspec/changes/*` — the planned vertical slices (build in the order listed below).
- `src/design-system/vercel-design-system.md` — design source; `src/app/globals.css` — the dark tokens.
- `docs/decisions.md` — why every dependency / non-trivial choice exists.

## Build order (OpenSpec changes — one slice at a time, never the whole app)
1 `foundation-and-design-system` → 2 `app-shell-and-marketing` → 3 `auth-ui` → 4 `user-profile-ui` →
5 `platforms-and-connections-ui` → 6 `post-composer-ui` → 7 `publish-and-executions-ui` →
8 `premium-payment-ui` → 9 `upcoming-features-ui` → 10 `admin-console-ui`.
Flow per slice: `/opsx:apply <name>` → verify in the browser → review the code → next.

## Architecture — data flow (never skip a layer)

```
component → hook (TanStack Query) → api function (ofetch) → backend
```

- `src/api/<name>.api.ts` — one thin function per endpoint, returns the typed payload. No React.
- `src/hooks/<name>.hook.ts` — `useQuery`/`useMutation` wrappers; owns query keys + invalidation.
- `src/components/modules/<feature>/` — feature UI; `components/layout/` — shells; `components/form/` — forms.
- `src/types/`, `src/validation/` (zod), `src/routes/` (nav config), `src/providers/`, `src/lib/`, `src/utils/`.
- Route groups under `src/app/`: `(public)/(marketing)`, `(public)/(authentication)`, `(dashboard)` (guarded).

## Hard rules (MUST)

1. **Reuse before you build.** UI primitives come from `src/components/reusable-ui-blocks` (BaseButton,
   BaseImage, BaseAvatar, form fields, TimePicker, CalendarModal, MultipageModal, infinite scroll,
   Pagination, skeletons, NoResultFoundWrapper) and `src/components/ui` (shadcn). Never rebuild one.
   Add shadcn components with `bunx shadcn@latest add <name>` (style `new-york`, radix).
2. **Dark only, tokens only.** Style with the semantic tokens in `globals.css` (`bg-background`,
   `bg-card`, `text-muted-foreground`, `border-border`, `shadow-card`…). No raw hex, no `bg-black`/`text-white`,
   no new accent colour. In-app buttons are 6px radius; marketing CTAs use `size="pill"`.
3. **Typography:** weight ≤ 600, headlines sentence-case with negative tracking (`tracking-[-0.04em]`),
   eyebrows/labels use `.eyebrow` (mono). Body text never mono.
4. **Backend-authoritative.** Auth is httpOnly cookies — never store/read tokens in JS, never trust a
   client flag for premium/role. `credentials: "include"` is already set in `lib/apiClient.ts`.
5. **Env only via `process.env.NEXT_PUBLIC_*` read in `lib/` / `config`** — never hard-code URLs.
6. **Every async view has loading, empty, and error states** (use the skeleton/no-results blocks).
7. **Forms:** react-hook-form + zod (`src/validation`), reusable form fields; show server error messages.
8. **No fake functionality.** If the backend doesn't expose it, don't mock it — show a clear "coming soon" or omit.
9. **Next.js 16 differs from older docs** — read the matching guide in `node_modules/next/dist/docs/`
   before using a Next API (middleware is `proxy.ts`, `LayoutProps`/`PageProps` helpers, async `params`).
10. **No AI attribution in git, ever.** No `Co-Authored-By`, no "Generated with…", no assistant mentions in
    commits, PRs, code comments or docs. Use `.claude/skills/cmd-git-organize` before every push:
    logical Conventional Commits, `--no-verify` for intermediate commits, one verified final commit.
11. **Log every new dependency and non-trivial decision in `docs/decisions.md`, as you make it.**

## Conventions

- Files: `kebab-case` for hooks/api/routes (`auth.hook.ts`), `PascalCase.tsx` for components.
- Imports use the `@/` alias; Biome sorts them (`bun run lint`, `bun run format`).
- Server components by default; add `"use client"` only where state/effects/handlers need it.
- Prefer early returns over nested conditionals; no `any`; types live in `src/types`.
- Don't edit `reusable-ui-blocks` for feature needs — extend by composition; fix genuine bugs in place and log it.

## Commands

```
bun run dev        # http://localhost:3000 (backend CORS allows it)
bun run build      # production build — must pass before a slice is "done"
bun run lint       # biome check
npx tsc --noEmit   # typecheck
openspec list      # planned changes
```

## Verification (per slice)
Run the app, exercise the flow against the live/local backend in the browser (Playwriter), check the
console is clean, then `bun run lint` + `npx tsc --noEmit` + `bun run build`.
