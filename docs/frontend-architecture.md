# Frontend architecture — how the UI reacts to and calls the backend

Build-ready blueprint for the ten OpenSpec slices. Planning only: nothing here is implemented yet.
Companion docs (do not duplicate, link instead):

- [`api-contract.md`](./api-contract.md) — endpoint-by-endpoint request/response shapes, enums, status codes.
- [`ui-spec.md`](./ui-spec.md) — screens, copy, visual states, design-token usage.
- [`decisions.md`](./decisions.md) — decision log. Every item in section 0.3 below must be logged there when built (CLAUDE.md rule 11).

Sources read for this document: frontend `CLAUDE.md`, `docs/decisions.md`, `openspec/config.yaml` and all ten
`openspec/changes/*/{design,tasks}.md`, `src/lib/apiClient.ts`, `src/providers`, `src/components/reusable-ui-blocks`;
the L7 PH-Healthcare foundation (`src/{api,hooks,lib,providers,routes,types,validation,components/auth}`);
the backend (`src/app.ts`, `middleware/*`, `utils/sendResponse.ts`, `utils/appError.ts`, `module/auth/*`, `config/index.ts`,
`lib/multer.ts`, route files, `docs/decisions.md`, `docs/PRD.md` sections 20-31); Next 16 docs in
`node_modules/next/dist/docs/01-app`. Anything not confirmed in code or docs is marked **UNVERIFIED**.

---

## 0. Terms, ground rules, reconciliation

### 0.1 Terms (shared with `api-contract.md` / `ui-spec.md`)

| Term | Meaning |
|---|---|
| **Envelope** | Backend success body `{ success, statusCode, message, data, meta? }` (`utils/sendResponse.ts`). `meta` = `{ page, limit, total, totalPages }`, only on paginated lists. |
| **Error envelope** | Backend failure body `{ success:false, statusCode, message, name, error?, stack? }` (`middleware/globalErrorHandler.ts`). `error`/`stack` only when `NODE_ENV=development`. There is **no** structured field-error array today (see 3.4). |
| **ApiError** | The one typed error class the frontend throws (section 3). Not to be confused with `lib/errors` `AppError` (copied from the sibling project, used by `ActionResult`). |
| **Session** | The signed-in user as returned by `GET /auth/me`, held in TanStack Query under `qk.session()`. There is no other auth store. |
| **Guest** | Session query resolved with `null` (a 401 that survived the refresh attempt). |
| **Slice** | One OpenSpec change. "Owner" = the slice that creates the file. |
| **Core** | Cross-cutting plumbing needed before `auth-ui` (ApiError, envelope unwrapping, query keys, env, state components). Recommended to land as a new task group 6 appended to `foundation-and-design-system` (that change is otherwise complete), or as the first task group of `app-shell-and-marketing`. Marked `core` in the inventory. |

### 0.2 Ground rules (restating CLAUDE.md so this file is self-contained)

1. Layering is never skipped: `component -> hook -> api function -> apiClient (ofetch) -> backend`.
2. The backend is authoritative for identity, role, premium, ownership. The client uses `isPremium`/`role` only to choose what to render.
3. Tokens never touch JS. All requests go through `lib/apiClient.ts`; no component calls `fetch`/`ofetch` directly.
4. Every async view has loading, empty and error states (section 10).
5. Dark tokens only; the copied blocks have light-mode leftovers (section 10.4) that must be fixed in place and logged.

### 0.3 Reconciliation: planning docs vs. actual repo (decide once, then follow this file)

| # | Drift | Resolution used in this blueprint |
|---|---|---|
| R1 | `app-shell-and-marketing` names route groups `(marketing) (auth) (app)`; the repo and CLAUDE.md use `(public)/(marketing)`, `(public)/(authentication)`, `(dashboard)`. | Follow the repo. URLs stay flat. |
| R2 | OpenSpec tasks name files `src/api/auth.ts`, `src/hooks/usePosts.ts`, `src/hooks/user/*`; CLAUDE.md says `src/api/<name>.api.ts`, `src/hooks/<name>.hook.ts` (kebab-case), and L7 does the same. | CLAUDE.md / L7 naming wins (`post.api.ts`, `post.hook.ts`). Update the task texts when applying each slice. |
| R3 | OpenSpec uses literal keys `["session"]`, `["execution", id]`, `["executions"]`. | Replaced by the key factory `qk` (section 4); prefixes are compatible (`["executions"]` still prefixes every execution key). |
| R4 | Tasks say `bun run check`; `package.json` has no `check` or `typecheck` script. | Add `"check": "biome check"` and `"typecheck": "tsc --noEmit"`; log it. |
| R5 | `app-shell` design D2 says "no server-side auth middleware". | Client `AuthGuard` stays the authority. An *optional* `proxy.ts` optimistic pre-check is added only in same-origin-cookie mode (section 5.2). |
| R6 | `useOptimisticListMutation` expects `mutationFn` to return `ActionResult<T>` (no throw). Our api layer throws `ApiError`. | Use the `toActionResult()` adapter (section 4.3) only for list optimistics where a toast is enough; write plain `useMutation` + `onMutate` when the caller needs `ApiError.status`. |
| R7 | `Pagination` block expects meta `{current_page,last_page,per_page,total}`; backend sends `{page,limit,total,totalPages}`. | `toPaginationMeta()` adapter (section 7). |
| R8 | `prepareImage.ts` comments describe the sibling project's 2 MB / Laravel rules, but it takes `maxBytes` as a parameter. | Parametrise with our limits (section 8); do not fork. |
| R9 | Backend PRD s.22 shows `errorDetails` / "structured field-level details". The implemented handler returns none. | Frontend parses the joined message string (section 3.4); keep `fieldErrors` slot in `ApiError` for when the backend adds them. |
| R10 | `auth-ui` lists Google auth as a non-goal; backend has `lib/googleAuth.ts` and `GOOGLE_CLIENT_ID` but **no** `/auth/google` route is mounted in `auth.route.ts`. | Out of scope; no Google button. |
| R11 | PRD s.26 requires a React Flow read-only workflow graph on the execution view; no OpenSpec slice and no `reactflow` dependency exist. | Open question Q9 (section 14). Not in this blueprint's inventory. |

---

## 1. Layered data flow, with a worked example

```
Component (client)            renders states, owns UI-only state (modals, tabs, form drafts)
   |  calls
Hook  src/hooks/*.hook.ts     TanStack Query useQuery/useMutation; owns key choice (qk.*) + invalidation + toasts
   |  calls
API   src/api/*.api.ts        one thin async function per endpoint; typed in/out; NO React, NO cache knowledge
   |  calls
apiClient  src/lib/apiClient.ts   ofetch instance + envelope unwrap + ApiError + 401->refresh->retry-once
   |  HTTP (cookies via credentials:"include")
Backend  /api/v1/*            sendResponse envelope / globalErrorHandler envelope
```

Who may import whom: components -> hooks (and types); hooks -> api, `lib/queryKeys`, `lib/toast`; api -> `lib/apiClient`, types;
nothing below a layer imports upward. `queryClient` is reached inside hooks via `useQueryClient()`, never imported as a module singleton
(except `lib/session-events` consumer in `SessionProvider`).

### 1.1 Shared types (`src/types/api.type.ts`)

```ts
export interface PageMeta { page: number; limit: number; total: number; totalPages: number }
export interface ApiEnvelope<T> {
  success: boolean; statusCode: number; message: string; data: T; meta?: PageMeta;
}
export interface Paged<T> { items: T[]; meta: PageMeta }
```

### 1.2 Worked query: connections list (also the source of composer targets)

```ts
// src/types/connection.type.ts
export type ConnectionStatus = "CONNECTED" | "EXPIRED";            // verify against api-contract.md
export interface Connection {
  id: string; platform: { key: string; name: string };
  status: ConnectionStatus; accountName: string | null; expiresAt: string | null;
}

// src/api/connection.api.ts   (no React, returns the unwrapped payload)
import { api } from "@/lib/apiClient";
import type { Connection } from "@/types";

export const getConnections = () => api.get<Connection[]>("/connections");

// src/hooks/connection.hook.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getConnections } from "@/api";
import { qk } from "@/lib/queryKeys";

export const useConnections = () =>
  useQuery({ queryKey: qk.connections.list(), queryFn: getConnections, staleTime: 30_000 });

export const useConnectedPlatformKeys = () => {
  const q = useConnections();
  return { ...q, keys: q.data?.filter((c) => c.status === "CONNECTED").map((c) => c.platform.key) ?? [] };
};

// src/components/modules/connections/ConnectionsList.tsx   (component: states only, no fetching logic)
"use client";
export function ConnectionsList() {
  const q = useConnections();
  return (
    <QueryBoundary query={q} skeleton={<CardSkeletonV2List count={2} />} isEmpty={(d) => d.length === 0}
      empty={{ title: "Nothing connected yet", message: "Connect LinkedIn or Facebook to publish." }}>
      {(connections) => connections.map((c) => <PlatformCard key={c.id} connection={c} />)}
    </QueryBoundary>
  );
}
```

### 1.3 Worked mutation: create post (multipart + cache + navigation + error mapping)

```ts
// src/validation/post.validation.ts  (mirrors backend post.validation.ts + lib/multer.ts)
export const createPostSchema = z.object({
  title: z.string().trim().optional(),
  content: z.string().trim().min(1, "Content is required"),
  image: imageFileSchema.optional(),                    // from validation/shared.validation.ts (section 8)
});
export type CreatePostValues = z.infer<typeof createPostSchema>;

// src/api/post.api.ts
export const createPost = (values: CreatePostValues) =>
  api.post<Post>("/posts", buildFormData({ title: values.title, content: values.content, image: values.image }));
//   FormData body -> ofetch/fetch sets the multipart boundary. Never set Content-Type manually.

// src/hooks/post.hook.ts
export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation<Post, ApiError, CreatePostValues>({
    mutationFn: createPost,
    onSuccess: (post) => {
      qc.removeQueries({ queryKey: qk.posts.lists() });          // restart infinite lists at page 1 (cheaper than refetching N pages)
      if (post?.id) qc.setQueryData(qk.posts.detail(post.id), post); // only if create returns the full Post (UNVERIFIED, see api-contract.md)
    },
    onError: (e) => toastApiError(e),                             // silent for field-mappable 400s, see 9.3
  });
}

// src/components/modules/posts/PostComposer.tsx (excerpt)
const create = useCreatePost();
const router = useRouter();
<GenericForm schema={createPostSchema} initialValues={{ content: "" }}
  onSubmit={(values) => create.mutate(values, {
    onSuccess: (post) => { toast.success("Draft saved"); router.push(`/posts/${post.id}`); },
  })}>
  <FormAlert error={create.error} />                               {/* form-level server message */}
  <TextField name="title" label="Title" />
  <TextareaField name="content" label="Content" required />
  <SubmitButton loading={create.isPending} />
</GenericForm>
```

What each layer knows: the component knows nothing about FormData, keys or HTTP; the hook knows keys and navigation-free side effects; the api function
knows the path and body encoding; `apiClient` knows cookies, envelope, errors and refresh. Swapping the backend contract touches `api/` and `types/` only.

---

## 2. Folder and file inventory

Legend: `(exists)` already in the repo; `core` = cross-cutting, lands before `auth-ui`; otherwise the owning OpenSpec change is named.
Slice short names: **F** foundation-and-design-system, **shell** app-shell-and-marketing, **auth** auth-ui, **profile** user-profile-ui,
**conn** platforms-and-connections-ui, **composer** post-composer-ui, **exec** publish-and-executions-ui, **pay** premium-payment-ui,
**feat** upcoming-features-ui, **admin** admin-console-ui.

