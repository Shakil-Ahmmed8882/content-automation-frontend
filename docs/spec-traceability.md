# Spec traceability: backend requirements -> frontend plan

Sources: 12 backend OpenSpec changes (`content-automation-backend/openspec/changes/add-*`), `docs/PRD.md`, `docs/data-model.md`.
Frontend changes (abbreviations): **FND** foundation-and-design-system, **SHELL** app-shell-and-marketing, **AUTH** auth-ui, **PROF** user-profile-ui, **CONN** platforms-and-connections-ui, **COMP** post-composer-ui, **EXEC** publish-and-executions-ui, **PAY** premium-payment-ui, **UPC** upcoming-features-ui, **ADM** admin-console-ui.
"(new)" marks a requirement added during this audit to close a gap.

## Backend change tables

### add-credentials-auth (user-auth)

| Backend requirement | Frontend realisation |
|---|---|
| Registration requires email verification | AUTH "Registration with email verification" |
| Email verification completes registration and starts a session | AUTH "Registration with email verification" (OTP step, session seeded) |
| Login with email/password (generic error, blocked refused) | AUTH "Login" |
| Short-lived access + refresh rotation | AUTH "Session bootstrap and refresh"; SHELL "Global rate-limit and session-expiry messaging" (new) |
| Logout | AUTH "Logout"; PROF "Account actions and entry points" (new) |
| Retrieve own profile without secrets | AUTH "Session bootstrap" (`/auth/me`); SHELL "Session-aware navbar" |
| Password reset request avoids enumeration | AUTH "Password recovery" (neutral confirmation) |
| Reset password with valid code | AUTH "Password recovery" |
| Identity model provider-extensible, links by verified email | UI not applicable: backend data model. Provider list shown in PROF "View profile"; AUTH "No unavailable sign-in options" (new) |
| Auth endpoints rate-limited, no secret leaks | AUTH "Rate-limit and error messaging"; SHELL "Consistent API error handling" (new) |

### add-user-profile

| Backend requirement | Frontend realisation |
|---|---|
| View own profile (premium state, providers) | PROF "View profile", "Premium badge" |
| Update editable fields (name; email rejected) | PROF "Edit name"; "Profile mutations ... owner scope" (new: no email/id sent) |
| Upload/replace avatar | PROF "Avatar management" |
| Remove avatar | PROF "Avatar management" (Avatar removed) |
| Change password (credentials accounts only) | PROF "Change password" |
| Delete own account (soft) | PROF "Delete account"; SHELL "Destructive actions require confirmation" (new) |
| Every profile operation owner-scoped | UI not applicable (backend authority); PROF "Profile mutations..." (new) |

### add-social-connections

| Backend requirement | Frontend realisation |
|---|---|
| Start connecting a LIVE platform | CONN "Start an OAuth connection" |
| OAuth callback stores encrypted connection / invalid state rejected | CONN "Handle the provider return" |
| Select Facebook Page | CONN "Facebook Page selection" |
| List connections without tokens | CONN "Platform catalogue with connection status" |
| Disconnect (hard delete; history keeps snapshot) | CONN "Disconnect with confirmation"; EXEC "Outcome copy and history fidelity" (new: snapshot after disconnect) |
| At most one connection per platform | CONN "One connection per platform and downstream refresh" (new); "Expired connection state" (reconnect) |
| Owner-scoped | UI not applicable: backend resolves from session |

### add-platform-catalogue

| Backend requirement | Frontend realisation |
|---|---|
| Admin create platform (unique key) | ADM "Platform management" |
| Admin view/list all incl. inactive | ADM "Platform management" |
| Admin update platform | ADM "Platform management" |
| Admin set logo | ADM "Platform management" (Edit, retire and logo) |
| Retire rather than delete | ADM "Platform management" (no delete); CONN "Retired platforms are not shown" (new) |
| Users list active platforms in order | CONN "Platform catalogue with connection status" |
| Only admins manage | ADM "Admin route guard" |

