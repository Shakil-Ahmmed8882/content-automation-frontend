## 1. Scaffold

- [x] 1.1 Create the Next.js 16 app (TypeScript, Tailwind v4, Biome, React Compiler, bun); verify `bun run dev` serves 200 on `/`.
- [x] 1.2 Install the data/UI dependencies and log them in `docs/decisions.md`; verify install is clean.
- [x] 1.3 Add `lib/apiClient.ts`, query provider, toaster provider, `.env.example`; verify the root layout wraps providers.

## 2. Design system

- [x] 2.1 Translate the design file into dark tokens in `globals.css` (surfaces, text, semantic, gradient, radius, shadows, type scale); verify the page renders dark.
- [x] 2.2 Load Geist / Geist Mono; configure `components.json` (shadcn new-york); verify fonts apply.
- [x] 2.3 Add button `pill` sizes and the `mesh-gradient` / `eyebrow` utilities; verify hero renders the gradient.

## 3. Reusable UI blocks

- [x] 3.1 Copy `reusable-ui-blocks` and required shadcn primitives from the sibling project (source read-only); verify files exist.
- [x] 3.2 Resolve compile errors (i18n shim, trimmed errors, removed roles constants, react-day-picker v9); verify `tsc --noEmit` is clean.
- [x] 3.3 Format with Biome and scope lint overrides to copied folders; verify `biome check` is clean.

## 4. Brand and home page

- [x] 4.1 Create the logo mark, favicon, and platform icons from one glyph; verify the tab icon and header match.
- [x] 4.2 Build header (desktop + mobile menu), footer, and home sections; verify in the browser at 1440px and 390px with a clean console.

## 5. Docs and planning

- [x] 5.1 Write `CLAUDE.md`, `README.md`, `docs/decisions.md`, OpenSpec `config.yaml`; verify they reference real paths.
- [x] 5.2 Plan the ten OpenSpec changes; verify `openspec validate --strict` passes for each.
- [x] 5.3 Production build passes; verify `bun run build` exits 0.
