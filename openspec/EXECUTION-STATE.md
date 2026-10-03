# Execution state — parallel spec delivery

Resume checkpoint for the frontend OpenSpec build. Update this file whenever a work
unit changes state. If work is interrupted, start here, then verify against the
repository before redoing anything.

Last updated: 2026-10-03, end of session 1 (parallel slices 4 → 7). All four workers
finished; what remains is the orchestrator's browser-verification pass.

## Module status

| # | Spec (openspec/changes/…) | Owner | State |
|---|---------------------------|-------|-------|
| 1 | `foundation-and-design-system` | — | DONE (verified, 14/14 tasks) |
| 2 | `app-shell-and-marketing` | — | DONE in code (marketing home, dashboard shell, session nav); tasks.md checkboxes never ticked |
| 3 | `auth-ui` | — | DONE (23/23 tasks) |
| 4 | `user-profile-ui` | W1-PROFILE | CODE COMPLETE (18/21) — remaining 3 are the browser pass |
| 5 | `platforms-and-connections-ui` | W2-CONN | CODE COMPLETE (17/20) — remaining 3 are the browser pass + live OAuth (B-01) |
| 6 | `post-composer-ui` | W3-POST | CODE COMPLETE (16/18) — remaining 2 are the browser pass |
| 7 | `publish-and-executions-ui` | W4-EXEC | CODE COMPLETE (21/25) — remaining 4 are the browser pass + live publish (B-02) |
| 8 | `premium-payment-ui` | — | NOT STARTED (`/payment`, `/payment/history` are placeholders) |
| 9 | `upcoming-features-ui` | — | NOT STARTED |
| 10 | `admin-console-ui` | — | NOT STARTED |

## What was verified in the browser before the session ended

Logged in as the demo account at `http://localhost:3000` against the local backend:

- Login with the prefilled demo credentials works; session guard lands on `/dashboard`.
- Dashboard renders real data: "Welcome back, Demo Creator", connected-platforms widget
  showing LinkedIn (Demo Creator) and Facebook Page (Demo Creator Page), recent-executions
  widget showing the seeded failed run, and the new posts library listing the 14 seeded posts
  with search.
- `/posts/[id]` loads with the publish panel wired in.

NOT yet verified in the browser (do this first on resume): `/profile` (all five flows incl.
the MultipageModal delete), `/connections` (states, disconnect, Page picker), `/create`
(image, targets, preview, save + save & publish), `/executions` and `/executions/[id]`
(polling, workflow graph, retry), plus the 375px pass and a `bun run build`.

## Integration already done

- `PublishPanel` is wired into `/posts/[id]` (`PostDetailView.tsx`), replacing the placeholder.
- Removed W4's duplicate post fetch (`usePublishablePost` / `getPublishablePost` /
  `publishablePostQueryKey` / `PublishablePost`); the panel now reuses `usePost` from
  `post.hook.ts`, so the detail page fetches the post once.
- Both files re-checked clean with Biome.

## Known follow-ups (not yet done)

- `WorkflowGraph` uses a hardcoded `aria-labelledby="workflow-title"` id — fine today
  (one graph per page) but should be a `useId` if it is ever rendered twice.
- Per-spec `decisions.md` files under each `openspec/changes/<spec>/` still need merging
  into `docs/decisions.md` (D19–D22 for the orchestration choices are already written).
- `app-shell-and-marketing/tasks.md` checkboxes are still unticked even though the code exists;
  tick them only after verifying each item.

## File ownership (no two workers share a file)

**W1-PROFILE** — `src/types/user.type.ts`, `src/validation/user.validation.ts`,
`src/api/user.api.ts`, `src/hooks/user.hook.ts`,
`src/components/modules/profile/**`, `src/app/(dashboard)/profile/**`

**W2-CONN** — `src/types/connection.type.ts`, `src/types/platform.type.ts`,
`src/api/connection.api.ts`, `src/api/platform.api.ts`, `src/hooks/connection.hook.ts`,
`src/components/modules/connections/**`, `src/app/(dashboard)/connections/**`

**W3-POST** — `src/types/post.type.ts`, `src/validation/post.validation.ts`,
`src/api/post.api.ts`, `src/hooks/post.hook.ts`, `src/components/modules/posts/**`,
`src/components/modules/dashboard/**`, `src/app/(dashboard)/create/**`,
`src/app/(dashboard)/posts/**`, `src/app/(dashboard)/dashboard/**`

**W4-EXEC** — `src/types/execution.type.ts`, `src/api/execution.api.ts`,
`src/hooks/execution.hook.ts`, `src/lib/status.ts`,
`src/components/modules/executions/**`, `src/app/(dashboard)/executions/**`

**Orchestrator only** — `package.json`, `bun.lock`, `docs/**`, `src/routes/**`,
`src/lib/apiClient.ts`, `src/providers/**`, `src/app/globals.css`,
`src/components/layout/**`, `src/components/modules/shared/**`,
`src/components/reusable-ui-blocks/**`, `src/components/ui/**`, all git operations.