```
content-automation-frontend/
├─ next.config.ts                  rewrites (proxy mode), images.remotePatterns, headers()         core
├─ .env.example                    + API_PROXY_TARGET, NEXT_PUBLIC_SITE_URL (section 13)           core
├─ package.json                    + "check", "typecheck" scripts                                   core
├─ src/
│  ├─ proxy.ts                     OPTIONAL optimistic cookie pre-check (section 5.2)              auth
│  │
│  ├─ app/
│  │  ├─ layout.tsx                (exists) Providers wrap                                          F
│  │  ├─ not-found.tsx             global 404                                                       shell
│  │  ├─ global-error.tsx          last-resort render error                                         shell
│  │  ├─ (public)/
│  │  │  ├─ (marketing)/           layout.tsx, page.tsx (exist)                                     F
│  │  │  ├─ (authentication)/
│  │  │  │  ├─ layout.tsx          centred card + <GuestOnly>                                       auth
│  │  │  │  ├─ login/page.tsx      (exists, skeleton)                                               auth fills
│  │  │  │  ├─ register/page.tsx   (exists, skeleton) two-step register + OTP                      auth fills
│  │  │  │  ├─ forgot-password/page.tsx                                                             auth
│  │  │  │  └─ reset-password/page.tsx                                                              auth
│  │  │  └─ (oauth-return)/connections/callback/[platform]/page.tsx   public group on purpose:
│  │  │                            single-use code must not be lost to a guard redirect (5.4)       conn
│  │  └─ (dashboard)/              guarded group
│  │     ├─ layout.tsx             <AuthGuard><DashboardShell>                                      shell
│  │     ├─ loading.tsx, error.tsx, not-found.tsx                                                   shell
│  │     ├─ dashboard/page.tsx     overview + posts list (infinite scroll)                          shell, composer
│  │     ├─ create/page.tsx                                                                         composer
│  │     ├─ posts/[id]/page.tsx    detail + <PublishPanel/>                                         composer, exec
│  │     ├─ connections/page.tsx                                                                    conn
│  │     ├─ executions/page.tsx, executions/[id]/page.tsx                                           exec
│  │     ├─ profile/page.tsx                                                                        profile
│  │     ├─ payment/page.tsx, payment/success/page.tsx, payment/failure/page.tsx                    pay
│  │     ├─ payment/history/page.tsx, payment/history/[id]/page.tsx                                 pay
│  │     ├─ upcoming-features/page.tsx, upcoming-features/[slug]/page.tsx                           feat
│  │     └─ admin/
│  │        ├─ layout.tsx          <RoleGuard roles={["ADMIN","SUPER_ADMIN"]}> + admin tabs         admin
│  │        ├─ page.tsx            redirect -> /admin/platforms                                     admin
│  │        └─ platforms/ users/ audit-logs/ upcoming-features/  (each page.tsx)                    admin
│  │
│  ├─ api/                         one file per backend module; barrel index.ts
│  │  ├─ index.ts                                                                                   core
│  │  ├─ auth.api.ts               register, verifyEmail, login, logout, refresh*, me, forgot, reset auth
│  │  ├─ user.api.ts               getMe, updateMe, uploadAvatar, removeAvatar, changePassword, deleteMe   profile
│  │  ├─ platform.api.ts           getPlatforms                                                     conn
│  │  ├─ connection.api.ts         list, startConnect, callback, facebookPages, selectPage, disconnect    conn
│  │  ├─ post.api.ts               createPost, getPosts, getPost, deletePost                        composer
│  │  ├─ execution.api.ts          publishPost, getExecutions, getExecution, retryPublication, retryExecution   exec
│  │  ├─ payment.api.ts            create, verify, getPayment, listPayments                         pay
│  │  ├─ upcoming-feature.api.ts   list, getBySlug                                                  feat
│  │  └─ admin/ platform.api.ts, user.api.ts, audit-log.api.ts, upcoming-feature.api.ts           admin
│  │       (* refresh is called only by lib/apiClient, not exported to hooks)
│  │
│  ├─ hooks/                       barrel index.ts
│  │  ├─ auth.hook.ts              useSession, useLogin, useLogout, useRegister, useVerifyEmail,
│  │  │                            useForgotPassword, useResetPassword, useAuthRedirect              auth
│  │  ├─ user.hook.ts              useProfile, useUpdateProfile, useUploadAvatar, useRemoveAvatar,
│  │  │                            useChangePassword, useDeleteAccount                               profile
│  │  ├─ platform.hook.ts, connection.hook.ts  (useConnectedPlatformKeys lives here)                conn
│  │  ├─ post.hook.ts              useInfinitePosts, usePost, useCreatePost, useDeletePost           composer
│  │  ├─ execution.hook.ts         useExecutions, useExecution (polling), usePublishPost, useRetry*  exec
│  │  ├─ payment.hook.ts           useCreatePayment, useVerifyPayment, usePayment, usePaymentHistory pay
│  │  ├─ upcoming-feature.hook.ts  useUpcomingFeatures, useUpcomingFeature                          feat
│  │  ├─ admin/ platform.hook.ts, user.hook.ts, audit-log.hook.ts, upcoming-feature.hook.ts         admin
│  │  ├─ useUrlParams.ts           typed, zod-parsed URL search params + setters (7.3)              core
│  │  ├─ useServerFormErrors.ts    apply ApiError to RHF fields (9.3)                               core
│  │  └─ debounce: reuse components/reusable-ui-blocks/hooks/useDebounce (do not add a second one)
│  │
│  ├─ types/                       barrel index.ts, *.type.ts (L7 convention)
│  │  ├─ api.type.ts (envelope, PageMeta, Paged)                                                    core
│  │  ├─ auth.type.ts (SessionUser, Role, LoginPayload, RegisterPayload, VerifyEmailPayload...)     auth
│  │  ├─ user.type.ts (UserProfile incl. providers)                                                 profile
│  │  ├─ platform.type.ts, connection.type.ts (CallbackResult = connected | select-page)            conn
│  │  ├─ post.type.ts (Post, PostListParams)                                                        composer
│  │  ├─ execution.type.ts (ExecutionStatus, PublicationStatus, row, detail, publication)           exec
│  │  ├─ payment.type.ts (PaymentStatus, Payment, CreatePaymentResult)                              pay
│  │  ├─ upcoming-feature.type.ts                                                                   feat
│  │  ├─ admin.type.ts (AdminUser, AuditLog, filters)                                               admin
│  │  ├─ nav.type.ts (NavItem with visible(user))                                                   shell
│  │  └─ global.type.ts (exists)
│  │
│  ├─ validation/                  zod 4 (z.email etc.), mirrors backend; barrel index.ts
│  │  ├─ shared.validation.ts      IMAGE rules, trimmedString, slugPattern                          profile (first user)
│  │  ├─ auth.validation.ts        register, verifyEmail, login, forgot, reset                      auth
│  │  ├─ user.validation.ts        updateName, changePassword (+confirm)                            profile
│  │  ├─ post.validation.ts        createPost; publishTargets (>=1 key)                             composer
│  │  ├─ payment.validation.ts     verify { paymentId }                                             pay
│  │  └─ admin/ platform.validation.ts, upcoming-feature.validation.ts                              admin
│  │
│  ├─ routes/
│  │  ├─ public.routes.ts          (exists) publicNav, footerColumns                                F
│  │  ├─ paths.ts                  ROUTES constants (the ONLY place paths are written)               shell
│  │  ├─ app.routes.ts            navItems[] with visible(user)                                    shell
│  │  ├─ admin.routes.ts           admin sub-nav                                                    admin
│  │  └─ index.ts                  (exists) re-exports
│  │
│  ├─ providers/
│  │  ├─ index.tsx                 (exists) + <SessionProvider>                                     auth
│  │  ├─ query.provider.tsx        (exists) hardened defaults, Register<ApiError> (4.1)             core
│  │  └─ session.provider.tsx      subscribes to sessionEvents -> resetClientState + redirect       auth
│  │
│  ├─ lib/
│  │  ├─ apiClient.ts              (exists, rewritten) section 3                                    core
│  │  ├─ api-error.ts              ApiError + toApiError + userMessage                              core
│  │  ├─ env.ts                    zod-validated env, static NEXT_PUBLIC_* reads                    core
│  │  ├─ queryKeys.ts              qk factory (section 4)                                           core
│  │  ├─ session-events.ts         tiny emitter: "expired" | "logout"                               auth
│  │  ├─ client-state.ts           resetClientState(qc): clear cache + storage keys                 auth
│  │  ├─ safe-redirect.ts          safeNext(), loginUrl()                                           auth
│  │  ├─ access.ts                 isAdmin, isSuperAdmin, isPremium, hasRole, isSelf                shell
│  │  ├─ toast.ts                  toastApiError(e), toastSuccess                                   core
│  │  ├─ upload-policy.ts          MAX_IMAGE_BYTES, COMPRESS_TARGET_BYTES, ACCEPT                   profile
│  │  ├─ trusted-hosts.ts          allowlists for OAuth/payment redirects, external links           conn
│  │  ├─ executionStatus.ts        label/tone/isActive/isTerminal                                    exec
│  │  ├─ paymentStatus.ts, featureStatus.ts   label/tone maps                                       pay, feat
│  │  ├─ errors/ , i18n/ , utils.ts (exist)                                                         F
│  ├─ config/
│  │  ├─ cache-tags/MODAL_KEYS.ts  (exists)                                                         F
│  │  ├─ polling.config.ts         intervals, caps (section 6)                                      exec
│  │  └─ limits.config.ts          PAGE_SIZE defaults, debounce ms                                  core
│  ├─ utils/
│  │  ├─ build-form-data.ts        skips undefined, appends File/Blob/string                        profile
│  │  ├─ safe-storage.ts           try/catch sessionStorage get/set/remove                          pay
│  │  ├─ format-date.ts, format-money.ts   (money may arrive as Decimal string)                     composer, pay
│  │  └─ safe-url.ts               isSafeHttpUrl() for external links                               exec
│  │
│  └─ components/
│     ├─ auth/
│     │  ├─ AuthGuard.tsx, GuestOnly.tsx, RoleGuard.tsx, AuthLoading.tsx, AccessDenied.tsx          shell (guards) / auth (GuestOnly)
│     │  ├─ Require.tsx            <Require role/premium fallback>  (UI gating helper)              shell
│     │  └─ UpgradeGate.tsx        shared premium gate (used by feat, payment, composer hints)      feat
│     ├─ layout/
│     │  ├─ public/                Header.tsx, Footer.tsx (exist)                                   F
│     │  ├─ dashboard/             DashboardShell, Sidebar, Topbar, MobileDrawer, AvatarMenu         shell
│     │  ├─ auth/                  AuthCard.tsx (page chrome for the (authentication) group)         auth
│     │  └─ states/                QueryBoundary, ErrorState, EmptyState, PageHeader,               core
│     │                            ListFooterStatus (end-of-list / retry-next-page)
│     ├─ dashboard/                /dashboard overview widgets: WelcomeHeader, PremiumStatusCard,
│     │                            QuickLinks, RecentExecutions                                     shell
│     ├─ form/                     feature-level form compositions over reusable form fields
│     │  ├─ FormAlert.tsx (form-level ApiError), PasswordField.tsx, OtpField.tsx                    auth
│     │  └─ ImageUploadField.tsx   single-file wrapper over AttachmentField (section 8)             profile
│     └─ modules/
│        ├─ homepage/              (exists)                                                         F
│        ├─ auth/                  RegisterForm, OtpStep, LoginForm, ForgotPasswordForm, ResetPasswordForm   auth
│        ├─ profile/               IdentityCard, AvatarUploader, AccountCard, SecurityCard, DangerZone     profile
│        ├─ connections/           PlatformCard, ConnectButton, CallbackStatus, FacebookPagePicker          conn
│        ├─ posts/                 PostComposer, TargetPlatforms, PostPreview, PostCard, PostList, PostDetail   composer
│        ├─ executions/            PublishPanel, ExecutionStatusBadge, PublicationRow, ExecutionTable,
│        │                         ExecutionFilters, RetryButton, SlowRunNotice                      exec
│        ├─ payment/               UpgradeCard, PaymentResult, PaymentHistoryTable, PaymentStatusBadge      pay
│        ├─ upcoming-features/     FeatureCard, FeatureStatusBadge                                  feat
│        └─ admin/                 platforms/, users/, audit-logs/, features/ (table + MultipageModal form)  admin
```

Notes on the tree: `src/modules/shared/context/*` (exists) duplicates `reusable-ui-blocks/shared-context`; do not extend it.
`components/dashboard/` (overview widgets) differs from L7, where `components/dashboard` holds the shell; here the shell is `components/layout/dashboard`
per CLAUDE.md, and `components/dashboard` is the page-specific content, to keep both names from the brief meaningful.

---

## 3. apiClient design

### 3.1 Facts the design rests on (verified in backend code)

- Success: `sendResponse` envelope. Failure: `globalErrorHandler` envelope; `AppError` messages are curated and safe. **Unknown (non-AppError) errors also return `err.message` in production**, so 5xx text must never be shown raw.
- Validation failures (`validateRequest`) are `400` with `message` = all zod issue messages joined by `", "`. Multer failures (type/size) are also `400` (`AppError`).
- Prisma unique violation maps to `400 "Duplicate Key Error"` (not 409). Explicit conflicts use `409` (register email exists).
- Auth: cookies `accessToken` (1 day) and `refreshToken` (7 days), httpOnly; `auth()` re-reads the user on every request, so blocked/deleted users get `401` immediately. `POST /auth/refresh-token` reads the `refreshToken` cookie and re-sets both. `POST /auth/logout` is unauthenticated and idempotent.
- Two limiters, both per IP: global 300 req/15 min; `authLimiter` 20/15 min on register, verify-email, login, forgot, reset. The **auth** limiter returns a JSON `429` envelope; the **global** limiter has no custom handler, so its `429` body is **plain text** (express-rate-limit default). Both send `RateLimit-*` and `Retry-After` headers (`standardHeaders: true`), but CORS has no `exposedHeaders`, so cross-origin JS **cannot read them** in direct mode.
- Render/Vercel edge errors (`502/503/504` during cold start, `413` on oversize) arrive as HTML or text, not the envelope.
- ofetch defaults: it retries (1x) idempotent requests on 408/409/425/429/500/502/503/504. We must set `retry: 0` and let TanStack Query own retries; otherwise a `409` from register would be silently retried.

### 3.2 Base URL, credentials, modes

