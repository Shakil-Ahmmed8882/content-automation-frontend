## 1. Types, API, hooks and status mapping (vertical slice)

- [ ] 1.1 Add `src/types/execution.ts` (ExecutionStatus, PublicationStatus, list row, detail, publication) matching `execution.service.ts` `list`/`getDetail`; verify `tsc` passes.
- [ ] 1.2 Add `src/api/execution.ts`: `publishPost`, `getExecutions(params)`, `getExecution(id)`, `retryPublication(id)`, `retryExecution(id)` with the shared ofetch client; verify each against the local backend in the network panel.
- [ ] 1.3 Add `src/lib/executionStatus.ts` (label, tone, `isActive`) and `ExecutionStatusBadge` / `PublicationStatusBadge` using text plus icon; verify all five labels render correctly.
- [ ] 1.4 Add `src/hooks/useExecutions.ts`: `useExecutions(params)`, `useExecution(id)` with `refetchInterval` while active (3 s, back-off, paused when hidden), `usePublishPost`, `useRetry*` with invalidation; verify polling stops at a terminal status.

## 2. Publish Now (vertical slice)

- [ ] 2.1 Build `PublishPanel` on `/posts/[id]` with platform checkboxes from `useConnections()`, pre-selected from `?publish=`, and a Publish Now button disabled while pending; verify there is no auto-publish on load or refresh.
- [ ] 2.2 On success toast "Publishing started", clear the query param and `router.push("/executions/<id>")`; show backend 400/404 messages and a `/connections` link for missing connections; verify success and an unconnected-platform failure.

## 3. Execution detail and live status (vertical slice)

- [ ] 3.1 Build `/executions/[id]` showing post content/image, overall badge, timings and per-platform rows (account name, badge, published time, external link); verify with a real execution.
- [ ] 3.2 Wire polling UI: live badge updates, "taking longer than expected" notice after 5 min with manual Refresh; verify by watching a run progress without reload.
- [ ] 3.3 Fire a single completion toast (COMPLETED / PARTIAL / FAILED) with success links and failure reasons, guarded by a previous-status ref; verify no duplicate toasts on refetch.
- [ ] 3.4 Handle 404 not-found and `post.isDeleted` note; verify both states.

## 4. Retry (vertical slice)

- [ ] 4.1 Add per-platform Retry (only when `retryable`) with optimistic PENDING, invalidation and resumed polling; verify only the failed platform re-runs.
- [ ] 4.2 Add execution-level "Retry N failed" button and 400 handling ("Connect X before retrying" -> `/connections`); verify with a forced failure and a disconnected platform.

## 5. Executions history (vertical slice)

- [ ] 5.1 Build `/executions` list with `Pagination`, rows (title/preview, platform status chips, overall badge, times) and skeleton, empty, error states; verify with more than one page.
- [ ] 5.2 Add status filter (`tabs`) and date range filter stored in URL search params, mapped to `status`, `dateFrom`, `dateTo`; verify filters survive refresh and sort is `-createdAt`.
- [ ] 5.3 Row click navigates to detail; add nav entry for Executions; verify navigation and the session guard.

## 6. Integration

- [ ] 6.1 Verify the handoff with `post-composer-ui`: Save & publish -> post detail with pre-selected platforms -> publish -> live execution; log the contract in `docs/decisions.md`.
- [ ] 6.2 Check dark-theme styling per `src/design-system/vercel-design-system.md` at mobile and desktop widths; verify visually with Playwriter.
- [ ] 6.3 Run `bun run check` and `tsc --noEmit`; verify both pass, then run publish -> fail -> retry -> history end to end.
