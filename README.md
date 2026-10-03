# Content Automation — Frontend

Write a post once, publish it to **LinkedIn** and **Facebook Pages**, and track every publish.
This is the web client for the [Content Automation backend](https://github.com/Shakil-Ahmmed8882/content-automation-backend).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui ·
TanStack Query · ofetch · react-hook-form + zod · Biome · bun

**Design:** a fully dark theme built on a Vercel-inspired design system
(`src/design-system/vercel-design-system.md`, tokens in `src/app/globals.css`).

## Getting started

```bash
bun install
cp .env.example .env.local   # point NEXT_PUBLIC_API_BASE_URL at your backend
bun run dev                  # http://localhost:3000
```

| Script | What it does |
|---|---|
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run lint` | Biome check |
| `npx tsc --noEmit` | Type check |

## Project layout

```
src/
├─ app/                    routes — (public)/(marketing), (public)/(authentication), (dashboard)
├─ api/                    one thin ofetch function per endpoint
├─ hooks/                  TanStack Query hooks (query keys + invalidation)
├─ components/
│  ├─ reusable-ui-blocks/  shared building blocks (buttons, forms, modals, pagination, dates…)
│  ├─ ui/                  shadcn primitives
│  ├─ brand/ layout/ modules/
├─ design-system/          design source of truth
├─ lib/ providers/ routes/ types/ validation/ utils/
openspec/                  spec-driven plans — one change per product slice
docs/decisions.md          why each dependency / decision exists
```

## Roadmap

Built slice by slice from `openspec/changes/`:
foundation → app shell → auth → profile → connections → post composer → publish &
executions → premium payment → upcoming features → admin console.

Run `openspec list` to see them, and read `CLAUDE.md` for the conventions.
