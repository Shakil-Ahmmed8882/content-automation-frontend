## Context

The design file supplied is light-first; the product is dark-only. The UI block library comes from a sibling
project with different coupling (i18n, error layer, domain icons). Full rationale and dependency table:
`docs/decisions.md` (D1–D9).

## Decisions

- **D1 Dark by polarity flip.** Use the system's own dark-band rule globally: surfaces `#0a0a0a → #111 → #171717`,
  CTA becomes a white pill on ink, hairlines `white/10`, stacked shadows plus an inset white hairline.
  *Why:* stays faithful to the source system and gives one place (`globals.css`) to tune.
- **D2 Tokens, not hex.** Components use semantic Tailwind tokens (`bg-card`, `text-muted-foreground`, `shadow-card`).
  *Why:* consistency across navbar, cards, forms, and footer is automatic.
- **D3 Two button scales.** In-app = 6px radius; marketing CTAs = `size="pill"`. The design system forbids mixing
  them on one screen, so the shell uses 6px and the home page hero uses pills.
- **D4 Copy blocks, adapt minimally.** Keep the copied library structurally identical; adapt only what cannot
  compile (i18n shim, trimmed `lib/errors`, removed roles constants) and relax lint for those folders only.
- **D5 shadcn radix style.** Matches the copied primitives; avoids two component dialects.
- **D6 One brand glyph** shared by `public/logo.svg`, `app/icon.svg`, and `components/brand/Logo.tsx`.

## Risks / Trade-offs

- Copied blocks carry source-project assumptions → mitigated by `tsc` + `build` gate and by extending via composition only.
- `react-day-picker` pinned to v9 (v10 breaks the copied calendar) → revisit when the calendar is reworked.
- Dark-only is simpler but forecloses a theme toggle → acceptable for MVP.
