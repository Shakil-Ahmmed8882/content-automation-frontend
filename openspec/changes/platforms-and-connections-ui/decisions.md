## Decisions

- Kept the frozen shared hook contract in `src/hooks/connection.hook.ts`: `connectionQueryKey`, `platformQueryKey`, `useConnections()`, and `usePlatforms()` remain exported with the required shapes.
- Added `src/types/platform.type.ts` for the platform catalogue while re-exporting `Platform` from `src/types/connection.type.ts` so existing imports keep working.
- Kept `listPlatforms` as a compatibility re-export from `connection.api.ts`; new code imports `getPlatforms` from `platform.api.ts`.
- `useConnectedPlatformKeys()` returns active, LIVE platform connections only, with shape `{ key, name, status, accountName }`; `EXPIRED` is included so downstream UI can block or prompt reconnect.
- The OAuth callback is a client handler with a ref guard, not a query, so the single-use `code`/`state` pair is submitted once under React strict mode.
- The Facebook Page picker uses the required `MultipageModal` and fetches `["fb-pages"]` on open so a refresh can resume while the backend Redis stash is valid.
- Error banners use safe error codes in the URL (`cancelled`, `invalid-state`, `failed`); backend messages are shown via toast at the time of the failed API call.

## Deviations

- Browser/network verification, Playwriter visual verification, and full live OAuth were not run in this worker because the task explicitly reserves dev server/browser orchestration for the coordinator.
- `bun run check`, `bun run build`, and `next build` were not run because this worker was explicitly forbidden to run them. Required local validation was limited to `npx tsc --noEmit --incremental false` and the scoped Biome command.

## Blockers

- B-01: Live LinkedIn/Facebook OAuth cannot be completed until a human registers frontend redirect URIs in the provider consoles and backend env. Required values:
  - `LINKEDIN_REDIRECT_URI=<FRONTEND_URL>/connections/callback/linkedin`
  - `FACEBOOK_REDIRECT_URI=<FRONTEND_URL>/connections/callback/facebook`
  - For local `FRONTEND_URL=http://localhost:3000`, register `http://localhost:3000/connections/callback/linkedin` and `http://localhost:3000/connections/callback/facebook`.
