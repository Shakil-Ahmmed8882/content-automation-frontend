## Why

Users must link their LinkedIn and Facebook Page accounts before they can publish anything
(PRD §8 platforms, §9.3 "connected account must exist"). The backend already exposes the platform
catalogue and the full OAuth connection lifecycle; this change builds the `/connections` page that
drives it and gives the composer (`post-composer-ui`) the list of connected platforms it needs.

## What Changes

- **Connections page** (`/connections`, session required): platform catalogue cards merged with the
  user's connection status — Connected (account name), Expired, Not connected, Coming soon.
- **Connect flow:** `GET /connections/:platform/connect` returns `{ authUrl }`; the browser is sent to
  the provider. Return handling is a new frontend route `/connections/callback/[platform]` (see
  design D1 — the backend callback returns JSON, it does NOT redirect).
- **Facebook Page selection:** when the callback answers `kind: "select-page"`, show a Page picker
  (`GET /connections/facebook/pages`, `POST /connections/facebook/select-page { pageId }`).
- **Disconnect:** `DELETE /connections/:platform` behind a confirm modal.
- **Shared hooks:** `usePlatforms()`, `useConnections()`, `useConnectedPlatformKeys()` for other pages.

## Capabilities

### New Capabilities
- `connections-ui`: browsing platforms, connecting/disconnecting LinkedIn and Facebook, selecting a
  Facebook Page, and showing connected / expired / error states.

### Modified Capabilities
<!-- None. -->

## Impact

- **Backend endpoints consumed** (envelope `{success,statusCode,message,data,meta?}`,
  `src/app/utils/sendResponse.ts`):
  - `GET /api/v1/platforms` (`platform.route.ts`, auth) -> `Platform[]` {id,key,name,logoUrl,status
    LIVE|COMING_SOON,isActive,sortOrder}, active only, sorted by sortOrder.
  - `GET /api/v1/connections` (`connection.route.ts`) -> `{id,platform:{key,name},platformAccountName,
    status CONNECTED|EXPIRED,expiresAt,createdAt}[]`; tokens never returned.
  - `GET /connections/:platform/connect` -> `{authUrl}`; 400 if platform not LIVE, 501 if no connector.
  - `GET /connections/:platform/callback?code&state` (no auth) -> `{kind:"connected",connection}` or
    `{kind:"select-page",pages:[{id,name}]}`; 400 on invalid/expired state (10 min TTL) or missing code.
  - `GET /connections/facebook/pages` -> `{id,name}[]`; 400 if no selection in progress.
  - `POST /connections/facebook/select-page` body `{pageId}` -> connection.
  - `DELETE /connections/:platform` -> `data: null`; 404 if not connected.
- **Frontend:** `src/api/platform.ts`, `src/api/connection.ts`, `src/hooks/useConnections.ts`,
  `src/app/(dashboard)/connections/**`, callback route, types in `src/types`.
- **Reuse:** `modal/veriations/DeleteConfirmModal`, `images/BaseImage`, `placeholder/skeletons/CardSkeletons`,
  `placeholder/no-results-found-wrapper`.
- **Backend config dependency (no code change):** provider redirect URIs (`LINKEDIN_REDIRECT_URI`,
  `FACEBOOK_REDIRECT_URI`, also registered in the provider consoles) must point at the frontend
  callback route.

## Non-goals

- Admin platform management (`admin-console-ui`).
- Adding platforms beyond LinkedIn/Facebook; token refresh UI (backend exposes none).
- Publishing (`publish-and-executions-ui`).