### add-content-posts

| Backend requirement | Frontend realisation |
|---|---|
| Create post with text + optional image | COMP "Compose a post with validation", "Single image upload rules" |
| List own posts (pagination, search) | COMP "Posts list with infinite scroll" |
| Retrieve one post (owner only) | COMP "Post detail and delete" (Missing post) |
| Soft-delete post | COMP "Post detail and delete"; EXEC "Execution detail" (Deleted post) |
| Posts immutable | COMP "Posts are immutable in the UI" (new) |

### add-publish-execution

| Backend requirement | Frontend realisation |
|---|---|
| Start publishing to selected connected platforms (validations) | EXEC "Publish a post now"; "Publish validation parity" (new) |
| Background execution (202, leave the page) | EXEC "Live execution progress"; '"You can leave this page" feedback' (new) |
| One publication per platform (account snapshot) | EXEC "Execution detail"; "Outcome copy and history fidelity" (new) |
| Attempts ledger / external reference / failure reason | EXEC "Execution detail", "Result feedback" (latest attempt only; non-goal documented) |
| Overall status computed | EXEC "Status badges", "Live execution progress", "Visible read-only workflow" (new) |
| Owner-scoped, no secrets | UI not applicable (backend); SHELL "Consistent API error handling" (new) |

### add-execution-history

| Backend requirement | Frontend realisation |
|---|---|
| List executions (pagination, status/date filter) | EXEC "Executions history" |
| Per-platform detail, failed platforms identifiable | EXEC "Execution detail", "Retry failed publications" (retryable) |
| Owner-scoped, sanitized reasons, content visible after post delete | EXEC "Execution detail" (Deleted post, Unknown execution) |

### add-publication-retry

| Backend requirement | Frontend realisation |
|---|---|
| Retry a failed publication | EXEC "Retry failed publications" |
| Only failed can be retried | EXEC "Retry failed publications" (Nothing to retry) |
| Rebind to current connection / refuse without | EXEC "Retry failed publications" (Retry needs a connection); "Retry after reconnecting" (new) |
| Execution retry only failed platforms | EXEC "Retry failed publications" (execution-level) |
| Owner-scoped, manual only | UI not applicable (backend); EXEC has no auto-retry |

### add-premium-payment

| Backend requirement | Frontend realisation |
|---|---|
| Start premium payment | PAY "Start a premium payment", "Double-submit protection" |
| Server-side verification before premium | PAY "Handle bKash return on success page", "Premium state refresh"; "Premium confirmation feedback" (new) |
| Idempotent activation | PAY "Idempotent return handling" (new) |
| Check payment status | PAY "Failure and cancel states", "Payment detail" |
| Owner-scoped, no secrets | PAY "Payment detail" (404); "Gateway outcomes include non-success history" (new) |

### add-payment-history

| Backend requirement | Frontend realisation |
|---|---|
| List own payments newest first, incl. failed/cancelled, status filter | PAY "Payment history list"; "Gateway outcomes include non-success history" (new) |
| Owner-scoped, no secrets | UI not applicable (backend); PAY detail shows only public fields |

### add-upcoming-features

| Backend requirement | Frontend realisation |
|---|---|
| Admin manage upcoming features | ADM "Upcoming features management" |
| Admin set feature image | ADM "Upcoming features management" (Image upload) |
| Premium users browse catalogue / by slug | UPC "Feature card list", "Feature detail", "Premium identity on the page" (new) |
| Non-premium denied (403) | UPC "Non-premium gate"; SHELL "Premium gating is a UX hint" (new) |
| Only admins manage | ADM "Admin route guard" |

### add-admin-audit

