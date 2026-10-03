## Context

See `proposal.md`. Execution status is a cache of its publications (`execution.worker.ts`: any
pending/running -> RUNNING; all success -> COMPLETED; mixed -> PARTIALLY_COMPLETED; all failed ->
FAILED; a retry can flip PARTIALLY_COMPLETED -> COMPLETED). Publish and retry only enqueue work and
return 202, so the UI must poll to learn the outcome.

## Goals / Non-Goals

**Goals:** trustworthy live progress, clear failure reasons, one-click retry of just what failed.
**Non-Goals:** push transport, scheduling, per-attempt history.

## Decisions

### D1: Polling with TanStack Query `refetchInterval`
`useExecution(id)` sets `refetchInterval: (q) => active(q.state.data?.status) ? 3000 : false`, where
active = `PENDING|RUNNING`. Pause when the tab is hidden (`refetchIntervalInBackground: false`).
Stop on terminal status and fire the completion toast exactly once (compare previous to next status
in an effect with a ref). Back off to 5 s after 60 s; after 5 min show "Taking longer than expected"
with a manual Refresh (worker may be down).

### D2: Handoff from the composer
`/posts/[id]?publish=linkedin,facebook` pre-checks the platforms in the `PublishPanel`; the user
still confirms (no auto-publish on page load — avoids accidental repeats on refresh). Panel
targets come from `useConnections()`; submit calls `publishPost(postId, platforms)`, then
`router.push("/executions/<executionId>")`. The `?publish` param is cleared on submit.

### D3: Status vocabulary and badges
Map backend enums to user labels and colours in one `status.ts`: PENDING "Queued" (neutral), RUNNING
"Publishing" (blue, animated), COMPLETED / SUCCESS "Published" (green), PARTIALLY_COMPLETED "Partial"
(amber), FAILED "Failed" (red). Never use colour alone; include text/icon.

### D4: Retry rules from the API, not guesses
Show Retry only when `publication.retryable` (status FAILED). Execution-level Retry shows when any
publication is retryable; label with the count. After a 202, optimistically set the affected
publications to `PENDING`, invalidate `["execution", id]` and `["executions"]`, and resume polling.
A 400 "Connect X before retrying" links to `/connections`.

### D5: History list uses page pagination
`/executions` uses `Pagination` (not infinite scroll) because filters (status tabs, dateFrom/dateTo)
and totals matter. Filters live in URL search params so views are shareable and survive refresh.

### D6: Soft-deleted posts
Detail's `post.isDeleted` true -> show a "Post deleted" note; content remains readable (history is
preserved by the backend).

## Risks / Trade-offs

- **Polling load** (300 req / 15 min / IP rate limit, `app.ts`). -> 3 s polling of one visible execution is ~300 per 15 min, so back off to 5 s (D1), pause when hidden, and keep other queries unpolled.
- **Duplicate publishes** on double click. -> Disable the button while pending; keys deduped by backend.
- **Stale status after retry.** -> Optimistic PENDING + invalidation (D4).

## Migration Plan

1. API/hooks/status mapping. 2. Execution detail with polling. 3. Publish panel + handoff.
4. History list + filters. 5. Retry. 6. End-to-end with real LinkedIn/Facebook.