```ts
// src/lib/env.ts  (literal property access so Next inlines NEXT_PUBLIC_*)
const raw = {
  apiBase: process.env.NEXT_PUBLIC_API_BASE_URL,   // "http://localhost:5000/api/v1" (direct) or "/api/v1" (same-origin proxy)
  apiProxyTarget: process.env.API_PROXY_TARGET,    // server-only, e.g. "https://content-automation-backend-jwpw.onrender.com"
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
};
export const env = {
  apiBase: z.string().min(1, "NEXT_PUBLIC_API_BASE_URL is required").parse(raw.apiBase),
  apiProxyTarget: raw.apiProxyTarget,
  siteUrl: raw.siteUrl ?? "http://localhost:3000",
  isProxyMode: raw.apiBase?.startsWith("/") ?? false,
};

// next.config.ts (proxy mode only: Vercel prod and previews)
async rewrites() {
  const target = process.env.API_PROXY_TARGET;
  return target ? [{ source: "/api/v1/:path*", destination: `${target}/api/v1/:path*` }] : [];
}
```

- **Direct mode** (`NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1`): local dev. Localhost:3000 and localhost:5000 are *same-site*, so the backend's dev cookie flags (`sameSite: lax`, `secure: false`) work.
- **Proxy mode** (`NEXT_PUBLIC_API_BASE_URL=/api/v1`, `API_PROXY_TARGET=<render url>`): recommended production topology. The browser only talks to the frontend origin; Next rewrites to Render. Cookies become first-party to the frontend host, which removes the third-party-cookie risk, CORS preflights, and the single-origin CORS limit (section 11.2). **UNVERIFIED:** that `Set-Cookie` from the backend (`SameSite=None; Secure`, no `Domain`) passes through the Vercel rewrite and binds to the frontend host, and Vercel's request-body limit for rewritten uploads. Both are the first things the `auth-ui` slice must test before deploying (task: "verify in the real Vercel environment").
- `credentials: "include"` stays set in both modes (harmless same-origin, required cross-origin).
- SSR: client components run in the browser; during SSR a relative base URL fails. Rule: **server code never calls authenticated endpoints** in this MVP (no cookie forwarding; all data is client-fetched behind the guard). If a server component ever needs the API: use `env.apiProxyTarget ?? absolute NEXT_PUBLIC_API_BASE_URL` plus an explicit `Cookie` header from `next/headers`, in a separate `serverApi` helper; do not reuse the browser refresh logic. `apiClient.ts` includes a guard that throws a clear error if called on the server with a relative base.

### 3.3 The client (sketch)

```ts
// src/lib/apiClient.ts
import { ofetch, type FetchOptions } from "ofetch";
import { ApiError, toApiError } from "./api-error";
import { env } from "./env";
import { sessionEvents } from "./session-events";
import type { ApiEnvelope, Paged } from "@/types";

const http = ofetch.create({
  baseURL: env.apiBase,
  credentials: "include",
  retry: 0,                                   // TanStack Query owns retries
  timeout: 30_000,                            // Render free tier cold start can be slow; see 3.8
  headers: { "X-Requested-With": "content-automation-web" },  // makes every request non-"simple" (CSRF note, 11.3)
});

type Opts = Omit<FetchOptions<"json">, "method"> & { skipAuthRefresh?: boolean };

// Paths where a 401 is a business answer, never a stale-session signal.
const NO_REFRESH = ["/auth/login", "/auth/register", "/auth/verify-email", "/auth/forgot-password",
                    "/auth/reset-password", "/auth/refresh-token", "/auth/logout"];

// ---- single shared refresh -------------------------------------------------
type RefreshResult = "ok" | "expired" | "transient";
let inflight: Promise<RefreshResult> | null = null;
let lastRefreshAt = 0;

function refreshOnce(): Promise<RefreshResult> {
  inflight ??= http("/auth/refresh-token", { method: "POST" })
    .then((): RefreshResult => { lastRefreshAt = Date.now(); return "ok"; })
    .catch((e): RefreshResult => {
      const s = e?.response?.status;
      return s === 401 || s === 403 ? "expired" : "transient";   // network/5xx must NOT log the user out
    })
    .finally(() => { inflight = null; });
  return inflight;
}

// ---- core request ----------------------------------------------------------
async function send<T>(method: string, path: string, opts: Opts): Promise<ApiEnvelope<T>> {
  if (typeof window === "undefined" && env.isProxyMode) {
    throw new Error("apiClient is browser-only in proxy mode (see docs/frontend-architecture.md 3.2)");
  }
  try {
    const body = await http<ApiEnvelope<T>>(path, { ...opts, method });
    if (body && body.success === false) throw new ApiError({ status: body.statusCode, message: body.message, body });
    return body;
  } catch (e) {
    throw toApiError(e);
  }
}

export async function request<T>(method: string, path: string, opts: Opts = {}): Promise<ApiEnvelope<T>> {
  const startedAt = Date.now();
  try {
    return await send<T>(method, path, opts);
  } catch (err) {
    const e = err as ApiError;
    const refreshable = e.status === 401 && !opts.skipAuthRefresh && !NO_REFRESH.some((p) => path.startsWith(p));
    if (!refreshable) throw e;

    // A request that started BEFORE the last successful refresh just retries (its cookie was stale), no second refresh.
    const result = startedAt < lastRefreshAt ? "ok" : await refreshOnce();
    if (result === "expired") { sessionEvents.emit("expired"); throw e.asSessionExpired(); }
    if (result === "transient") throw e;
    return send<T>(method, path, opts);            // retry exactly once; a second 401 is a business 401 (e.g. wrong current password)
  }
}

// ---- public surface: return the unwrapped payload -------------------------
export const api = {
  get:    <T>(p: string, o?: Opts) => request<T>("GET", p, o).then((r) => r.data),
  post:   <T>(p: string, body?: unknown, o?: Opts) => request<T>("POST", p, { ...o, body }).then((r) => r.data),
  patch:  <T>(p: string, body?: unknown, o?: Opts) => request<T>("PATCH", p, { ...o, body }).then((r) => r.data),
  delete: <T>(p: string, o?: Opts) => request<T>("DELETE", p, o).then((r) => r.data),
  /** paginated list: data is the array, meta is required */
  getPaged: <T>(p: string, o?: Opts) =>
    request<T[]>("GET", p, o).then((r): Paged<T> => ({ items: r.data, meta: r.meta ?? { page: 1, limit: r.data.length, total: r.data.length, totalPages: 1 } })),
  /** when the envelope message matters (register, forgot-password) */
  envelope: request,
};
export default api;
```

Design notes:

- The existing default export (`ofetch` instance) is replaced by `api`; `api/*.api.ts` files use `api.get/post/...` (the L7 `apiClient("/path")` call style is dropped because it returns the raw envelope).
- `FormData` bodies are re-sendable, so the retry-once after refresh is safe for uploads. Never stringify or set `Content-Type` yourself.
- **Why "refresh failed" and not "retry got 401" triggers the redirect:** `PATCH /users/me/password` answers `401 "Current password is incorrect"`, and `/auth/login` answers `401 "Invalid email or password"`. Login is excluded by path. For change-password, the flow is 401 -> refresh succeeds (session valid) -> retry -> 401 again -> surfaced as a field error. Cost: one extra `refresh-token` call per wrong password; no false logouts.
- The "late arrival" guard (`startedAt < lastRefreshAt`) prevents a second refresh when a slow in-flight request returns 401 after another request already refreshed.
- `skipAuthRefresh: true` is for the session bootstrap only if we ever want a guess-free probe; by default `GET /auth/me` **does** refresh (a user returning after >1 day has a valid refresh cookie but an expired access cookie and should land signed in).

### 3.4 ApiError: typed mapping from the backend error envelope

```ts
// src/lib/api-error.ts
export type ApiErrorKind =
  | "offline" | "network" | "timeout"           // no response
  | "validation"                               // 400
  | "unauthorized" | "session_expired"          // 401 | refresh failed
  | "forbidden"                                // 403
  | "not_found"                                // 404
  | "conflict"                                 // 409
  | "payload_too_large"                        // 413 (edge/proxy, non-envelope)
  | "rate_limited"                             // 429
  | "not_implemented"                          // 501 (backend uses it for unwired platforms)
  | "server"                                   // 5xx
  | "client";                                  // other 4xx

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  readonly status: number;                      // 0 when there was no response
  readonly kind: ApiErrorKind;
  readonly messages: string[];                  // backend message split on ", " (validation joins issues that way)
  readonly fieldErrors: FieldErrors;            // from body.errors/errorDetails if the backend ever sends them; else {}
  constructor(init: { status: number; message: string; kind?: ApiErrorKind; body?: unknown }) { /* derive kind, messages */ super(init.message) }
  get isRetryable() { return ["offline", "network", "timeout", "server"].includes(this.kind); }
  get isAuth()      { return this.kind === "unauthorized" || this.kind === "session_expired"; }
  /** Text safe to show. 5xx and network never echo server text. */
  get userMessage(): string { /* table below */ }
  asSessionExpired(): ApiError { /* same object, kind = "session_expired" */ }
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  const fe = e as { response?: { status: number; _data?: unknown }; data?: unknown; message?: string };
  if (!fe?.response) {
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    const timedOut = /timeout|aborted/i.test(fe?.message ?? "");
    return new ApiError({ status: 0, message: "No response", kind: offline ? "offline" : timedOut ? "timeout" : "network" });
  }
  const { status } = fe.response;
  const body = fe.response._data;                                         // object (envelope) OR string/HTML (limiter, edge)
  const message = typeof body === "object" && body && "message" in body ? String((body as { message: unknown }).message) : "";
  return new ApiError({ status, message, body });
}
```

`userMessage` and handling table (the single place status -> UX is decided):

| Case | `kind` | `userMessage` | Where it surfaces | Extra handling |
|---|---|---|---|---|
| no network / `navigator.onLine===false` | `offline` | "You appear to be offline. Check your connection and try again." | inline `ErrorState` (queries), toast (mutations) | `online` event -> `queryClient.refetchQueries({ type: "active", stale: true })` via a `<OnlineRefetch/>` listener in `QueryProvider` |
| fetch aborted / 30 s timeout | `timeout` | "The server is taking too long. Try again." | same | TanStack retry (max 2) for queries; mutations not retried |
| 400 | `validation` | backend message verbatim (curated, safe) | field errors via `useServerFormErrors`, else `FormAlert` | `messages[]` for lists |
| 401 after refresh failed | `session_expired` | "Your session expired. Please sign in again." | global redirect (section 5.5) | `sessionEvents.emit("expired")` |
| 401 business (`/auth/login`, wrong current password) | `unauthorized` | backend message verbatim | form field / `FormAlert` | never redirects |
| 403 | `forbidden` | backend message verbatim ("This account has been blocked", "This area is for premium members", "Forbidden...") | login: `FormAlert`; premium routes: `UpgradeGate`; admin: `AccessDenied` | message `"This area is for premium members"` is the only premium signal; match on `kind==="forbidden"` + route context, not on the string |
| 404 | `not_found` | backend message ("Post not found", "Upcoming feature not found") | route-level not-found state (`QueryBoundary` renders `NotFoundState`) | owner-scoped resources return 404 for foreign ids; never reveal existence |
| 409 | `conflict` | backend message | email field on register; slug/key field in admin | |
| 413 | `payload_too_large` | "That file is too large (max 5 MB)." | upload field | edge/proxy response, not an envelope |
| 429 (auth limiter, JSON) or global limiter (text) | `rate_limited` | "Too many attempts. Please wait a few minutes and try again." | `FormAlert` + submit disabled for a cool-down (default 60 s; real `Retry-After` is unreadable in direct mode, readable in proxy mode, see 6.4) | polling pauses (section 6) |
| 501 | `not_implemented` | backend message ("No integration is wired for this platform yet") | toast | |
| 502/503/504 / 500 | `server` | "Something went wrong on our side. Please try again." (never the server text) | `ErrorState` with Retry | TanStack retry (max 2) for queries; cold-start friendly |
| other 4xx | `client` | backend message | toast | |

**Field errors (R9):** because the backend returns one joined string, `useServerFormErrors` (9.3) maps by (a) `fieldErrors` if present, else (b) a per-form regex table. Do not try to infer fields by splitting arbitrary strings; unmapped messages go to `FormAlert`.

### 3.5 Behaviour on top of the client

- **Dev-only fields:** ignore `data.otp` from register/forgot-password responses (auth-ui D5/5.4); the `api` layer for those two calls returns `{ email }` / `null` only, never the raw object, so the OTP cannot be rendered by accident.
- **Idempotency of mutations:** buttons disable on `isPending`; additionally `usePublishPost`/`useCreatePayment` guard with `mutation.isPending` in the click handler (double-click race before re-render).
- **Cancellation:** queries receive `signal` from TanStack; pass it through `api.get(path, { signal })` in hooks that can be abandoned quickly (search, polling) so stale responses never overwrite newer ones.
- **Logging:** `api-error.ts` exports `logApiError(e)` (console in dev; hook for a future provider). Never log request bodies (passwords, OTPs).

### 3.6 SSR vs client summary

