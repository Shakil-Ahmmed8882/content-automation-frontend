# Drawer

A smooth, controllable slide-in panel built on framer-motion + a portal. Slides
in from any side, fades in step with the slide, owns its own scroll, and works
exactly like a mini page router when you need more than one screen.

```tsx
import { Drawer } from "@/components/reusable-ui-blocks/overlays/drawer";
```

## 1. The simplest case (controlled open state)

You own a boolean; the drawer mirrors it.

```tsx
const [open, setOpen] = useState(false);

<button onClick={() => setOpen(true)}>Open</button>

<Drawer open={open} onOpenChange={setOpen} initialPageId="main">
  <Drawer.Page id="main">
    <YourContent />
  </Drawer.Page>
</Drawer>
```

- The **trigger is anything** — it lives outside the drawer. Just flip the boolean.
- `onOpenChange(false)` fires on Esc, backdrop click, or the close button — wire it to your setter.
- Every visible page must be a **direct `Drawer.Page`** child (or inside a plain wrapper/provider — it's found recursively).

## 2. Controlling it from inside (close after an API call, etc.)

Any descendant reads the controls from context — no prop drilling:

```tsx
import { useDrawerSelector } from "@/components/reusable-ui-blocks/overlays/drawer";

function SaveButton() {
  const { close } = useDrawerSelector();
  const onSave = async () => {
    await api.save();
    close();               // close the drawer once the request resolves
  };
  return <button onClick={onSave}>Save</button>;
}
```

`useDrawerSelector()` gives you: `open`, `goTo`, `goBack`, `close`, `isOpen`,
`currentPageId`, `canGoBack`, `direction`, `getPayload`.

## 3. Multi-page (like MultipageModal)

Add more `Drawer.Page`s and navigate by id. Only the active page renders; the
panel cross-fades between them. `backTitle` shows a back button on that page.

```tsx
<Drawer open={open} onOpenChange={setOpen} initialPageId="list">
  <Drawer.Page id="list">
    <List />                                {/* a row calls goTo("detail", row) */}
  </Drawer.Page>
  <Drawer.Page id="detail" backTitle="Back">
    <Detail />
  </Drawer.Page>
</Drawer>

// inside List:
const { goTo } = useDrawerSelector();
goTo("detail", { id: row.id });            // optional payload

// inside Detail:
import { useDrawerPayload } from "@/components/reusable-ui-blocks/overlays/drawer";
const payload = useDrawerPayload<{ id: number }>("detail");
```

`goBack()` pops a page (or closes if it's the only one). `close()` clears everything.

## 4. Sizing (responsive, mobile = full by default)

`width` accepts a preset, any CSS length, or a per-breakpoint object.

```tsx
<Drawer width="half" />                              // FULL on mobile, half from sm up
<Drawer width="third" />                             // FULL on mobile, 1/3 from sm up
<Drawer width="480px" />                             // FULL on mobile, 480px from sm up
<Drawer width="full" />                              // full everywhere
<Drawer width={{ base: "full", md: "half", xl: "third" }} />  // explicit per breakpoint
```

Presets: `"third" | "half" | "twoThird" | "full"`. Breakpoints: `base | sm | md | lg | xl`
(Tailwind defaults). A single value is mobile-first: small screens get `full`,
the value applies from `sm` up. `width` maps to width for `left`/`right`, height
for `top`/`bottom`.

## 5. Other props

| Prop                  | Default   | Notes                                                             |
| --------------------- | --------- | ----------------------------------------------------------------- |
| `side`                | `"right"` | `"left" \| "right" \| "top" \| "bottom"` — which edge it slides from |
| `overlay`             | `"dim"`   | `"dim"` (bg-black/40), `"blur"`, or any className string          |
| `closeOnOverlayClick` | `true`    | Backdrop click closes                                             |
| `duration`            | `0.3`     | Open/close seconds — lower is snappier                            |
| `scroll`              | `true`    | Drawer owns vertical scroll (scrollbar at the panel's right edge) |
| `className`           | —         | Extra classes on the panel                                       |
| `controller`          | —         | Pass a `useDrawer()` instance to drive it externally             |

## 6. Scroll + sticky content

When `scroll` is true (default), the **drawer owns the scroll**, so children can
use `position: sticky` freely — a sticky top bar and a sticky bottom action bar
both pin to the panel. Lay the page out as a plain vertical flow:

```tsx
<Drawer.Page id="main">
  <div className="flex min-h-full flex-col">        {/* NOT h-full / flex-1 / min-h-0 */}
    <div className="px-6 pt-16 pb-4">…title…</div>   {/* scrolls away; pt-16 clears close btn */}
    <div className="sticky top-0 z-20 bg-white …">…search bar…</div>
    <div className="px-6 py-4">…long list…</div>
    <div className="sticky bottom-0 z-20 mt-auto bg-white …">…Save…</div>
  </div>
</Drawer.Page>
```

Sticky elements need an opaque `bg-*` and a `z-` below the close button (which is `z-40`).
Do **not** put `overflow`/`h-full`/`min-h-0`/`flex-1` on the page root or a wrapper —
that creates a second scroll container and silently breaks `position: sticky`.

## 7. Uncontrolled / external controller

Skip `open`/`onOpenChange` and drive it purely through the controls, or share one
controller across trigger and drawer:

```tsx
const drawer = useDrawer({ initialPageId: "main" });
<button onClick={() => drawer.open("main")}>Open</button>
<Drawer controller={drawer}>
  <Drawer.Page id="main"><Content /></Drawer.Page>
</Drawer>
```

## Notes

- Portalled to `document.body` at a very high z-index — floats above everything,
  never affected by parent `overflow`/`transform`.
- Scroll-lock keeps the page scrollbar visible (no layout shake on open).
- Respects `prefers-reduced-motion` (collapses to a near-instant fade).
- Animation knobs live in `utils/drawerVariants.ts`: `ENTER_OFFSET` / `EXIT_OFFSET`
  (slide distance) and `DRAWER_DEFAULT_DURATION` (speed).
```