| Backend requirement | Frontend realisation |
|---|---|
| Admin list/view users | ADM "User management" |
| Block/unblock | ADM "User management" (confirm); AUTH "Login" (blocked message) |
| Super-admin role change | ADM "User management" (SUPER_ADMIN only) |
| Grant/revoke premium | ADM "User management" |
| Append-only audit log | UI not applicable: written by backend; ADM "Audit log viewer" has no edit/delete |
| Review audit log (filters) | ADM "Audit log viewer" |
| Admin restricted, no secrets | ADM "Admin route guard"; "Loading, empty and error states" (403 handling) |

## PRD section coverage

| PRD section | Frontend coverage |
|---|---|
| 1-4 Product, goals, user, journey | SHELL marketing + dashboard; whole plan |
| 5 Routes / sidebar | SHELL "Protected app routes", "Dashboard sidebar" |
| 6 Authentication | AUTH. Google OAuth (6.2): backend has no route -> deferred; AUTH "No unavailable sign-in options" (new) |
| 7 Profile + crown badge | PROF "View profile", "Premium badge"; SHELL "Dashboard shows ... premium crown" (new) |
| 8 Social connections | CONN |
| 9 Content creation | COMP |
| 10 Publishing + feedback | EXEC "Publish a post now", feedback requirements (new) |
| 11 / 26 Workflow, React Flow | EXEC "Visible read-only workflow" (new; was missing entirely) |
| 12 Background execution | EXEC "Live execution progress", leave-page feedback (new) |
| 13 Retry | EXEC "Retry failed publications" |
| 14 Execution history | EXEC "Executions history", "Execution detail" |
| 15 Payment | PAY |
| 16-17 Premium / upcoming features | UPC, ADM |
| 18 API surface | Each change's proposal lists consumed endpoints |
| 19 Data model | backend-only |
| 20 Frontend requirements (dashboard, create, connections, executions, profile, upcoming) | SHELL (dashboard widgets new), COMP, CONN, EXEC, PROF (account hub new), UPC |
| 21 UX requirements / feedback copy | SHELL cross-cutting (new); EXEC outcome copy (new); PAY success copy (new) |
| 22 Error handling | SHELL "Consistent API error handling and feedback" (new) |
| 23 Security | backend-only except SHELL "Premium gating..." (new), AUTH cookies-only, no tokens in client |
| 24-25, 27-29 Job architecture, engine, providers, future | backend-only / roadmap (UPC displays roadmap) |
| 30 Acceptance criteria | Auth, connections, content, publishing, workflow (new), history, payment, upcoming all mapped above |
| 31-35 Order, rules, DoD, definition | process; frontend tasks end with verify clauses |
| Cross-cutting NFR: loading/empty/error, a11y, responsive, confirmation, session expiry, global 429, validation parity | SHELL (new requirements 8-9 task groups); per-change loading/empty/error already present |

## Gaps found and how they were closed

1. React Flow workflow (PRD 11, 26, acceptance "Workflow") missing -> EXEC requirement + tasks 5b + design D7 + proposal; dependency to be logged.
2. Dashboard lacked connected platforms, recent executions, crown beside identity (PRD 7, 20) -> SHELL requirement + tasks 8.
3. No cross-cutting requirements (error normalisation, global 429, session-expiry, destructive confirmation, premium gating, a11y, responsive, validation parity) -> SHELL requirements + tasks 9.
4. PRD feedback copy ("You can leave this page", partial-success wording, welcome-to-Premium) -> EXEC / PAY requirements and tasks.
5. Publish validation parity, snapshot-after-disconnect, reconnect-then-retry not specified -> EXEC requirements.
6. Idempotent payment return/reload and failed/cancelled history not specified -> PAY requirements.
7. Immutable posts, double-submit and unsaved-work protection -> COMP requirements.
8. One-connection-per-platform, retired platforms, consumer refresh -> CONN requirements.
9. Profile lacked Logout and billing entry points (PRD 20) -> PROF requirements.
10. Google auth (PRD 6.2, MVP goal 3) has no backend route: not buildable; explicit "no fake button" requirement and decision log entry -> AUTH. Open item: revisit when backend ships it.
11. Crown "Premium" heading on Upcoming Features page -> UPC requirement.