| Where | May call `api`? | Notes |
|---|---|---|
| Client component / hook | Yes | The only normal path. |
| Server component, route handler, `proxy.ts` | No (MVP) | No cookie forwarding, no refresh. If needed later: `serverApi` with explicit `cookies()` header and no refresh. |
| `generateMetadata` for public pages | No API | Marketing is static. |

### 3.7 Offline

Queries: `refetchOnReconnect: true` (TanStack default) plus the `online` listener above. Mutations while offline fail fast with `offline` and a toast; no offline queue (non-goal). Show a slim "Offline" banner in `DashboardShell` driven by `useSyncExternalStore(navigator.onLine)`.

### 3.8 Cold start (Render free tier)

First request after idle can take 30-60 s or return `502/503`. Mitigations: `retry` for `server`/`timeout` kinds (4.1); timeout 30 s with retry covers one cold start; marketing page fires one fire-and-forget `GET <origin>/health` (outside `/api/v1`, so it needs the origin: only in direct mode or add a `/health` rewrite) to wake the instance before login (optional, log it). **UNVERIFIED:** actual cold-start duration; measure during `auth-ui` verification.

---

## 4. Query keys and cache invalidation

### 4.1 Hardened QueryClient defaults (`providers/query.provider.tsx`)

```ts
declare module "@tanstack/react-query" { interface Register { defaultError: ApiError } }

new QueryClient({
  queryCache: new QueryCache({
    // background refetch failed but we still hold data: keep showing it, tell the user once
    onError: (error, query) => { if (query.state.data !== undefined && !error.isAuth) toast.error("Couldn't refresh. Showing saved data."); },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,                      // opt in per query (session, execution detail)
      retry: (count, error) => count < 2 && error instanceof ApiError && error.isRetryable,   // never retry 4xx
    },
    mutations: { retry: false },
  },
});
```

Mutation error toasts are explicit per hook (`onError: toastApiError`), avoiding reliance on `MutationCache.onError` argument order (changed across v5 minors; **UNVERIFIED** for the installed 5.104).

### 4.2 Key factory (`src/lib/queryKeys.ts`)

```ts
export const qk = {
  session:  () => ["session"] as const,
  profile:  () => ["profile"] as const,

  platforms:   { all: ["platforms"] as const, list: () => ["platforms", "list"] as const },
  connections: { all: ["connections"] as const, list: () => ["connections", "list"] as const,
                 facebookPages: () => ["connections", "facebook-pages"] as const },

  posts: { all: ["posts"] as const,
           lists: () => ["posts", "list"] as const,
           list: (p: { search?: string; sort?: string }) => ["posts", "list", p] as const,
           detail: (id: string) => ["posts", "detail", id] as const },

  executions: { all: ["executions"] as const,
                lists: () => ["executions", "list"] as const,
                list: (p: ExecutionListParams) => ["executions", "list", p] as const,
                detail: (id: string) => ["executions", "detail", id] as const },

  payments: { all: ["payments"] as const,
              lists: () => ["payments", "list"] as const,
              list: (p: PaymentListParams) => ["payments", "list", p] as const,
              detail: (id: string) => ["payments", "detail", id] as const },

  upcomingFeatures: { all: ["upcoming-features"] as const,
                      list: () => ["upcoming-features", "list"] as const,
                      detail: (slug: string) => ["upcoming-features", "detail", slug] as const },

  admin: {
    platforms:  { all: ["admin", "platforms"] as const, list: () => ["admin", "platforms", "list"] as const },
    users:      { all: ["admin", "users"] as const, list: (p: AdminUserParams) => ["admin", "users", "list", p] as const,
                  detail: (id: string) => ["admin", "users", "detail", id] as const },
    auditLogs:  { all: ["admin", "audit-logs"] as const, list: (p: AuditParams) => ["admin", "audit-logs", "list", p] as const },
    features:   { all: ["admin", "upcoming-features"] as const, list: () => ["admin", "upcoming-features", "list"] as const,
                  detail: (id: string) => ["admin", "upcoming-features", "detail", id] as const },
  },
} as const;
```

Rules: params objects are normalised (drop `undefined`, stable order) before entering a key so `?a=1&b=2` and `?b=2&a=1` share a cache entry. Infinite queries use the same `list(...)` key (TanStack stores pages inside). Hooks never write literal arrays.

### 4.3 Invalidation / update matrix: every mutation in the app

`inv` = `invalidateQueries`, `set` = `setQueryData`, `rm` = `removeQueries`, `opt` = optimistic update with rollback. "Reset" = `resetClientState(qc)` (section 5.6).
Endpoint column is for orientation; shapes live in `api-contract.md`.

