## 1. Route groups & layouts

- [ ] 1.1 Create `(marketing)`, `(auth)`, `(app)` route groups with their layouts and move foundation skeleton pages in; verify `/`, `/login`, `/dashboard` still resolve with flat URLs.
- [ ] 1.2 Add `src/routes` typed route constants and `navItems` config (label, href, icon, `visible(user)`); verify the config type-checks and is the only place paths are defined.

## 2. Session consumption

- [ ] 2.1 Consume `useSession()` from `auth-ui` (stub returning guest until it lands); verify the shell compiles against the hook contract (`GET /auth/me` user shape).
- [ ] 2.2 Implement `AuthGuard` (loading skeleton, redirect to `/login?next=`); verify in browser a guest is redirected and a signed-in user is not.

## 3. Navbar & footer

- [ ] 3.1 Build shared `Navbar` with guest actions, signed-in Dashboard button, avatar menu (BaseAvatar) and loading placeholder; verify all three states in browser.
- [ ] 3.2 Build `Footer` with product/legal link columns; verify links and layout at 375px and 1280px.

## 4. Marketing home

- [ ] 4.1 Hero with CSS mesh gradient, framer-motion fade-in, headline, BaseButton CTAs; verify contrast and that the CTA targets `/register`.
- [ ] 4.2 Features section (LinkedIn, Facebook Page, write once, scheduling teaser) as a card grid; verify the grid collapses to one column on mobile.
- [ ] 4.3 How-it-works section (connect, write, publish, track); verify step order and numbering.
- [ ] 4.4 Pricing/premium teaser and final CTA with session-aware link target; verify guest goes to `/register`, signed-in goes to `/payment`.
- [ ] 4.5 Page metadata (title, description, OG basics); verify via page source.

## 5. Dashboard shell

- [ ] 5.1 Build `Sidebar` from `navItems` with active state; verify highlight follows the route.
- [ ] 5.2 Apply visibility predicates (Upcoming Features premium only, Upgrade non-premium only); verify with one premium and one non-premium account.
- [ ] 5.3 Mobile drawer and `AppTopbar` (menu button, avatar menu); verify open/close and focus handling at 375px.
- [ ] 5.4 Wire Logout in the avatar menu to the `auth-ui` logout hook; verify it ends at `/` with guest nav.

## 6. Dashboard overview

- [ ] 6.1 Welcome header and premium status card from the session user; verify name and badge match `/auth/me`.
- [ ] 6.2 Quick-link cards with empty states (NoResultFoundWrapper); verify links route correctly.

## 7. Fallback states

- [ ] 7.1 `not-found.tsx` per group with context-aware home link; verify an unknown URL as guest and as signed-in.
- [ ] 7.2 `error.tsx` using `CustomErrorBoundary` with retry; verify by forcing a throw on a dev-only page.
- [ ] 7.3 `loading.tsx` skeletons per group using the skeleton blocks; verify via network throttling.

## 8. Dashboard widgets & crown

- [ ] 8.1 Connected-platforms widget from `useConnections()` and recent-executions widget from `GET /executions?limit=5` (hooks owned by their changes; stub until they land), each with skeleton/empty/error+retry; verify each state independently.
- [ ] 8.2 Crown "Premium" badge beside the avatar name in navbar menu and sidebar user area, premium only; verify with premium and non-premium accounts.

## 9. Cross-cutting UX/NFR

- [ ] 9.1 Add `ApiError` normalisation in `lib/apiClient.ts` (message, status, field details) and a `lib/errors` helper mapping to toasts/inline states; verify a 400 with fields, a 500 and a network failure each render the right message with no raw body.
- [ ] 9.2 Global 429 handling (message, pause polling/retries, manual retry) and session-expired toast + redirect with `next`; verify by mocking 429 on a data call and by deleting cookies mid-session.
- [ ] 9.3 Shared confirmation pattern wrapper over `DeleteConfirmModal` (target name, Cancel default focus) and a checklist of every destructive action using it; verify cancel sends no request.
- [ ] 9.4 Accessibility pass (focus rings, labels/aria-live errors, icon-button names, modal focus trap/return, reduced motion); verify a keyboard-only walkthrough of sidebar, a form and a modal.
- [ ] 9.5 Responsive pass at 360/375/768/1280 px for shell and marketing, tables degrade inside containers; verify no horizontal page scroll.
- [ ] 9.6 Publish a `src/validation` parity table (rule -> backend file) in `docs/decisions.md` and check each schema against it; verify mismatches are fixed.
- [ ] 9.7 Premium-gating helper reading `isPremium` from session only, refetching session on 403 from premium endpoints; verify the stale-flag scenario.

## 10. Integration

- [ ] 10.1 Run `bun run check` and `tsc --noEmit`; verify both pass.
- [ ] 10.2 Log new decisions (route groups, client-side guard, mesh gradient) in `docs/decisions.md`; verify entries exist.
- [ ] 10.3 Playwriter pass: guest, non-premium, premium walkthrough against the local backend; verify every spec scenario.
