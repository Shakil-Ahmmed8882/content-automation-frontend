# Decisions

- Implemented the profile data flow as `component -> hook -> apiClient`, using `/users/me` for profile detail and `/auth/me` only through the existing session cache.
- Kept profile and session caches synchronized after profile mutations by writing the returned profile to `["profile"]` and projecting it into `["session"]`.
- Sent only backend-authorized owner-scoped requests: no user id, no email on name update, and no client-side token handling.
- Added avatar client pre-checks for `image/*` and 5 MB before uploading multipart data with the `avatar` field.
- Split the profile UI into focused feature components under `src/components/modules/profile/`: page composition, state views, shared presentation, identity/avatar, account/premium, password, session, and danger-zone flows.
- Rebuilt account deletion with `MultipageModal`: the danger zone only shows a trigger, the first modal page contains the warning and typed `DELETE` confirmation, and the outcome pages reuse the shared success/error variation. A short redirect delay lets the success outcome render before clearing caches and navigating home.
- Did not add dependencies.

## Blockers

- Browser and real-session verification are reserved for the orchestrator by the worker contract, so network-tab checks, premium/non-premium account checks, and real login/delete scenarios were not run here.
