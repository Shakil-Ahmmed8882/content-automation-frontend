## 1. Types, API and hooks (vertical slice)

- [ ] 1.1 Add `src/types/platform.ts` and `connection.ts` (Platform, Connection, CallbackResult union `connected | select-page`) plus the envelope type; verify `tsc` passes and fields match `connection.service.ts` `toPublicConnection`.
- [ ] 1.2 Add `src/api/platform.ts` (`getPlatforms`) and `src/api/connection.ts` (list, startConnect, callback, listFacebookPages, selectFacebookPage, disconnect) using the shared ofetch client with credentials; verify each call returns data in the browser network panel.
- [ ] 1.3 Add `src/hooks/usePlatforms.ts`, `useConnections.ts` (queries + mutations invalidating `["connections"]`) and `useConnectedPlatformKeys()` for the composer; verify a mutation refreshes the list.

## 2. Connections page (vertical slice)

- [ ] 2.1 Create the `/connections` route under the authenticated layout with a page header; verify an unauthenticated visit redirects to login.
- [ ] 2.2 Build `PlatformCard` with `BaseImage` logo and a status badge (Connected / Expired / Not connected / Coming soon) merged by `platform.key`; verify all four states using seeded data.
- [ ] 2.3 Add loading, empty and error states with `CardSkeletons` and `NoResultFoundWrapper` plus retry; verify by throttling and by stopping the backend.

## 3. Connect and callback (vertical slice)

- [ ] 3.1 Connect button calls `startConnect` and sets `window.location` to `authUrl`; show backend 400/501 messages as toasts; verify redirect to the provider consent screen.
- [ ] 3.2 Add `/connections/callback/[platform]/page.tsx`: read `code`/`state`/`error`, fire the callback mutation once (ref guard), show a "Finishing connection..." state; verify no double call under React strict mode.
- [ ] 3.3 Route outcomes: `connected` -> toast + `/connections`; `select-page` -> `/connections?select=facebook`; error/denial -> `/connections` with error banner; verify each path with a tampered state and a denied consent.
- [ ] 3.4 Set backend `LINKEDIN_REDIRECT_URI` / `FACEBOOK_REDIRECT_URI` to `<FRONTEND_URL>/connections/callback/<platform>` and register them in the provider consoles; log it in `docs/decisions.md`; verify a real LinkedIn round trip lands on the connected card.

## 4. Facebook Page picker (vertical slice)

- [ ] 4.1 Build `FacebookPagePicker` modal (radio list, confirm) opened by `?select=facebook`; fetch pages on open; verify the list renders and survives a refresh.
- [ ] 4.2 Submit `selectFacebookPage({ pageId })`, close the modal, clean the query string, show the Page name on the card; verify the card updates.
- [ ] 4.3 Handle the 400 "no selection in progress" case with an expired message and Connect action; verify by clearing the stash or waiting out the TTL.

## 5. Disconnect and expired state (vertical slice)

- [ ] 5.1 Wire `DeleteConfirmModal` to `disconnect(platformKey)` with pending state and toasts; verify confirm removes the connection and cancel does not.
- [ ] 5.2 Add the Expired badge plus Reconnect action reusing the connect flow; verify with a connection whose `expiresAt` is in the past.

## 5b. Consistency

- [ ] 5b.1 Invalidate `["connections"]` consumers after connect/reconnect/disconnect and render one card per platform key; verify composer targets update without reload and a reconnect leaves a single card.
- [ ] 5b.2 Verify retired (inactive) platforms never render (seed one, deactivate via admin); verify it is absent from the page and the composer.

## 6. Integration

- [ ] 6.1 Make `useConnectedPlatformKeys()` return key and status so `post-composer-ui` can decide how to treat EXPIRED; verify it is exported and typed.
- [ ] 6.2 Check dark-theme styling against `src/design-system/vercel-design-system.md` at mobile and desktop widths; verify visually with Playwriter.
- [ ] 6.3 Run `bun run check` and `tsc --noEmit`; verify both pass, then run connect -> select page -> disconnect end to end.