## Frozen cross-worker contracts

1. `src/hooks/connection.hook.ts` (owned by W2) keeps exporting
   `useConnections()` → `UseQueryResult<Connection[]>`, `usePlatforms()` →
   `UseQueryResult<Platform[]>`, `connectionQueryKey = ["connections"]`,
   `platformQueryKey = ["platforms"]`, and adds
   `useConnectedPlatformKeys()` → `{ key, name, status: "CONNECTED" | "EXPIRED", accountName: string | null }[]`.
   W3 and W4 consume these; they never edit the file.
2. `src/types/connection.type.ts` (owned by W2): `Connection` and `Platform` may gain
   fields, never lose or rename them.
3. `src/lib/status.ts` (owned by W4): the existing `executionStatus` record
   (`label`, `tone` per status) must keep working — the dashboard widgets import it.
4. Publish slot: W3 renders a marked placeholder in `/posts/[id]`; W4 ships
   `src/components/modules/executions/PublishPanel.tsx` exporting
   `PublishPanel({ postId }: { postId: string })`, which reads `?publish=` itself.
   The orchestrator wires the two together during integration.
5. Shared route constants already exist in `src/routes/app.routes.ts`
   (`posts`, `postDetail(id)`, `connectionCallback(platform)`, `executionDetail(id)`,
   `paymentHistory`). Workers use them and do not edit the file.

## Local environment

- Backend API: `http://localhost:5000/api/v1` (matches `.env.local`).
- Local Postgres (port 5433) and the portable Redis are started from the backend repo.
- `content-automation-backend/scripts/dev-local-redis.ts` is a temporary dev entry:
  the committed `.env` points `REDIS_*` at a Render-internal host and sends a
  2-argument `AUTH` that the portable Redis 5 rejects. Start with
  `npx tsx watch scripts/dev-local-redis.ts`. Delete the script once `.env`
  carries working local Redis defaults.

### Verification fixtures (local dev database)

Created so every slice can be verified without a human OAuth consent:

- Demo account `demo@content-automation.test` / `Demo-posts-2026!` — matches the
  `NEXT_PUBLIC_DEMO_*` values in `.env.local`, so the demo-login button works.
- 14 posts (two pages at the default limit of 10) for list, search, pagination
  and detail verification.
- `scripts/seed-demo-connections.ts` (temporary) gives the demo user a CONNECTED
  LinkedIn connection and an EXPIRED Facebook Page connection with dummy tokens,
  so the connections page, composer targets and status badges are all reachable.
- One real execution (`FAILED`, publication `retryable: true`,
  reason "LinkedIn rejected the access token — reconnect LinkedIn and retry")
  produced by an actual publish run through the BullMQ worker, for verifying the
  execution detail, failure copy and retry UI.
- The seeded platform table also contains an inactive platform, which must never
  render in the UI.

## Blockers (do not stop other work)

- B-01 — Real LinkedIn / Facebook OAuth round trip needs provider console redirect
  URIs plus a human consent click. Connection UI is built and verifiable with seeded
  data; the live round trip stays unverified until the account owner runs it.
- B-02 — Real publishing to LinkedIn / Facebook requires a live connection (B-01),
  so execution runs can only be verified against seeded/failed executions locally.

## Next actions

1. Restart the environment (see below), then run the browser pass for slices 4–7 and tick the
   remaining `tasks.md` boxes.
2. Run `bun run build` (not yet run this session — `npx tsc --noEmit` passed clean across the
   whole project with all four slices integrated).
3. Merge each `openspec/changes/<spec>/decisions.md` into `docs/decisions.md`.
4. Commit in logical slices using `.claude/skills/cmd-git-organize` (nothing has been committed
   this session — all work is uncommitted in the working tree).
5. Continue with `premium-payment-ui`, then `upcoming-features-ui`, then `admin-console-ui`.

## How to restart the environment after a shutdown

In the backend repo (`content-automation-backend`), three things must be up, in order:

```powershell
# 1. Postgres (dev instance on port 5433)
npm run devdb:start

# 2. Redis (portable, no password — run it in its own window and leave it running)
cd .devdb\redis-portable ; .\redis-server.exe .\redis.windows.conf --port 6379

# 3. API (uses the temporary local-Redis entry, NOT `npm run dev`)
npx tsx watch scripts/dev-local-redis.ts
```

Then in the frontend repo: `bun run dev` (http://localhost:3000).
Check the API is alive with `http://localhost:5000/api/v1/platforms` — a **401** means the
server is up and auth-guarded, which is the expected response without a session cookie.

Log in with the demo account (`demo@content-automation.test` / `Demo-posts-2026!`); the login
form prefills it. If the dev database is ever reset, re-seed with: register + verify through
the API (the OTP is returned in the response because `EXPOSE_OTP_IN_RESPONSE=true`), then
`npx tsx scripts/seed-demo-connections.ts`.
