## Why

Publishing is asynchronous: `POST /posts/:id/publish` returns 202 and a background worker does the
work (PRD §10). Users need to trigger it, watch per-platform progress, understand failures, retry
only what failed, and review history (PRD §11–§14). This change is the UI for that whole lifecycle.

## What Changes

- **Publish Now:** a `PublishButton` / panel on post detail (`/posts/[id]`, handed `?publish=<keys>`
  by `post-composer-ui`) that calls `POST /posts/:id/publish { platforms }` and moves to the live
  execution view.
- **Live status:** the execution detail page polls `GET /executions/:id` every ~3 s while status is
  `PENDING`/`RUNNING`, showing per-platform publication status, and stops at a terminal state.
- **Feedback:** toasts on start, and on completion (success / partial / failed) with a result summary
  and external post links.
- **Executions history** (`/executions`): paginated list with status and date filters; detail page
  `/executions/[id]` with per-platform result, failure reason, retry count, external URL.
- **Retry:** per publication (`POST /publications/:id/retry`) and whole execution
  (`POST /executions/:id/retry`), shown only for failed items; resumes polling.
- **Workflow visualization (PRD sections 11 and 26):** read-only React Flow graph START -> PREPARE CONTENT ->
  LinkedIn/Facebook -> END on the execution page, node colours driven by live statuses (adds `@xyflow/react`).
- **Feedback copy (PRD sections 10.2 and 21):** "Publishing started. You can leave this page." and PRD outcome wording.
- **Status badges:** shared `ExecutionStatusBadge` / `PublicationStatusBadge`.

## Capabilities

### New Capabilities
- `executions-ui`: starting a publish, live progress, result feedback, history, detail and retry.

### Modified Capabilities
<!-- None. Fills the publish slot defined by post-composer-ui. -->

## Impact

- **Backend endpoints consumed** (`src/app/module/execution/execution.route.ts`; mounts in
  `src/app.ts`: `/api/v1/posts`, `/api/v1/publications`, `/api/v1/executions`):
  - `POST /api/v1/posts/:id/publish` body `{platforms: string[]}` (min 1, deduped) -> **202**
    `{executionId,status:"PENDING"}`; 404 post not found; 400 "Connect X before publishing to it" /
    "X is not available to publish to yet" / unknown platform 404.
  - `GET /api/v1/executions?page&limit&sort&status&dateFrom&dateTo` — sort `createdAt|startedAt|
    completedAt` (`-` = desc, default `-createdAt`); rows `{id,status,startedAt,completedAt,createdAt,
    post:{id,title,contentPreview(140)},platforms:[{key,name,status}]}` + `meta`.
  - `GET /api/v1/executions/:id` -> `{id,status,startedAt,completedAt,createdAt,post:{id,title,content,
    imageUrl,isDeleted},publications:[{id,platform:{key,name},platformAccountName,status,externalPostId,
    externalPostUrl,publishedAt,failureReason,retryable,retryCount}]}`.
  - `POST /api/v1/publications/:id/retry` -> 202 `{executionId,publicationId}`; 400 if not FAILED or
    platform reconnect needed.
  - `POST /api/v1/executions/:id/retry` -> 202 `{executionId,retried}`; 400 if nothing failed.
- **Enums (verified `prisma/schema/enums.prisma`):** execution `PENDING|RUNNING|COMPLETED|
  PARTIALLY_COMPLETED|FAILED`; publication `PENDING|RUNNING|SUCCESS|FAILED`. The API returns only the
  latest attempt (`failureReason`, `retryCount`); there is no attempts-list endpoint.
- **Frontend:** `src/api/execution.ts`, `src/hooks/useExecutions.ts`, `src/app/(dashboard)/executions/**`,
  publish components under `src/components/executions/`.
- **Reuse:** `pagination/Pagination`, `tabs`, `modal/veriations/DeleteConfirmModal` (as confirm),
  `placeholder/skeletons`, `placeholder/no-results-found-wrapper`, `date-time`/`dates` pickers for filters.

## Non-goals

- Scheduled publishing, cancel, or websocket/SSE push (polling only).
- Attempt-by-attempt timeline (API exposes the latest attempt only).
- Editing a post or composing (`post-composer-ui`); connecting accounts (`platforms-and-connections-ui`).
