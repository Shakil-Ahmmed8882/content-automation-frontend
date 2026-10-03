# Decisions

- Kept the existing file names (`execution.type.ts`, `execution.api.ts`, `execution.hook.ts`, `status.ts`) to match the repository convention and the W4 ownership contract, even where the original OpenSpec task text used shorter names.
- `PublishPanel` is standalone at `src/components/modules/executions/PublishPanel.tsx` and fetches the post content via `GET /posts/:id` so it can enforce the "no empty post" publish disable state while only receiving `postId`.
- Publish is never automatic: `?publish=` only pre-selects connected platforms; the user must press **Publish now**.
- The execution detail completion toast fires only after an observed active-to-terminal transition, so reopening an already finished execution does not duplicate a completion toast.
- `@xyflow/react` was already present in `package.json` and is used only by `WorkflowGraph`; no dependency was added by W4.
- The workflow graph hides React Flow attribution with `proOptions.hideAttribution`, uses semantic CSS variables for node styles, and keeps per-platform result cards as the accessible text equivalent.
- Date filtering reuses the shared date filter utilities, then maps `start_date`/`end_date` to the executions API contract's `dateFrom`/`dateTo` query params.
- The `/executions` row click navigates to `/executions/<id>`. A global sidebar/nav entry was not added because W4 must not edit layout/navigation-owned files.

## Deviations

- OpenSpec references logging the React Flow dependency in `docs/decisions.md`, but W4's editable docs boundary only includes this change's `decisions.md`. The dependency decision is recorded here for integration.
- Browser/network verification and visual 375px checks were not run because the W4 instructions explicitly forbid browser/Playwriter and dev/build commands.

## Blockers

- B-01/B-02: A live publish run needs real LinkedIn/Facebook connections. Those require provider-console redirect URIs and a human OAuth consent click. To verify end-to-end, a human must connect/reconnect live LinkedIn and Facebook Page accounts, then run Save & publish -> post detail handoff -> Publish now -> execution detail -> forced failure/retry -> history.