| # | Hook | Endpoint | Cache effect | Other effects |
|---|---|---|---|---|
| 1 | `useRegister` | POST `/auth/register` | none | keep `email` + form values in component state (password never persisted) |
| 2 | `useVerifyEmail` | POST `/auth/verify-email` | Reset, then `set` session = returned user | navigate `safeNext(next) ?? /dashboard` |
| 3 | `useLogin` | POST `/auth/login` | Reset (drops any previous account's data), then `set` session = user | navigate `safeNext(next)` |
| 4 | `useLogout` | POST `/auth/logout` | **onSettled** (even on failure): Reset, session = `null` | toast, `router.replace("/")`, emit `logout` to other tabs |
| 5 | (internal) refresh | POST `/auth/refresh-token` | none on success; on `expired`: Reset via `sessionEvents` | redirect `/login?next&reason=expired` |
| 6 | `useForgotPassword` | POST `/auth/forgot-password` | none | `router.push("/reset-password?email=")` |
| 7 | `useResetPassword` | POST `/auth/reset-password` | none | `router.push("/login")` |
| 8 | `useUpdateProfile` | PATCH `/users/me` | `set` profile; patch `session.name` | |
| 9 | `useUploadAvatar` | PATCH `/users/me/avatar` | `set` profile; patch `session.avatarUrl` | preview until settled |
| 10 | `useRemoveAvatar` | DELETE `/users/me/avatar` | `set` profile; patch `session.avatarUrl = null` (`opt`) | |
| 11 | `useChangePassword` | PATCH `/users/me/password` | none | reset form; `401` -> `currentPassword` field |
| 12 | `useDeleteAccount` | DELETE `/users/me` | Reset; session = `null` | backend already cleared cookies; `router.replace("/")` |
| 13 | `useStartConnect` | GET `/connections/:platform/connect` | none | validate `authUrl` host (11.6), `window.location.assign` |
| 14 | `useConnectionCallback` | GET `/connections/:platform/callback` | `connected`: `inv` connections.all. `select-page`: `inv` connections.facebookPages | route per outcome; fire-once guard (conn D2) |
| 15 | `useSelectFacebookPage` | POST `/connections/facebook/select-page` | `inv` connections.all; `rm` connections.facebookPages | close modal, strip `?select=` |
| 16 | `useDisconnectPlatform` | DELETE `/connections/:platform` | `opt` remove from connections.list; on settle `inv` connections.all | past executions untouched |
| 17 | `useCreatePost` | POST `/posts` (multipart) | `rm` posts.lists; `set` posts.detail(id) if body is full Post | navigate `/posts/[id]` (+`?publish=`) |
| 18 | `useDeletePost` | DELETE `/posts/:id` | `rm` posts.detail(id); `rm` posts.lists; `inv` executions.all (their `post.isDeleted` flips) | redirect `/dashboard`. Removing lists (not patching pages) avoids offset drift in infinite scroll |
| 19 | `usePublishPost` | POST `/posts/:id/publish` (202) | `inv` executions.lists; seed nothing (shape of 202 body = UNVERIFIED) | navigate `/executions/<id>`; polling starts on mount |
| 20 | `useRetryPublication` | POST `/publications/:id/retry` (202) | `opt` set that publication `PENDING` and execution `RUNNING` in executions.detail(execId); on settle `inv` executions.detail + executions.lists | reset the poll clock (6.2) |
| 21 | `useRetryExecution` | POST `/executions/:id/retry` (202) | `opt` all `retryable` publications -> `PENDING`; same invalidation | `400 "Connect X..."` -> link to `/connections` |
| 22 | `useCreatePayment` | POST `/payments/create` | none (we leave the page) | `safeStorage.set("pay:id", paymentId)`; guarded `assign(redirectUrl)` (11.6) |
| 23 | `useVerifyPayment` | POST `/payments/verify` | `set` payments.detail(id). If `SUCCESS`: `inv` session, profile, `payments.all`, `upcomingFeatures.all` | clear stored id; success toast once |
| 24 | `useCreatePlatform` (admin) | POST `/admin/platforms` | `inv` admin.platforms.all, `platforms.all`, `connections.all` | then logo upload step (8.5) |
| 25 | `useUpdatePlatform` (admin) | PATCH `/admin/platforms/:id` | same as 24 (status COMING_SOON<->LIVE changes user Connect cards and composer targets) | |
| 26 | `useSetPlatformLogo` (admin) | PATCH `/admin/platforms/:id/logo` | same as 24 | row-level retry on failure |
| 27 | `useSetUserStatus` (admin) | PATCH `/admin/users/:id/status` | `opt` row status in admin.users.lists; settle `inv` admin.users.all | confirm modal first; target==self disabled |
| 28 | `useSetUserRole` (admin, SUPER_ADMIN) | PATCH `/admin/users/:id/role` | same as 27 | |
| 29 | `useSetUserPremium` (admin) | PATCH `/admin/users/:id/premium` | same as 27 | affected user's own session self-heals on focus (staleTime 5 min) |
| 30 | `useCreateFeature` (admin) | POST `/admin/upcoming-features` | `inv` admin.features.all, `upcomingFeatures.all` | image step 33 |
| 31 | `useUpdateFeature` (admin) | PATCH `/admin/upcoming-features/:id` | `inv` admin.features.all (+detail), `upcomingFeatures.all` | slug dup -> `conflict`/400 "Duplicate Key" on `slug` field |
| 32 | `useDeleteFeature` (admin) | DELETE `/admin/upcoming-features/:id` | `rm` admin.features.detail(id); `inv` admin.features.all, `upcomingFeatures.all` | hard delete: modal with "hide instead" hint |
| 33 | `useSetFeatureImage` (admin) | PATCH `/admin/upcoming-features/:id/image` | `inv` admin.features.all, `upcomingFeatures.all` | |

Cross-effects worth remembering:

- **Premium flips** (row 23, and admin row 29): invalidate `session` *and* `profile` *and* gated data (`upcomingFeatures.all`), because the sidebar entry and the gate read from the session, the profile page reads `profile`.
- **Audit logs** (`qk.admin.auditLogs`) are written by many actions (platform/feature changes, blocks, premium, payment verified, disconnect) but are never invalidated by mutations; the audit queries use `staleTime: 0` + `refetchOnMount: "always"` so opening the page always shows fresh rows.
- **Admin edits vs user views:** admin mutations (24-26, 30-33) invalidate the *user-facing* keys too, because the admin may be viewing the user app in the same tab history.
- **`toActionResult()` adapter (R6)** for the existing `useOptimisticListMutation` (rows 16, 27-29 only):

```ts
// src/lib/errors/to-action-result.ts
export const toActionResult = <A extends unknown[], T>(fn: (...a: A) => Promise<T>) =>
  async (...a: A): Promise<ActionResult<T>> => {
    try { return { ok: true, data: await fn(...a) }; }
    catch (e) { const err = toApiError(e); return { ok: false, code: mapKindToErrorCode(err.kind), message: err.userMessage }; }
  };
```

---

## 5. Session and auth state

### 5.1 `useSession` (single source of truth)

```ts
// src/hooks/auth.hook.ts
export function useSession() {
  const q = useQuery<SessionUser | null, ApiError>({
    queryKey: qk.session(),
    queryFn: async ({ signal }) => {
      try { return await getMe(signal); }                              // refresh-on-401 happens inside apiClient
      catch (e) { if (e instanceof ApiError && e.isAuth) return null; throw e; }   // 401 => guest; network/5xx => real error
    },
    staleTime: 5 * 60_000,                // block/premium changes picked up within 5 min or on next focus
    refetchOnWindowFocus: true,
    retry: false,
  });
  const user = q.data ?? null;
  return {
    user,
    status: q.isPending ? "loading" : q.isError ? "error" : user ? "authenticated" : "guest",
    isPremium: !!user?.isPremium, role: user?.role ?? null,
    isAdmin: user?.role === "ADMIN" || user?.role === "SUPER_ADMIN",
    isSuperAdmin: user?.role === "SUPER_ADMIN",
    refetch: q.refetch, error: q.error,
  } as const;
}
```

Important distinction: a **network/5xx failure is `status: "error"`, not `"guest"`** — the guard shows a retry state and never redirects a possibly-signed-in user to `/login` because Render was cold.
Login/verify seed the cache with the returned user so there is no `/auth/me` round trip; `profile` (richer, `GET /users/me`) loads only on `/profile` and where `providers` is needed.

### 5.2 Guards: client `AuthGuard` vs Next 16 `proxy.ts` (decision)

Read: `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`, `.../03-file-conventions/proxy.md`, `02-guides/authentication.md` ("Optimistic checks with Proxy", "Layouts and auth checks").
Next 16 specifics that drive the decision:

- `middleware.ts` is now `proxy.ts` (export `proxy` or default), Node.js runtime only; `runtime` config is not allowed. A `matcher` is mandatory in practice (otherwise it runs on `_next/static`, images, public files).
- Proxy is meant for **optimistic** checks that read the cookie only, not DB/API calls, and "should not be used as a full session management or authorization solution". It also runs on prefetches.
- Server Functions are not separate routes; excluded matchers also skip them. We have no Server Functions, so this is moot but stays true if added.
- Layout-level checks do not re-run on client navigation (partial rendering), and "`return null` in a layout when unauthorized" is discouraged because nested segments/RSC payload still exist.

Decision:

1. **Authority = client `AuthGuard`** in `(dashboard)/layout.tsx` subscribed to `useSession()`. It re-evaluates on every session change (logout in another tab, expiry), which a layout-time server check cannot. This is acceptable here because the RSC payload contains **no user data** (every page is a client shell that fetches via the cookie-authenticated API), and the real authorization is the backend on every request. (This matches `app-shell` D2.)
2. **`proxy.ts` is optional and only enabled in same-origin-cookie (proxy) mode.** In direct mode the cookies live on the API origin and the Next server cannot see them at all, so a proxy check would redirect everybody. In proxy mode the proxy only does: *if neither `accessToken` nor `refreshToken` cookie is present and the path is in the protected set -> redirect to `/login?next=<path+search>`* (removes the skeleton flash for obvious guests, avoids shipping the guarded shell to logged-out visitors). It **never** redirects away from `/login` (stale cookies would loop), never decodes/validates JWTs (no secret on the frontend), never checks role.

```ts
// src/proxy.ts
import { NextResponse, type NextRequest } from "next/server";
const COOKIE_VISIBLE = process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("/") ?? false;

export function proxy(req: NextRequest) {
  if (!COOKIE_VISIBLE) return NextResponse.next();
  const has = req.cookies.has("accessToken") || req.cookies.has("refreshToken");
  if (has) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}
export const config = {
  matcher: ["/dashboard/:path*", "/create/:path*", "/posts/:path*", "/connections/:path*", "/executions/:path*",
            "/profile/:path*", "/payment/:path*", "/upcoming-features/:path*", "/admin/:path*"],
};
```

Caveat: `/connections/callback/*` must be excluded from the matcher (negative lookahead) or live outside it, because the single-use OAuth `code` must reach the callback page even if the cookie is missing; see 5.4. `proxy.ts` is not part of the first `auth-ui` pass; add it after the cookie pass-through is verified on Vercel (open question Q2). If verification fails, drop it; nothing else depends on it.

### 5.3 Guard components

```tsx
// components/auth/AuthGuard.tsx
"use client";
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status, refetch } = useSession();
  const router = useRouter(); const pathname = usePathname(); const search = useSearchParams().toString();
  useEffect(() => { if (status === "guest") router.replace(loginUrl(pathname + (search ? `?${search}` : ""))); }, [status]);
  if (status === "loading") return <AuthLoading />;                         // skeleton that mirrors the shell
  if (status === "error")   return <ErrorState onRetry={refetch} />;         // offline / 5xx: no redirect
  if (status === "guest")   return <AuthLoading label="Redirecting..." />;
  return <>{children}</>;
}
```

(`useSearchParams` needs a `<Suspense>` boundary around the guard in the layout or the static build fails; wrap it.)

- `GuestOnly` (in `(authentication)/layout.tsx`): authenticated -> `router.replace(safeNext(next, "/dashboard"))`; loading -> `AuthLoading`; error -> render the form anyway (login must be reachable while the session probe fails).
- `RoleGuard roles={[...]}` (admin layout): loading -> `AuthLoading`; guest -> same redirect as `AuthGuard`; wrong role -> `<AccessDenied/>` (no redirect, per `admin-console` D1).
- Marketing `/` is never guarded or redirected; the header reads `useSession()` and shows a neutral placeholder while loading.

### 5.4 Role and premium gating helpers

```ts
// src/lib/access.ts   (UI hints only; the backend re-checks every call)
export type Role = "USER" | "ADMIN" | "SUPER_ADMIN";
export const isAdmin      = (u?: SessionUser | null) => u?.role === "ADMIN" || u?.role === "SUPER_ADMIN";
export const isSuperAdmin = (u?: SessionUser | null) => u?.role === "SUPER_ADMIN";
export const isPremium    = (u?: SessionUser | null) => !!u?.isPremium;
export const hasRole      = (u: SessionUser | null | undefined, ...r: Role[]) => !!u && r.includes(u.role);
export const isSelf       = (u: SessionUser | null | undefined, id: string) => u?.id === id;
```

```tsx
// components/auth/Require.tsx
<Require premium fallback={<UpgradeGate />}>…</Require>
<Require roles={["SUPER_ADMIN"]}>…role dropdown…</Require>       // no fallback = render nothing
```

- Nav items declare `visible(user)` (`routes/app.routes.ts`), e.g. Upcoming Features `isPremium`, Upgrade `!isPremium`, Admin `isAdmin`.
- **Premium gate = flag + 403** (`feat` D1): `useUpcomingFeatures` has `enabled: isPremium`; non-premium renders `UpgradeGate` without a request; a `403` (`forbidden`) from a stale flag also renders `UpgradeGate` and triggers `inv` session so the flag self-corrects.
- **Self-safety:** admin tables disable status/role/premium controls on `isSelf` rows (backend returns 400 for self status/role).
- The `oauth-return` route and `/payment/*` return pages are the only places that read URL data and then call the API; neither trusts the URL for an outcome.

### 5.5 Redirect rules

| Situation | Target | Notes |
|---|---|---|
| Guest opens a guarded route | `/login?next=<path+search>` | `next` is URL-encoded, <= 512 chars |
| Login / verify-email success | `safeNext(next, "/dashboard")` | |
| Signed-in user opens `/login`, `/register`, `/forgot-password`, `/reset-password` | `safeNext(next, "/dashboard")` | via `GuestOnly` |
| Signed-in user opens `/` | stay | explicit requirement |
| Session expires while using the app (refresh fails) | `/login?next=<current>&reason=expired` + toast | one redirect only (debounced flag), skipped if already on a public route |
| Non-admin opens `/admin/*` | in-place `AccessDenied` | |
| Logout | `/` | |
| Delete account | `/` | |
| Reset password success | `/login` | |
| OAuth callback outcomes | `/connections`, `/connections?select=facebook`, `/connections?error=` | callback page is public-group (no guard) |
| Payment return | `/payment/success`, `/payment/failure` | guarded; guest -> login with `next` back |

`next` validation (open redirect, also see 11.5):

```ts
// src/lib/safe-redirect.ts
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
export function safeNext(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw || raw.length > 512) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || /[\u0000-\u001f]/.test(raw)) return fallback;
  let u: URL; try { u = new URL(raw, "http://localhost"); } catch { return fallback; }
  if (u.origin !== "http://localhost") return fallback;
  if (AUTH_PATHS.some((p) => u.pathname === p || u.pathname.startsWith(`${p}/`))) return fallback;   // no login loop
  return u.pathname + u.search + u.hash;
}
export const loginUrl = (to: string, reason?: "expired") =>
  `/login?next=${encodeURIComponent(to)}${reason ? `&reason=${reason}` : ""}`;
```

### 5.6 Logout / expiry cleanup

```ts
// src/lib/client-state.ts
export function resetClientState(qc: QueryClient) {
  qc.cancelQueries();                      // stop in-flight polls first
  qc.clear();                              // every cache entry, including other users' data
  safeStorage.remove("pay:id");            // any sessionStorage keys we own
  sessionEvents.emit("reset");             // components holding local drafts can drop them
}
```

- `useLogout.onSettled` always runs it (cookie clearing is best-effort server-side; a failed logout call must still sign the UI out and the next `/auth/me` will say 401 if the cookie was not cleared).
- `SessionProvider` subscribes once: `expired` -> `resetClientState`, toast, redirect (5.5); `logout` from another tab (`BroadcastChannel("auth")`, fallback `storage` event) -> same.
- Login runs `resetClientState` *before* seeding the new session so account A's cached posts/connections can never render for account B.

---

## 6. Polling strategy: execution status

Publish and retry return `202` and only enqueue work (`execution.worker.ts`), so the UI polls `GET /executions/:id`.
Backend status vocabulary (execution): `PENDING | RUNNING | COMPLETED | PARTIALLY_COMPLETED | FAILED`; publication: includes `FAILED` with `retryable`. Active = `PENDING | RUNNING`; terminal = the other three (a retry re-activates).

### 6.1 Rate-limit budget

Global limiter: 300 requests / 15 min / IP = 20/min average, **shared with everything else the app does** (and see risk Q1: behind Render the bucket may be shared by all users). Budget rule: **one polled execution may use at most ~100 requests per 15-minute window** (a third), leaving >=200 for navigation, `/auth/me` focus refetches and other users on the same IP. The openspec value "3 s polling = ~300 req/15 min" would exhaust the entire limiter alone, so a back-off schedule is mandatory, not optional.

### 6.2 Schedule (`config/polling.config.ts`)

| Elapsed since polling started | Interval | Requests in window | Cumulative |
|---|---|---|---|
| 0-30 s | 2.5 s | 12 | 12 |
| 30 s - 2 min | 5 s | 18 | 30 |
| 2 - 5 min | 10 s | 18 | 48 |
| 5 min (slow-run notice shown) - 15 min | 20 s | 30 | 78 (<= 100) |
| > 15 min | stop; show "Still running. Refresh to check." | | |

```ts
export const POLL = { steps: [[30_000, 2_500], [120_000, 5_000], [300_000, 10_000], [900_000, 20_000]] as const,
                      slowAfterMs: 300_000, giveUpAfterMs: 900_000, maxConsecutiveErrors: 4, rateLimitPauseMs: 60_000 };

export function useExecution(id: string) {
  const startedAt = useRef(Date.now());
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: qk.executions.detail(id),
    queryFn: ({ signal }) => getExecution(id, signal),
    refetchOnWindowFocus: true,                    // returning to a hidden tab refreshes immediately
    refetchIntervalInBackground: false,            // pause while the tab is hidden
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && !isActive(data.status)) return false;                               // terminal: stop
      const e = query.state.error;
      if (e?.kind === "rate_limited") return POLL.rateLimitPauseMs;                   // back off hard
      if (query.state.errorUpdateCount >= POLL.maxConsecutiveErrors) return false;    // stop; UI shows manual Refresh (cumulative count: reset with the clock)
      const elapsed = Date.now() - startedAt.current;
      if (elapsed > POLL.giveUpAfterMs) return false;
      return POLL.steps.find(([until]) => elapsed < until)![1];
    },
  });
  useResetPollClockOn(qc, id, () => { startedAt.current = Date.now(); });   // called by retry mutations
  return { ...q, pollState: derivePollState(q, startedAt.current) };         // "live" | "slow" | "stalled" | "stopped"
}
```

- **Stop conditions:** terminal status; `giveUpAfterMs`; 4 cumulative errors in this run; component unmount (TanStack stops the interval); 404 (`not_found`, no retry).
- **Resume conditions:** a retry mutation (rows 20-21) resets the clock and invalidates the detail query; manual "Refresh" button; window focus.
- **Completion toast exactly once:** compare previous and next status in an effect with a `useRef<Status>` (initialised from first data, not "undefined", so landing on an already-completed run never toasts). Messages: COMPLETED "Published to all platforms", PARTIALLY_COMPLETED "LinkedIn published, but Facebook failed" (built from rows), FAILED "Publishing failed. You can retry."
- **429 while polling:** pause 60 s (`rateLimitPauseMs`) and show the polling-paused hint; do not count toward errors.
- **Network error while polling:** TanStack `retry` applies per fetch; interval continues until `maxConsecutiveErrors`.
- **Other lists are not polled.** `useExecutions` (history) refetches on mount/focus; optional: if any visible row is active, poll the list at 10 s for at most 3 minutes (same cap logic). `useSession` is never polled (focus refetch only).
- **Payment verify** is not polling: bounded 2 attempts, 2 s apart, while `PENDING` (pay D5), then a manual Retry button.
- **Why not SSE/WebSocket:** non-goal (publish-and-executions non-goals); backend has no push transport.

### 6.3 Pre-publish and publish idempotency

`PublishPanel` pre-selects from `?publish=` but never auto-publishes (refresh safety). Button disabled while pending; keys deduped by the backend; the panel strips `?publish` on submit.

### 6.4 Real `Retry-After`

In proxy mode (same-origin) `Retry-After` and `RateLimit-*` are readable; `ApiError` should expose `retryAfterSeconds` when present and use it for the cool-down; in direct mode fall back to 60 s. UNVERIFIED which header draft the installed express-rate-limit emits; read from `Retry-After` first, then `RateLimit-Reset`.

---

## 7. Pagination, infinite scroll, URL-synced filters

Backend list shape: `?page&limit&sort&search` (posts; limit capped 100, default 10) and `?page&limit&sort&status&dateFrom&dateTo` (executions). `meta = { page, limit, total, totalPages }`. Details per endpoint: `api-contract.md`.

### 7.1 Which list uses which block

| List | Route | Block | Why | URL params |
|---|---|---|---|---|
| Posts (dashboard) | `/dashboard` | **Infinite scroll** (`pagination/infinite-scroll`) | Feed-like, search only (composer D6) | `q` (debounced search) |
| Executions history | `/executions` | **Pagination** | Filters + totals matter (exec D5) | `page`, `status`, `from`, `to` |
| Payment history | `/payment/history` | **Pagination** | Small table with status filter | `page`, `status` |
| Admin users | `/admin/users` | **Pagination** | Search + totals | `page`, `q` |
| Admin audit logs | `/admin/audit-logs` | **Pagination** | Filters | `page`, `actorId`, `action`, `entityType` |
| Platforms, connections, upcoming features, admin platforms/features | various | none (backend returns arrays, no `meta`) | | none |

### 7.2 Infinite scroll wiring (posts)

```ts
export function useInfinitePosts(params: { search?: string }) {
  return useInfiniteQuery({
    queryKey: qk.posts.list(params),
    queryFn: ({ pageParam, signal }) => getPostsPage({ ...params, page: pageParam, limit: 10 }, signal),   // returns Paged<Post>
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });
}
// component
const q = useInfinitePosts({ search: debounced });
const items = dedupeById(q.data?.pages.flatMap((p) => p.items) ?? []);   // offset pagination can overlap after deletes elsewhere
<InfiniteScrollProvider query={q}>
  <InfiniteScrollRenderer paginationSkeleton={<CardSkeletonV2List count={2} />}>   {/* count = grid's widest column count */}
    <PostGrid items={items} />
  </InfiniteScrollRenderer>
</InfiniteScrollProvider>
```

- The block's contract: `fetchNextPage`, `hasNextPage`, `isFetchingNextPage` pass straight through; **it does not handle initial load, empty state or next-page error**. Add `ListFooterStatus`: when `q.isFetchNextPageError` show "Couldn't load more. Retry" (calls `fetchNextPage`); when `!hasNextPage && items.length > 0` show a subtle end marker.
- Initial load uses `QueryBoundary` + skeleton (10.1), not `paginationSkeleton`.
- Search: input local state -> `useDebounce(value, 400)` -> `useUrlParams().set({ q })` -> key. A new search is a new key, so `isPending` shows the skeleton again; no manual reset needed.

### 7.3 Page-numbered lists and URL sync

The `Pagination` block keeps `currentPage` in its own context state and expects `{current_page,last_page,per_page,total}`.
Strategy: **URL is the source of truth**; the block is a view.

```ts
// utils/pagination.ts
export const toPaginationMeta = (m: PageMeta): PaginationMeta =>
  ({ current_page: m.page, last_page: m.totalPages, per_page: m.limit, total: m.total });

// hooks/useUrlParams.ts : useUrlParams(zodSchema) -> { values, set(partial, { resetPage?: boolean }) }
//   reads useSearchParams(), parses with zod (invalid/missing -> defaults), set() = router.replace(`?${qs}`, { scroll: false })
//   any filter change sets page=1 (resetPage default true)

// PaginatedUrlBridge (client, rendered inside <PaginationProvider>)
//   useEffect: when query data arrives -> syncMeta(toPaginationMeta(meta))      // block shows server-confirmed page
//   useEffect: when block currentPage !== urlPage -> urlParams.set({ page: currentPage }, { resetPage: false })
```

Why `router.replace` not `push` for filters: avoids a history entry per keystroke/tab click; page changes use `push` so Back walks pages (pass `{ history: "push" }` for page only).
Query keys use the parsed, normalised params, so refresh, share, and Back all reproduce the same view. Executions status tabs use `ScrollableTabsHeader`/`tabs` with values from the backend enum; the date range reuses the `dates/date-filter` blocks and maps to `dateFrom`/`dateTo` (inspect `common-modules/utils/buildDateFilterQueryParams` first; **UNVERIFIED** that its output names match; wrap rather than edit).
Keep previous data while paging: `placeholderData: keepPreviousData` on page-numbered queries so the table does not flash a skeleton between pages.

---

## 8. File upload strategy

### 8.1 What the backend enforces (multer, `lib/multer.ts`; one shared instance)

| Upload | Endpoint | Field | Notes |
|---|---|---|---|
| Avatar | PATCH `/users/me/avatar` | `avatar` | replace; DELETE `/users/me/avatar` removes |
| Post image | POST `/posts` (with `title`, `content`) | `image` | optional, single |
| Platform logo | PATCH `/admin/platforms/:id/logo` | `logo` | admin, second step after JSON create/update |
| Feature image | PATCH `/admin/upcoming-features/:id/image` | `image` | admin, second step |

Limits (identical everywhere): **1 file, <= 5 MiB (5 242 880 bytes), `mimetype.startsWith("image/")`** (declared type, not sniffed). Violations come back as `400` with messages like "File too large" / "Only image files are allowed" (converted from multer errors by each route; the user avatar and post routes do this explicitly).

### 8.2 Client policy (`lib/upload-policy.ts`, `validation/shared.validation.ts`)

```ts
export const IMAGE = {
  maxBytes: 5 * 1024 * 1024,            // backend parity: hard validation
  compressTargetBytes: 4_000_000,       // what we re-encode toward: headroom under 5 MiB and under a likely 4.5 MB edge limit (UNVERIFIED, 3.2)
  accept: "image/jpeg,image/png,image/webp,image/gif",   // narrower than backend's image/*: formats the publishers + Cloudinary demonstrably handle (UNVERIFIED for webp on LinkedIn/Facebook; prepareImage re-encodes it to JPEG)
} as const;

export const imageFileSchema = z.instanceof(File)
  .refine((f) => f.type.startsWith("image/"), "Only image files are allowed")
  .refine((f) => f.size <= IMAGE.maxBytes, "Image must be 5 MB or smaller");
```

Order of operations when a file is picked (`ImageUploadField`, a thin single-file wrapper over `AttachmentField`):
1. type filter via `accept` (AttachmentField also re-checks, since `accept` is only a hint);
2. decode probe (`createImageBitmap`) rejects corrupt/mis-tagged files with a real reason (already in AttachmentField);
3. `prepareImage(file, { maxBytes: IMAGE.compressTargetBytes })` re-encodes oversize photos (and containers outside jpeg/png/gif) to JPEG; ordinary small JPEG/PNG keep original bytes;
4. final zod check against `IMAGE.maxBytes`; failures show inline under the field (`onRejectedChange` disables submit while a rejection notice is up).

`AttachmentField` is a multi-file list API (`files`, `onAdd`, `onRemove`); the wrapper enforces single-file by replacing the array on add. **UNVERIFIED:** whether `prepareImage` has any housekeeper-specific behaviour beyond `maxBytes` (R8); read it fully and add a test page before relying on it.

### 8.3 Request, preview, progress

- `buildFormData({...})` skips `undefined`, appends `File` as-is, strings as-is. Browser sets the boundary. The same body is reused for the post-refresh retry (3.3).
- **Preview:** `URL.createObjectURL(file)`; revoke in effect cleanup and when the file changes/removes. `next/image` cannot optimise `blob:` URLs, so previews use `BaseImage` only if it supports `unoptimized`/plain `<img>` (**UNVERIFIED**, inspect `images/BaseImage.tsx`), else a plain `<img>` in `ImageUploadField`.
- **Progress:** `fetch`/ofetch exposes no upload progress. MVP = indeterminate: spinner overlay on the avatar, "Uploading..." on the submit button, controls disabled while `isPending`. A true progress bar would need an XHR path that bypasses ofetch (and therefore the refresh logic); not worth it at <= 5 MB. Open question Q8.
- **Cancel:** not offered (non-idempotent POST; backend may already have stored the image).
- **After success:** use the URL in the response (backend issues a new URL per upload, so no cache-busting); write it into `profile`/`session` (rows 8-10) so navbar and profile update immediately.
- **After failure:** revert preview, keep the form state, show the mapped message: `validation` -> under the field; `payload_too_large` -> "max 5 MB"; `server` -> generic. For post creation the backend handles orphaned Cloudinary uploads.
- **Two-step admin uploads (rows 24-26, 30-33):** JSON create succeeds first; if the image PATCH fails, keep the row, mark it "image upload failed - Retry", and retry only the PATCH (the `File` is held in component state until the modal closes).
- **Remove avatar:** `DELETE` (row 10), optimistic to initials fallback (`BaseAvatar`).
- **Display:** remote image hosts must be added to `next.config.ts` `images.remotePatterns` (Cloudinary `res.cloudinary.com`, plus the platform/feature/avatar hosts); otherwise `next/image` throws at runtime. **UNVERIFIED:** exact hostnames and URL shape returned by the backend (check `lib/cloudinary.ts`).

---

## 9. Forms strategy

### 9.1 Pattern

`GenericForm` (zod schema -> RHF + `zodResolver`) + reusable fields (`TextField`, `TextareaField`, `SelectField`, `SwitchField`, `SubmitButton`) + `FormAlert` for form-level server errors. Schemas live in `src/validation`, one file per backend module, and **mirror backend rules exactly** (same limits, same messages where useful) so client rejection is the normal path and a server 400 is the exception. Repo uses zod 4 (`z.email`, `z.enum`), same as the backend.

### 9.2 Schema mirror table (source of truth: backend `*.validation.ts`)

| Form | Backend schema | Client schema notes |
|---|---|---|
| Register | `name` trim min 1; `email` email; `password` min 8 | add nothing; do not add stricter rules the backend lacks (a client-only rule hides valid input) |
| Verify email | `email`, `otp` = exactly 6 digits | OTP input: numeric, `maxLength 6`, `autocomplete="one-time-code"`, paste-friendly |
| Login | `email`; `password` min 1 | |
| Forgot | `email` | neutral success message regardless of existence (anti-enumeration) |
| Reset | `email`, `otp`, `newPassword` min 8 | `confirmPassword` is client-only (`refine`), stripped before send |
| Profile name | `name` trim min 1 | **never send `email`** (stripped server side; verify in Network) |
| Change password | `currentPassword` min 1; `newPassword` min 8 | `confirm` client-only; show only if `providers` includes `CREDENTIALS` |
| Create post | `content` trim min 1; `title` optional; image rules (8.2) | publish targets: `platforms` min 1 key (client-only gate; backend also validates) |
| Select FB page | `pageId` trim min 1 | |
| Verify payment | `paymentId` trim min 1 | |
| Admin platform | `key` `^[a-z0-9-]+$` (create only; read-only on edit), `name`, `status` enum, `sortOrder` int, `isActive` bool | number inputs: `z.coerce.number().int()` |
| Admin feature | `slug` same pattern, `title`, `shortDescription`, `description` trim min 1, `status` enum, `sortOrder` int, `isPremiumVisible` bool | |
| Admin user actions | `status` enum, `role` enum, `isPremium` bool | no form; confirm modals |

Enum values (`PlatformStatus`, `UpcomingFeatureStatus`, `UserStatus`, `Role`) come from `api-contract.md`; define them once in `types/` as `as const` arrays and derive both TS types and `z.enum`.

### 9.3 Server errors -> fields (`useServerFormErrors`)

The backend sends one message string (R9), so mapping is explicit and per form, by pattern:

```ts
// hooks/useServerFormErrors.ts
type Rule = { match: RegExp; field: string };
export function useServerFormErrors(form: UseFormReturn<any>, rules: Rule[] = []) {
  const [formError, setFormError] = useState<ApiError | null>(null);
  const apply = (e: ApiError) => {
    setFormError(null);
    const fromBody = Object.entries(e.fieldErrors);                              // future-proof: structured details
    for (const [field, message] of fromBody) form.setError(field as never, { type: "server", message });
    const unmatched = e.messages.filter((m) => {
      const r = rules.find((x) => x.match.test(m));
      if (r) form.setError(r.field as never, { type: "server", message: m });
      return !r;
    });
    if (fromBody.length === 0 && unmatched.length > 0) setFormError(e);          // only unmapped text goes to the alert
    form.setFocus(/* first errored field */);
  };
  return { apply, formError, clear: () => setFormError(null) };
}
```

Per-form rule tables (the only place message text is matched; keep next to the form):

| Form | Rule | Field |
|---|---|---|
| Register | `/already exists/i` (409) | `email` (with "Sign in instead" link) |
| Verify email / reset | `/Invalid verification code\|Invalid.*reset code\|expired/i` | `otp` (reset flow: "Start over" action on expiry) |
| Login | `Invalid email or password` (401) | form-level alert, **not** a field (do not reveal which was wrong) |
| Login | `/blocked\|deleted/i` (403) | form-level alert, verbatim |
| Change password | `Current password is incorrect` (401) | `currentPassword` |
| Change password | `/no password set/i` (400) | form-level alert |
| Admin platform/feature | `/Duplicate Key\|already exists/i` | `key` / `slug` |
| Any upload | `/File too large\|Only image files/i` | the image field |

Other behaviours: 429 -> `FormAlert` + submit disabled for the cool-down; `validation` messages never block re-submit once the field changes (`form.clearErrors(field)` on change, RHF default for `mode: "onChange"` after first submit); successful submit `form.reset()` where the page stays (change password, name). Never put `password`/`otp` values in `defaultValues` for re-render, URLs, logs, or `sessionStorage`.

### 9.4 Register -> OTP is one component with two steps; reset carries `email` in the query string (auth-ui D3/D4). "Resend" re-calls register with in-memory values; if the page was refreshed the user retypes.

---

## 10. Error, empty and loading boundaries

### 10.1 One composition: `QueryBoundary` (`components/layout/states/`)

Combines the copied blocks into the CLAUDE.md rule 6 triple, so no page hand-rolls it:

```tsx
<QueryBoundary
  query={q}                                   // any TanStack query result
  skeleton={<CardSkeletonV2List count={3} />} // initial load only
  isEmpty={(data) => data.length === 0}
  empty={{ title: "No posts yet", message: "Create your first post.", action: <Link href="/create">New post</Link> }}
  notFound={<NotFoundState backHref="/dashboard" />}   // used when error.kind === "not_found"
  gate={{ forbidden: <UpgradeGate /> }}                // optional: map 403 to a gate instead of an error
>
  {(data) => <PostGrid items={data} />}
</QueryBoundary>
```

Internal order: `CustomSuspense isLoading={q.isPending}` (skeleton) -> `CustomErrorBoundary isError={q.isError && q.data === undefined}` with a **custom `fallback` = `ErrorState`** -> empty (`NoResultFoundWrapper` with a custom `fallback`, **never `showTryAgain`**, which does `window.location.reload()`) -> children.

- `CustomSuspense` shows its fallback until mounted (`useIsMounted`), which doubles as hydration safety; its built-in default fallback is the text "loading...", so always pass an explicit skeleton.
- `ErrorState` takes an `ApiError`: icon + `error.userMessage` + **Retry** (`q.refetch()`); `offline` kind adds the connectivity hint; `server` kind shows request-free generic copy. Used inline (cards, tables) and full-page.
- **Stale data + failed refetch:** if `q.data` exists the boundary keeps rendering it (no error screen) and the global `QueryCache.onError` toast informs once. A subtle `isFetching && !isPending` indicator (thin bar in `PageHeader`) shows background refreshes.
- Mutations use inline pending/disabled states and toasts (success via `sonner`), never the boundary.

### 10.2 Which view uses which state

| View type | Loading | Empty | Error | Notes |
|---|---|---|---|---|
| Card grid (connections, features, posts) | `CardSkeletonV2List` | `NoResultFoundWrapper` w/ action link | `ErrorState` + Retry | infinite: `ListFooterStatus` for next-page error |
| Table (executions, payments, admin) | row skeletons via `ListSkeleton` | "no results" (filtered vs unfiltered copy differ) | `ErrorState` | keep previous page visible while next loads |
| Detail (post, execution, payment, feature) | `ParagraphSkeleton` + `ImageSkeleton` | n/a | `not_found` -> `NotFoundState`; others -> `ErrorState` | polling detail keeps last data on poll errors |
| Session bootstrap | `AuthLoading` (shell-shaped skeleton) | n/a | `ErrorState` (never a redirect) | |
| Gated | none (no request when flag says no) | n/a | `forbidden` -> `UpgradeGate` / `AccessDenied` | |

### 10.3 Route-level boundaries (Next)

- `loading.tsx` per group: skeleton for first paint of the segment.
- `error.tsx` per group: client component receiving `{ error, reset }`; shows `ErrorState`-styled UI with `reset()`; **render** errors only (queries are handled by `QueryBoundary`).
- `not-found.tsx` per group (guarded group: home link is `/dashboard`; marketing: `/`) and a global one; `notFound()` is not called from client query errors (the boundary renders `NotFoundState` instead, since a 404 here is "data missing", not "route missing").
- `global-error.tsx` for root-layout failures (own `<html>`).

### 10.4 Copied-block adaptation debts (light-mode leftovers; fix in place, log in `decisions.md`)

These contradict "dark only, tokens only" and would be invisible/unreadable on the dark theme; each is a genuine bug per CLAUDE.md ("fix genuine bugs in place and log it"):

| Block | Problem |
|---|---|
| `pagination/Pagination.tsx` | hard-coded `text-[#292929]`, `hover:bg-gray-100`, `text-[#666]`, `text-white` on `bg-primary`; also `font-proxima-nova` |
| `placeholder/no-results-found-wrapper/NoResultFoundWrapper.tsx` | `text-[#141414]`, `text-[#666]`, pill button, `showTryAgain` reloads the whole page |
| `modal/veriations/DeleteConfirmModal.tsx` | `text-[#141414]`, `text-[#666]`, `!text-[40px]` heading, copy defaults mention "shift schedule" |
| `layouts/wrapper/error/error-ui-variations/DefaultErrorUI.tsx` | `text-[#141414]` (invisible on dark), no retry |
| `layouts/wrapper/CustomSuspense.tsx` | default fallback is bare "loading..." text |
| `form/fields/TextField.tsx`, `MultipageModal.tsx`, `SkeletonLibrary.tsx` | a few raw hex values (`grep "#[0-9a-f]"`) |

Plan: tokenise Pagination, NoResultFoundWrapper, DeleteConfirmModal, DefaultErrorUI in the first slice that uses each (Pagination: `exec`; NoResult: `conn`/`composer`; DeleteConfirmModal: `profile`; DefaultErrorUI: replaced by `ErrorState`, leave untouched). Visual details belong to `ui-spec.md`.

---

## 11. Security

### 11.1 No token in JS

- Auth is httpOnly cookies set by the backend (`accessToken` 1 d, `refreshToken` 7 d); no response body contains a token. The frontend has no `localStorage`/`sessionStorage`/memory token, no `Authorization` header (the backend would also accept `Bearer`, which we deliberately do not use), and never reads `document.cookie` for auth.
- `proxy.ts` (if enabled) only tests cookie *presence*; no JWT decode, no secret on the frontend.
- What may live in `sessionStorage`: `pay:id` (a payment id, non-secret, try/catch guarded, cleared on reset/success). Drafts (post text) may use `localStorage` later; never tokens, OTPs, passwords.
- `NEXT_PUBLIC_*` values are public by definition: only the API base URL and site URL; no secrets in the frontend repo or Vercel public vars.

### 11.2 Cookies across origins (decisions read: backend `docs/decisions.md` "Auth cookies": `lax` in dev, `none` + `secure` in production)

| Topology | Cookie is... | Consequences |
|---|---|---|
| Dev: `localhost:3000` -> `localhost:5000` | same-site (ports ignored) | `SameSite=Lax`, `secure=false` works; CORS allows `FRONTEND_URL=http://localhost:3000` with credentials |
| Prod direct: Vercel (`*.vercel.app` / custom) -> Render (`*.onrender.com`) | **third-party / cross-site** | Requires `SameSite=None; Secure` (backend already does this when `NODE_ENV=production`). Chrome's third-party cookie handling is now user-controlled and **Safari/Firefox block or partition third-party cookies by default**, so login can silently fail (200 on login, 401 on `/auth/me`). Also `CORS origin` is a single string (`FRONTEND_URL`), so Vercel preview URLs are rejected. |
| Prod proxy (recommended): browser -> Vercel -> rewrite -> Render | **first-party** to the Vercel host | Third-party cookie problem disappears; no CORS; no preflight; `Retry-After` readable; `proxy.ts` can see cookies. Trade-off: extra hop, Vercel rewrite limits (UNVERIFIED body size, timeout), Set-Cookie pass-through UNVERIFIED (3.2). |
| Prod same registrable domain (custom domain `app.example.com` + `api.example.com`) | same-site | Also fixes it; requires owning a domain; set cookie `Domain=.example.com` (backend change). Alternative to proxy mode. |

Recommendation: **proxy mode on Vercel; keep direct mode for local dev; verify Safari/Firefox/Chrome-incognito login before declaring `auth-ui` done.** The OAuth callback (LinkedIn/Facebook) and bKash return are top-level navigations to our own pages followed by API calls from our origin, so they work in either mode. The bKash callback and OAuth redirect URIs still point at the **backend** (`BKASH_CALLBACK_URL`) or at a **frontend route** (`<FRONTEND_URL>/connections/callback/<platform>`), per the conn design.

### 11.3 CSRF

With `SameSite=None` in production direct mode, cookies ride cross-site requests. State-changing endpoints are cookie-authenticated, so reasoning:

- JSON `POST/PATCH/DELETE`: a cross-origin `fetch` with `Content-Type: application/json` or a non-simple method triggers a **CORS preflight**, which the single-origin allowlist (`FRONTEND_URL`) rejects. Safe.
- **Preflight-free ("simple") POSTs are still possible** against routes that need no JSON body or accept multipart/urlencoded: `POST /auth/logout`, `POST /auth/refresh-token`, `POST /payments/create`, `POST /publications/:id/retry`, `POST /executions/:id/retry`, and multipart `POST /posts`, `PATCH`-less. `express.urlencoded` is enabled; `express.json` ignores `text/plain`. Impact is low (nuisance logout, an extra PENDING payment row, a retry of already-failed publishes) but real.
- Frontend mitigation implemented now: every request carries a custom header (`X-Requested-With`), which turns *our* requests into preflighted ones; legitimate calls are unaffected.
- **Backend follow-up (not our repo):** reject state-changing requests that lack that header (or whose `Origin` is not `FRONTEND_URL`). Until then the residual risk is as listed. In proxy mode the cookie is first-party and the same-origin proxy makes this moot for browsers on our site, but the backend is still reachable directly, so the follow-up still applies. Tracked as Q4.
- Never use `GET` for a mutation on the frontend. (`GET /connections/:platform/connect` and the OAuth callback are backend-defined GETs that create state/tokens; they are protected by the single-use `state` value, not by us.)

### 11.4 XSS and user content

- All user/server text (post title/content, `platformAccountName`, feature descriptions, audit `metadata`, error messages) is rendered as React text. **No `dangerouslySetInnerHTML` anywhere**; Biome rule `noDangerouslySetInnerHtml` stays on. Multi-line content uses `whitespace-pre-wrap`.
- Audit `metadata` JSON renders via `JSON.stringify(..., null, 2)` inside `<pre>` text.
- External links (`publication.externalUrl`, provider links): render only if `isSafeHttpUrl()` (`https:` or `http:`, parsed with `new URL`), with `target="_blank" rel="noopener noreferrer"`. Anything else renders as plain text.
- Images: `next/image` with explicit `remotePatterns`; `blob:` only for local previews.
- Headers (`next.config.ts headers()`): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` / `frame-ancestors 'none'`, `Permissions-Policy` minimal. A full nonce-based CSP is a later hardening (needs proxy nonce plumbing with Next inline scripts, **UNVERIFIED** effort); not in MVP. The OAuth callback route should additionally send `Referrer-Policy: no-referrer` and immediately `router.replace` to strip `code`/`state` from the URL after reading them.

### 11.5 Open redirect protection

`next` is only ever used through `safeNext()` (5.5): must start with a single `/`, no `//`, no backslash, no control characters, same-origin after `new URL` parsing, not an auth page (no loop), <= 512 chars. Unit-test the vectors: `//evil.com`, `/\evil.com`, `/%2F%2Fevil.com`, `https://evil.com`, `javascript:alert(1)`, `/\t/evil.com`, `/login?next=/login`.
Outbound redirects are allow-listed too (`lib/trusted-hosts.ts`): OAuth `authUrl` host must be a LinkedIn/Facebook host; bKash `redirectUrl` must be `https:` and a bKash host (**UNVERIFIED** exact hostnames, take them from the sandbox response and put them in config, never from the response itself). `window.location.assign` is called only after the check; otherwise toast "Unexpected payment redirect" and abort.

### 11.6 Env handling

Public vars only in `NEXT_PUBLIC_*`; `API_PROXY_TARGET` server-only; `lib/env.ts` validates on import (missing var fails the build/first request loudly); `.env*` ignored by git (`.env.example` committed). No URL is hard-coded outside `env.ts` and `next.config.ts` (CLAUDE.md rule 5). Never log `Set-Cookie`, request bodies, or `ApiError.body` of auth calls.

### 11.7 Other

- 5xx never echo server text (3.1: backend can leak raw `err.message` in production).
- Dev-only OTP in register/forgot responses is dropped in the api layer (3.5).
- Ownership/role/premium are server-side; the client never sends `userId`, `role`, or `isPremium`.
- Account enumeration: forgot-password shows the same neutral message in all cases; login shows one generic message.

---

## 12. Testing and verification per slice

No test runner is installed (`package.json` has none). Verification = type/lint/build gates + browser pass with Playwriter, as CLAUDE.md prescribes. Optional addition (log if adopted): `vitest` limited to **pure** modules where a regression is silent and costly: `safeNext`, `toApiError` mapping, `qk` key stability, `POLL` schedule function, `toPaginationMeta`, `buildFormData`, zod schemas. Open question Q7.

### 12.1 Gates (every slice, in order, all must pass before "done")

```
bun run lint            # biome check (add alias "check")
bunx tsc --noEmit       # add alias "typecheck"
bun run build           # production build; also catches missing <Suspense> around useSearchParams
```

Plus: `openspec validate <change> --strict` for the change being applied; `docs/decisions.md` entries exist for new dependencies/decisions (rule 11); no `any`; no hex colours; no `fetch`/`ofetch` outside `lib/apiClient.ts` (`grep -rn "ofetch\|fetch(" src --include=*.ts*` should only hit `lib/` and the OAuth/health helper if any).

### 12.2 Playwriter checklist template (copy per slice)

```
Slice: <name>        Build: <git sha / date>        Backend: local | render        Mode: direct | proxy
Accounts: guest | user (non-premium) | premium user | admin | super-admin   (admins seeded from backend env)

PRE
[ ] Backend up (/health ok), Redis + worker running (needed for publish/OTP flows)
[ ] DevTools: Preserve log on, Network cache disabled, Console cleared

HAPPY PATH (per spec scenario, one line each)
[ ] <scenario> -> expected UI -> expected requests (method, path, status) -> expected cache effect (matrix row #)

STATES (every async view)
[ ] Loading: throttle "Slow 3G" -> skeleton, no layout shift
[ ] Empty: account with no data -> empty state with action
[ ] Error: block the request / stop backend -> ErrorState with Retry; Retry recovers
[ ] Stale data + failed refetch -> data stays, single toast

AUTH / SESSION
[ ] Expire access cookie (delete `accessToken` in DevTools) -> next action silently refreshes (exactly 1 /auth/refresh-token for parallel calls)
[ ] Delete both cookies -> redirected to /login?next=<path>; after login lands back on <path>
[ ] next=//evil.com and next=https://evil.com -> land on /dashboard
[ ] Logout -> guest nav; Back button shows no cached private data; other tab flips to guest

ERRORS
[ ] 400 (validation) -> field/alert message;  401 business -> field;  403 -> gate/denied;  404 -> not-found state
[ ] 429 (force by repeated login) -> cool-down message, submit disabled, polling paused
[ ] Offline toggle -> offline banner, mutation fails fast, recovers on reconnect

RESPONSIVE / VISUAL
[ ] 375px and 1440px; dark tokens only (no light patches from copied blocks); focus rings; keyboard path through the flow

HYGIENE
[ ] Console clean (no warnings, no hydration mismatch); Network: no duplicate calls on mount, no request storms
[ ] No token/OTP/password in URL, storage, console, or Network *response* bodies except via Set-Cookie
[ ] bun run lint | bunx tsc --noEmit | bun run build  -> all green
```

### 12.3 Slice-specific must-checks

| Slice | Extra checks |
|---|---|
| core / auth | cross-browser cookie login (Chrome, Safari or Firefox) in the **deployed** topology; parallel-401 -> one refresh; guest vs network-error distinction; `reason=expired` redirect fires once |
| profile | `email` absent from PATCH body; avatar 6 MB and PDF rejected inline; wrong current password -> field error, no redirect |
| conn | callback double-mount (React strict mode) calls the API once; denied consent (`?error=`) makes no API call; FB picker survives refresh; `code`/`state` stripped from URL |
| composer | create with/without image; blank content blocked with zero requests; list second page on scroll; delete removes from list; foreign id -> not-found |
| exec | poll interval follows 6.2 (count requests over 2 min); no poll in hidden tab; single completion toast; retry resumes polling; 5-min notice (mock slow worker by pausing it) |
| pay | double-click -> one `POST /payments/create`; typing `/payment/success` unpaid never shows success; storage cleared -> fallback to latest payment; premium UI flips without reload |
| feat | non-premium makes zero data requests (gate before fetch); stale premium flag -> 403 -> gate + session refetch |
| admin | USER sees AccessDenied, ADMIN has no role control, SUPER_ADMIN does; own-row controls disabled; audit rows appear after each action; slug duplicate message on the field |

---

## 13. Environment, config and deployment

### 13.1 Frontend env

| Variable | Scope | Dev | Prod (Vercel) | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | public, build-time inlined | `http://localhost:5000/api/v1` | `/api/v1` (proxy mode) or the Render URL + `/api/v1` (direct) | existing; drives `env.isProxyMode` |
| `API_PROXY_TARGET` | server-only, read in `next.config.ts` | unset | `https://content-automation-backend-jwpw.onrender.com` | new; enables the rewrite |
| `NEXT_PUBLIC_SITE_URL` | public | `http://localhost:3000` | production URL | optional; `metadataBase`/OG (app-shell 4.5) |

Changing a `NEXT_PUBLIC_*` requires a rebuild (values are inlined). Preview deployments inherit proxy mode so they work without backend CORS changes.

### 13.2 Backend env the frontend depends on (owned by the backend repo)

| Variable | Needed value | Why |
|---|---|---|
| `NODE_ENV` | `production` on Render | switches cookies to `secure` + `SameSite=None`; hides error stack |
| `FRONTEND_URL` | the exact frontend origin (no trailing slash) | CORS single allowed origin (direct mode) |
| `FRONTEND_BASE_URL` | frontend base | bKash success/failure redirect targets (`/payment/success`, `/payment/failure`) |
| `LINKEDIN_REDIRECT_URI`, `FACEBOOK_REDIRECT_URI` | `<frontend origin>/connections/callback/<platform>` | conn D1; must match provider consoles exactly |
| `BKASH_CALLBACK_URL` | backend `/api/v1/payments/callback` | bKash calls the backend, not the frontend |
| `EXPOSE_OTP_IN_RESPONSE` | `false` in production | UI ignores it regardless |

### 13.3 Deployment notes

- Frontend: Vercel (decisions record the backend on Render; the Vercel choice for the frontend is the assumption in the brief, **UNVERIFIED** as a decision). Build command `bun run build`; Node runtime default; no edge runtime needed (Next 16 `proxy.ts` is Node).
- Backend on Render free tier: sleeps when idle -> cold start (3.8). Document the expected first-load delay in the UI copy for login ("Waking the server..." after 5 s of pending login) rather than failing.
- Verify after deploy, in order: (1) `GET /health` through the proxy; (2) login on Chrome + Safari/Firefox; (3) `/auth/me` returns the user on reload; (4) refresh cookie flow with an expired access cookie; (5) image upload of a ~4.5 MB photo through the rewrite; (6) OAuth round trip; (7) bKash sandbox return.
- Observability: console only in MVP; `logApiError` is the single hook point for a future provider.
- Rollback: proxy mode vs direct mode is an env switch (`NEXT_PUBLIC_API_BASE_URL`), no code change.

---

## 14. Risks and open questions

### 14.1 Risks (ranked)

| # | Risk | Impact | Mitigation | Status |
|---|---|---|---|---|
| K1 | Third-party cookies when Vercel and Render are different sites (Safari/Firefox block by default; Chrome policy-dependent) | Login appears to succeed then every call 401s | Proxy mode (11.2) or shared custom domain; test on Safari/Firefox before shipping | **UNVERIFIED** in this repo |
| K2 | Global limiter keyed by `req.ip` with no `trust proxy` set (grep of backend `src` finds none) behind Render's load balancer | One shared 300/15 min bucket, and one shared 20/15 min **auth** bucket, for **all users** | Backend: `app.set("trust proxy", 1)`; frontend: back-off polling (6), explicit 429 UX | **UNVERIFIED** in prod; check `RateLimit-Remaining` from two different clients |
| K3 | Global limiter 429 body is plain text, and `Retry-After` is unreadable cross-origin | Generic parse failures, no real cool-down | `toApiError` handles non-JSON; proxy mode exposes headers; fixed 60 s fallback | designed |
| K4 | Simple-request CSRF on body-less/multipart POSTs under `SameSite=None` | nuisance logout / extra payment row / retry | `X-Requested-With` on all requests; backend header/Origin check follow-up | backend follow-up Q4 |
| K5 | Unknown 5xx messages leak raw `err.message` in production responses | info disclosure in UI | never render 5xx text | designed |
| K6 | Validation errors are one joined string | brittle field mapping | rule tables per form; client zod mirrors backend so server 400 is rare; ask backend for `errors: [{path,message}]` | Q3 |
| K7 | Cold start on Render free tier (30-60 s, `502/503`) | failed first login/page | timeout 30 s + retry on `server`/`timeout`, "waking server" copy, optional warm-up ping | UNVERIFIED duration |
| K8 | Copied blocks have light-mode hex values and sibling-project copy | unreadable/invisible UI | tokenise per 10.4 as each is first used | planned |
| K9 | Refresh race / false logout | users bounced to login | single shared promise, `startedAt < lastRefreshAt`, transient != expired, tests in 12.3 | designed |
| K10 | Optimistic cache for infinite lists causing duplicates/skips (offset pagination) | duplicated or missing cards | `removeQueries` instead of patching pages; `dedupeById` on flatten | designed |
| K11 | `refetchInterval` + hidden tab/timer throttling skew the schedule | late status | `refetchOnWindowFocus` on the detail query; time-based (elapsed) not count-based back-off | designed |
| K12 | Single CORS origin: Vercel preview URLs and the apex vs `www` all fail in direct mode | preview deploys unusable | proxy mode | designed |
| K13 | Admin `Duplicate Key` is `400` (Prisma P2002 mapped by handler) while openspec expects `409` for features | wrong error kind | match on message in admin forms (9.3) | confirm in `api-contract.md` |
| K14 | Edge body limit on rewritten uploads (4.5 MB on Vercel functions; rewrites may differ) | upload of 4.6-5 MB images fails with 413 | compress toward 4 MB (8.2); map 413 | **UNVERIFIED** |

### 14.2 Open questions (need an owner decision or a backend change)

| # | Question | Needed by | Default if unanswered |
|---|---|---|---|
| Q1 | Is the backend on Render configured with `trust proxy`? (K2) | before deploy | assume not; ask backend to set it |
| Q2 | Does `Set-Cookie` (`SameSite=None; Secure`, no Domain) survive the Vercel rewrite and bind to the Vercel host? Does Safari/Firefox login work? | `auth-ui` verification | direct mode with shared custom domain as plan B |
| Q3 | Will the backend add structured validation details (`errors: [{ path, message }]`) to the error envelope? | `auth-ui` | message-pattern rule tables |
| Q4 | Will the backend require `X-Requested-With` or check `Origin` on state-changing requests? (K4) | before prod | frontend sends the header anyway |
| Q5 | Exact response shapes: `POST /posts` (full Post?), `POST /posts/:id/publish` 202 body (execution id/detail?), `GET /connections` status enum values, money field type | per slice | see `api-contract.md`; seed caches only when shape is confirmed |
| Q6 | Which hostnames do bKash (`redirectUrl`) and LinkedIn/Facebook (`authUrl`) use in sandbox/prod, and which hosts does the backend return for Cloudinary images? | `pay`, `conn`, `composer` | allow-list from first real responses, put in config |
| Q7 | Add `vitest` for pure-logic tests, or stay with type/lint/build + Playwriter only? | `auth-ui` | add vitest for the six pure modules in 12 (log a decision) |
| Q8 | Is indeterminate upload feedback acceptable, or is a true progress bar required (XHR path)? | `profile` | indeterminate |
| Q9 | PRD s.26 wants a read-only React Flow workflow graph on execution detail; no slice exists. In scope for this MVP? | planning | out of scope; add a slice (and the `@xyflow/react` decision) if wanted |
| Q10 | Should `proxy.ts` ship at all, or is the client guard enough? | after Q2 | skip `proxy.ts` unless Q2 confirms first-party cookies |
| Q11 | `/auth/google`: backend has `lib/googleAuth.ts` but no mounted route; confirm Google login stays out of scope | `auth-ui` | out of scope (R10) |
| Q12 | Marketing "Premium" teaser price: backend `PREMIUM_PRICE`/`PREMIUM_CURRENCY` are env-only and no public endpoint exposes them | `shell` | no hard-coded amount (shell risks) |

### 14.3 Decisions to log in `docs/decisions.md` when implemented (rule 11)

1. `api` wrapper over ofetch (envelope unwrap, `retry: 0`, `ApiError`), single-flight refresh, refresh-vs-redirect semantics (3.3).
2. Proxy-mode (same-origin rewrite) topology vs direct mode, and why (11.2).
3. `qk` key factory replacing literal keys (4.2); invalidation matrix as the contract (4.3).
4. Client `AuthGuard` as authority; optional `proxy.ts` only in cookie-visible mode (5.2).
5. Polling back-off schedule and rate-limit budget (6.2).
6. URL as source of truth for list filters; Pagination meta adapter (7.3); infinite scroll only for posts (7.1).
7. Upload policy: 5 MiB parity, 4 MB compress target, narrowed `accept`, indeterminate progress (8.2-8.3).
8. Server-error-to-field mapping via per-form rule tables (9.3).
9. `QueryBoundary` composition and the block-tokenisation fixes (10.1, 10.4).
10. `X-Requested-With` header, trusted-host allow-lists, security headers (11.3-11.5).
11. New scripts `check` / `typecheck`; optional `vitest` (12).
