# Backend API Contract (verified against source)

Source of truth: `D:\personal\small_project\content-automation-backend` (Express 5 style app, Prisma/Postgres, Redis, BullMQ, Cloudinary, bKash sandbox, zod v4).
Verified by reading: `src/app.ts`, every `src/app/module/*` (route/validation/controller/service/interface), `src/app/middleware/*`, `src/app/utils/*`, `src/app/lib/*`, `prisma/schema/*.prisma`, `.env.example`, `docs/*`, `openspec/changes/*`.
Postman collection has **no saved response examples** (0 `response` entries), so every response shape below is derived from controller/service code, not captured traffic. Anything not derivable from code is flagged **UNVERIFIED**.

Legend: **public** = no auth; **auth** = any logged-in ACTIVE user; **premium** = auth + `isPremium`; **admin** = role ADMIN or SUPER_ADMIN; **superadmin** = role SUPER_ADMIN only.

---

## 1. Global conventions

### 1.1 Base URL and mounting
- All feature routes are under `/api/v1`. Dev default: backend `http://localhost:5000`, frontend `http://localhost:3000` (`.env.example`: `BACKEND_URL`, `FRONTEND_URL`, `FRONTEND_BASE_URL`).
- Non-versioned: `GET /` -> `{ success: true, message: "Welcome to the Content Automation Platform API" }`, `GET /health` -> `{ success: true, status: "ok" }`.
- Mount table:

| Mount | Router |
|---|---|
| `/api/v1/auth` | AuthRoutes |
| `/api/v1/users` | UserRoutes |
| `/api/v1/admin/platforms` | PlatformAdminRoutes |
| `/api/v1/platforms` | PlatformRoutes (auth-only list) |
| `/api/v1/connections` | ConnectionRoutes |
| `/api/v1/posts` | PostRoutes **and** ExecutionRoutes (publish trigger `POST /posts/:id/publish`) |
| `/api/v1/publications` | PublicationRoutes (retry one) |
| `/api/v1/executions` | ExecutionRetryRoutes (list, detail, retry whole) |
| `/api/v1/payments` | PaymentRoutes |
| `/api/v1/admin/upcoming-features` | UpcomingFeatureAdminRoutes |
| `/api/v1/upcoming-features` | UpcomingFeatureRoutes (premium) |
| `/api/v1/admin/users` | AdminUserRoutes |
| `/api/v1/admin/audit-logs` | AdminAuditLogRoutes |

### 1.2 Success envelope
Every module endpoint (except the two redirecting/health ones) responds with `sendResponse`:

```ts
interface ApiSuccess<T> {
  success: true;
  statusCode: number;      // mirrors HTTP status
  message: string;         // human string, safe to toast
  data: T;                 // `null` for "action" endpoints
  meta?: PageMeta;         // ONLY on paginated lists; key absent otherwise
}
interface PageMeta { page: number; limit: number; total: number; totalPages: number }
```

### 1.3 Error envelope
Produced by `globalErrorHandler` (any `AppError`, Prisma error, or other thrown error):

```ts
interface ApiError {
  success: false;
  statusCode: number;
  name: string;      // "Error" in production; err.name in development
  message: string;   // always a human string; show it to the user
  error?: unknown;   // development only (full error object)  -> never rely on it
  stack?: string;    // development only
}
```
Other error shapes that differ (the client must tolerate all):
- **404 unmatched route** (`notFound`): `{ success:false, message:"Route not found", path:string, date:string }` (no `statusCode`).
- **429 from `authLimiter`**: `{ success:false, statusCode:429, message:"Too many attempts. Please try again later." }`.
- **429 from the global limiter (300/15min/IP)**: express-rate-limit default handler -> **plain text body** ("Too many requests, please try again later."), not JSON. Client must not blindly `res.json()` on 429. (UNVERIFIED exact text; library default.)
- **Malformed JSON body / body-parser errors**: handler uses `err.message` and status **500** unless the error is an `AppError`/Prisma error (body-parser's own `err.status=400` is NOT read). Expect HTTP 500 with a parse message. (Derived from handler code; UNVERIFIED by live run.)
- Prisma mapping: `P2002` -> 400 "Duplicate Key Error"; `P2003` -> 400 "Foreign key constraint failed"; `P2025` -> 400 "An operation failed because it depends on one or more records that were required but not found."; PrismaClientValidationError -> 400 "You have provided incorrect field type or missing fields"; DB unreachable P1001 -> 400 "Can't reach database server"; unknown query error -> 500 "Error occurred during query execution".

### 1.4 Validation error shape
`validateRequest(zodSchema)` runs on `req.body` only (never query/params). On failure it throws `AppError(400, issues.map(i => i.message).join(", "))`. So:
- Status **400**, standard `ApiError`, **no structured field map**. `message` is a comma-joined list, e.g. `"Invalid email address, Password must be at least 8 characters long"`.
- The frontend cannot reliably attribute a message to a field; match on known substrings or show a form-level error. Custom messages exist for most fields (listed per endpoint). When a required key is **missing/wrong type**, zod v4's default message is used (e.g. `"Invalid input: expected string, received undefined"`) rather than the custom text. (UNVERIFIED exact default text.)
- Unrecognised body keys are silently stripped (zod default), never rejected.
- On success `req.body` is replaced by the parsed/trimmed data (strings are trimmed where the schema says `.trim()`).

### 1.5 Authentication, cookies, CORS
- Auth is by **httpOnly cookies**; tokens are never in JSON bodies.

| Cookie | Content | maxAge | Flags |
|---|---|---|---|
| `accessToken` | JWT (payload `{userId,name,email,role}`), lifetime `JWT_ACCESS_EXPIRES_IN` (`.env.example`: `1d`) | 1 day (`86_400_000` ms) | `httpOnly`, `secure = NODE_ENV==="production"`, `sameSite = production ? "none" : "lax"`, path `/` (default) |
| `refreshToken` | JWT, lifetime `JWT_REFRESH_EXPIRES_IN` (`7d`) | 7 days | same flags |

- Server-side token read order in `auth()`: `req.cookies.accessToken` first; else `Authorization: Bearer <jwt>`; else raw `Authorization` header value (no `Bearer`). The refresh endpoint reads `req.cookies.refreshToken` else `body.refreshToken`.
- CORS: `cors({ origin: FRONTEND_URL (single origin string), credentials: true })`. Frontend **must** send `credentials: "include"` (fetch) / `withCredentials: true` (axios) on every call. Only one origin is allowed; there is no wildcard or multi-origin list. Default cors methods cover GET/POST/PATCH/DELETE. Helmet default headers are on.
- Dev note: `sameSite=lax` + non-secure works because `localhost:3000` -> `localhost:5000` is same-site. In production frontend and backend are on different sites -> `SameSite=None; Secure` (HTTPS required) and third-party-cookie blocking (Safari/Chrome) can break sessions. Next.js middleware can only see these cookies if frontend and backend share a registrable domain or requests are proxied via same-origin rewrites. **UNVERIFIED** (deploy topology not defined in backend docs).
- `auth()` re-reads the user from the DB on **every** request (not just JWT claims): blocked, soft-deleted, or missing user -> 401 immediately even with a valid token. Role is read live from DB, not the JWT.
- `requirePremium` re-reads `isPremium` live from DB.

### 1.6 Auth failure messages (all protected routes)
| Status | message | When |
|---|---|---|
| 401 | `You are not logged in. Please log in to access this resource.` | no cookie / no Authorization header (also when the 1-day access cookie has aged out) |
| 401 | `Your session is invalid or has expired. Please log in again.` | JWT bad/expired |
| 401 | `Your session is no longer valid. Please log in again.` | user deleted, missing, or `status !== ACTIVE` (blocked) |
| 403 | `Forbidden. You don't have permission to access this resource.` | role not in allowed roles |
| 403 | `This area is for premium members` | `requirePremium` and `isPremium=false` |

### 1.7 Refresh-token behaviour
- **There is no automatic refresh.** The access cookie expires at 1 day (cookie maxAge equals JWT lifetime), after which the browser stops sending it and the API answers 401 "You are not logged in...". The frontend should, on a 401 from a protected route, call `POST /auth/refresh-token` once; if it returns 200 retry the original call once; if 401, redirect to login.
- Refresh **rotates both cookies** (new access + new refresh). Old refresh JWTs are not revoked server-side (stateless; no denylist) - **UNVERIFIED** only in the sense that no revocation list exists in code.
- Refresh is not rate limited by `authLimiter` (only the global limiter).
- Logout only clears cookies (idempotent, unauthenticated); it does not invalidate JWTs.

### 1.8 Rate limiters
| Limiter | Scope | Limit | Response on trip |
|---|---|---|---|
| Global (`app.ts`) | all routes, per IP | **300 requests / 15 min** (`standardHeaders` on -> `RateLimit-*` headers) | 429 plain text (default handler) |
| `authLimiter` | `POST /auth/register`, `/verify-email`, `/login`, `/forgot-password`, `/reset-password` | **20 requests / 15 min per IP**, ONE shared counter across all five routes (same limiter instance), successful requests count too | 429 JSON `Too many attempts. Please try again later.` |

`trust proxy` is not configured: behind a reverse proxy/Vercel rewrite all clients may share the proxy IP and exhaust the limits together. **UNVERIFIED** deploy impact.

### 1.9 Pagination
- Query params: `page` (default `1`, min 1), `limit` (default `10`, **max 100**, min 1). Both parsed with `parseInt`; non-numeric/empty -> defaults silently; `limit=0` -> 10; negative `limit` -> clamped to 1; `page<1` -> 1. **Never a 400 for bad paging params.**
- Response `meta`: `{ page, limit, total, totalPages }` where `totalPages = ceil(total/limit)` (0 when `total` is 0).
- Paginated endpoints: `GET /posts`, `GET /executions`, `GET /payments`, `GET /admin/users`, `GET /admin/audit-logs`. **Not** paginated (full arrays, no `meta`): `GET /platforms`, `GET /admin/platforms`, `GET /connections`, `GET /upcoming-features`, `GET /admin/upcoming-features`.
- Sort syntax (where supported): `sort=<field>` ascending or `sort=-<field>` descending; unsupported field silently falls back to `-createdAt`.
- Unknown/invalid filter values (e.g. `status=FOO`, unparsable `dateFrom`) are **silently ignored** (no error).

### 1.10 Ids, dates, numbers
- ids: UUID v4 strings (`@default(uuid())`). Exceptions: platform `key` and feature `slug` are lowercase slugs (`^[a-z0-9-]+$`); `AuditLog.entityId` is a string that may be a platform key (see audit section).
- Dates: ISO-8601 UTC strings (`Date.toJSON`), e.g. `2026-09-07T06:31:50.123Z`. Typed as `string` in TS. Nullable ones are `null`.
- `Payment.amount` is Prisma `Decimal(10,2)` -> serialized as a **string** (e.g. `"500"`; exact trailing-zero format UNVERIFIED). Use `Number(...)`/formatting on display only.
- `PUT` is never used; updates are `PATCH`.

### 1.11 File uploads (multer)
- In-memory storage, **5 MB** max (`5 * 1024 * 1024`), `mimetype` must start with `image/` (no extension/dimension checks). One file per request, single named field per route (field names below).
- multer errors are converted to **400** with: `"Only image files are allowed"` (wrong type), `"File too large"` (>5 MB; multer's message), `"Unexpected field"` (wrong field name; multer message). Missing file -> 400 `"No image file provided"` (avatar/logo/feature image).
- Do **not** set `Content-Type` manually for multipart; let the browser add the boundary.
- Images are stored on Cloudinary (`secure_url` returned as `*Url`). Cloudinary failures surface as **500** with the provider message (generic error path). Replacing an image best-effort deletes the previous asset.

### 1.12 Enums (copied from `prisma/schema/enums.prisma`)
```ts
type Role = "SUPER_ADMIN" | "ADMIN" | "USER";
type UserStatus = "ACTIVE" | "BLOCKED";
type AuthProvider = "CREDENTIALS" | "GOOGLE";
type PlatformStatus = "LIVE" | "COMING_SOON";
type ExecutionStatus = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIALLY_COMPLETED" | "FAILED";
type PublicationStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
type AttemptStatus = "RUNNING" | "SUCCESS" | "FAILED";           // not exposed directly by any endpoint
type PaymentProvider = "BKASH";
type PaymentPurpose = "PREMIUM_UPGRADE";
type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
type UpcomingFeatureStatus = "COMING_SOON" | "IN_DEVELOPMENT" | "PLANNED";
// Derived (not in Prisma): connection.status
type ConnectionStatus = "CONNECTED" | "EXPIRED";
```
There is **no `PostStatus`**; posts have only `isDeleted`. There is no DRAFT/SCHEDULED concept.

### 1.13 Email, queue and background side effects (global)
- Emails are sent through Gmail SMTP via nodemailer; **failures are swallowed** (logged only). An endpoint can return 200 although the email never arrived.
- Templates in repo: `verify-email`, `forgot-password`, `password-changed`, `publish-result`. **`publish-result` is never sent** by any code path (grep-verified) - do not promise "we emailed you the result".
- Publishing runs in a BullMQ worker (queue name `publish`, `attempts: 1`, no auto-retry). Manual retry only. No SSE/WebSocket/webhook to the client: **poll** `GET /executions/:id`.
- On boot the server seeds (idempotent upserts): platforms `linkedin` ("LinkedIn", LIVE, sort 1), `facebook` ("Facebook Page", LIVE, sort 2); 3 upcoming features (`ai-content-enhancement` IN_DEVELOPMENT, `scheduled-publishing` PLANNED, `analytics-dashboard` COMING_SOON); SUPER_ADMIN/ADMIN accounts from env if set. No admin-signup endpoint exists.
- Premium price: env `PREMIUM_PRICE` (default `500`) + `PREMIUM_CURRENCY` (default `BDT`). The price is **not exposed by any endpoint** (see gaps).

---

## 2. Shared TypeScript types (copy into `src/types`)

```ts
// ---- envelope ----
export interface PageMeta { page: number; limit: number; total: number; totalPages: number }
export interface ApiSuccess<T> { success: true; statusCode: number; message: string; data: T; meta?: PageMeta }
export interface ApiError { success: false; statusCode?: number; name?: string; message: string; path?: string; date?: string }

// ---- user ----
// Raw `users` row. Returned verbatim by auth verify-email / login / GET /auth/me.
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatarUrl: string | null;
  avatarPublicId: string | null;   // internal Cloudinary id, ignore in UI
  role: Role;
  isPremium: boolean;
  premiumSince: string | null;
  status: UserStatus;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
// /users/me family: User + providers (never contains passwordHash)
export interface UserProfile extends User { providers: AuthProvider[] }

// Admin safe projection (admin/users endpoints)
export interface AdminUser {
  id: string; name: string; email: string; role: Role; isPremium: boolean;
  premiumSince: string | null; status: UserStatus; emailVerified: boolean;
  isDeleted: boolean; createdAt: string;
}

// ---- platform ----
export interface Platform {
  id: string; key: string; name: string;
  logoUrl: string | null; logoPublicId: string | null;
  status: PlatformStatus; isActive: boolean; sortOrder: number;
  createdAt: string; updatedAt: string;
}

// ---- connection ----
export interface Connection {
  id: string;
  platform: { key: string; name: string };
  platformAccountName: string | null;
  status: ConnectionStatus;          // "EXPIRED" iff expiresAt < now
  expiresAt: string | null;
  createdAt: string;
}
export type ConnectCallbackResult =
  | { kind: "connected"; connection: Connection }
  | { kind: "select-page"; pages: FacebookPage[] };
export interface FacebookPage { id: string; name: string }

// ---- post ----
export interface Post {            // raw `posts` row
  id: string; userId: string;
  title: string | null; content: string;
  imageUrl: string | null; imagePublicId: string | null;
  isDeleted: boolean; deletedAt: string | null;
  createdAt: string; updatedAt: string;
}

// ---- execution ----
export interface ExecutionListItem {
  id: string; status: ExecutionStatus;
  startedAt: string | null; completedAt: string | null; createdAt: string;
  post: { id: string; title: string | null; contentPreview: string };   // first 140 chars
  platforms: { key: string; name: string; status: PublicationStatus }[];
}
export interface PublicationDetail {
  id: string;
  platform: { key: string; name: string };
  platformAccountName: string | null;       // snapshot at publish time
  status: PublicationStatus;
  externalPostId: string | null;
  externalPostUrl: string | null;
  publishedAt: string | null;
  failureReason: string | null;             // only when status === "FAILED"
  retryable: boolean;                       // === (status === "FAILED")
  retryCount: number;                       // attempts - 1
}
export interface ExecutionDetail {
  id: string; status: ExecutionStatus;
  startedAt: string | null; completedAt: string | null; createdAt: string;
  post: { id: string; title: string | null; content: string; imageUrl: string | null; isDeleted: boolean };
  publications: PublicationDetail[];
}
export interface StartPublishResult { executionId: string; status: ExecutionStatus } // status "PENDING"
export interface RetryPublicationResult { executionId: string; publicationId: string }
export interface RetryExecutionResult { executionId: string; retried: number }

// ---- payment ----
export interface Payment {
  id: string; provider: PaymentProvider; purpose: PaymentPurpose;
  amount: string;                // Prisma Decimal serialized as string
  currency: string;              // "BDT"
  status: PaymentStatus;
  merchantInvoiceNumber: string; // "INV-<uuid>"
  providerTransactionId: string | null;   // bKash trxID once SUCCESS
  paidAt: string | null; createdAt: string;
}
export interface CreatePaymentResult { paymentId: string; redirectUrl: string }

// ---- upcoming feature ----
export interface UpcomingFeature {
  id: string; slug: string; title: string; shortDescription: string; description: string;
  imageUrl: string | null; imagePublicId: string | null;
  status: UpcomingFeatureStatus; sortOrder: number; isPremiumVisible: boolean;
  createdAt: string; updatedAt: string;
}

// ---- audit ----
export interface AuditLog {
  id: string; actorId: string | null; action: string; entityType: string;
  entityId: string | null; metadata: Record<string, unknown> | null;
  ipAddress: string | null; userAgent: string | null; createdAt: string;
}
```

---

## 3. Auth module - `/api/v1/auth`

Registration is a two-step OTP flow. No `users` row exists until the OTP is verified; the pending record lives in Redis for **5 minutes** (`OTP_TTL_SECONDS = 300`). Emails are normalized (`trim().toLowerCase()`) server-side.

### 3.1 `POST /auth/register`
- Access: public. Rate limit: `authLimiter`.
- Headers: `Content-Type: application/json`.
- Body (zod): `name` string, trimmed, min 1 (`"Name is required"`); `email` valid email (`"Invalid email address"`); `password` string min **8** (`"Password must be at least 8 characters long"`). No max, no complexity rules.
- Success **200** (note: 200, not 201): message `"A verification code has been sent to your email"` (controller message), data:
  ```ts
  interface RegisterResult { email: string /*normalized*/; message: string; otp?: string /* DEV ONLY */ }
  ```
  `otp` is present only when `NODE_ENV !== "production"` **and** `EXPOSE_OTP_IN_RESPONSE=true` (`.env.example` default false; the repo `.env` reportedly has it true for manual testing). Never rely on it in the UI except behind a dev flag.
- Errors: 400 validation (comma-joined); **409** `An account with this email already exists` (any existing user row, including soft-deleted accounts - emails stay reserved); 429.
- Side effects: hashes password (bcrypt), stores pending registration + OTP in Redis (5 min), emails the OTP ("Verify your email"; failure swallowed).
- Idempotency/quirk: calling register again for the same email **overwrites** the pending record and issues a **new OTP** - this is the de-facto "resend code" (there is no resend endpoint). It consumes `authLimiter` budget. Pending registration and OTP are separate keys, both 5 min.

### 3.2 `POST /auth/verify-email`
- Access: public. `authLimiter`.
- Body: `email` valid email; `otp` string, exactly 6 chars (`"OTP must be exactly 6 digits"`) and `/^\d{6}$/` (`"OTP must contain only digits"`).
- Success **201**, message `"Email verified. Your account is ready"`, data: `User` (raw row). **Sets cookies `accessToken` + `refreshToken`** (user is logged in immediately).
- Errors: 400 `"Your verification code has expired. Please register again"` (OTP key missing/expired); 400 `"Invalid verification code"`; 400 `"Your registration has expired. Please register again"`; 409 `"An account with this email already exists"`; 429.
- Quirk: the OTP is **not** invalidated after a wrong guess (no attempt counter) - brute-force protection is only the shared IP limiter (20/15min). After success both Redis keys are deleted.

### 3.3 `POST /auth/login`
- Access: public. `authLimiter`.
- Body: `email` valid email; `password` string min 1 (`"Password is required"`).
- Success **200**, `"Logged in successfully"`, data: `User` (raw row, **without** `providers`). Sets both cookies.
- Errors: **401** `"Invalid email or password"` (unknown email, wrong password, or no password identity - indistinguishable); **403** `"This account has been deleted"`; **403** `"This account has been blocked"` (only revealed after the password is correct); 429.
- Quirk: there is no "email not verified" login error because unverified users do not exist in the DB. No Google login route exists (see gaps).

### 3.4 `POST /auth/refresh-token`
- Access: public (needs a refresh token). No `authLimiter`, no body validation.
- Token source: `refreshToken` cookie, else JSON body `{ refreshToken }`.
- Success **200**, `"Session refreshed successfully"`, `data: null`. **Sets rotated cookies.**
- Errors: 401 `"Refresh token is missing"`; 401 `"Invalid or expired refresh token"`; 401 `"Your session is no longer valid. Please log in again"` (deleted/blocked).

### 3.5 `POST /auth/logout`
- Access: public (intentionally unguarded). No body.
- Success **200**, `"Logged out successfully"`, `data: null`. **Clears both cookies** (with the same flags). Always succeeds.

### 3.6 `GET /auth/me`
- Access: auth.
- Success **200**, `"Profile fetched successfully"`, data: `User` (raw row, **no `providers`** - use `GET /users/me` when providers are needed).
- Errors: 401 (see 1.6); 404 `"User not found"` (deleted).

### 3.7 `POST /auth/forgot-password`
- Access: public. `authLimiter`.
- Body: `email` valid email.
- Success **200** always (anti-enumeration), message `"If an account exists for that email, a password reset code has been sent."`; data: `null`, or `{ otp: string }` in dev when `EXPOSE_OTP_IN_RESPONSE` and an eligible account exists (this `otp` presence leaks existence in dev only).
- Eligible = CREDENTIALS identity with password, ACTIVE, not deleted. Others get the same response and no email. OTP TTL 5 min, emailed ("Reset your password").
- Quirk: calling again overwrites the OTP (de-facto resend).

### 3.8 `POST /auth/reset-password`
- Access: public. `authLimiter`.
- Body: `email`; `otp` (6 digits, same rules); `newPassword` min 8 (`"New password must be at least 8 characters long"`).
- Success **200**, message `"Password reset successfully. You can now log in with your new password."`, `data: null`. **Does not log the user in and does not touch cookies.** Emails "Your password was changed".
- Errors: 400 `"Invalid or expired reset code"` (bad/expired code or no account); 429.
- Quirk: does not revoke existing sessions/JWTs.

---

## 4. User module - `/api/v1/users` (all **auth**)

Shape returned by profile writes: `UserProfile` (= `User` + `providers`).

| Method + path | Body / params | Success | Notes |
|---|---|---|---|
| `GET /users/me` | - | 200 `"Profile fetched successfully"`, `UserProfile` | 404 `"User not found"` if deleted |
| `PATCH /users/me` | JSON `{ name }` (string, trimmed, min 1, `"Name is required"`) | 200 `"Profile updated successfully"`, `UserProfile` | `email` and other keys are **silently ignored** |
| `PATCH /users/me/avatar` | multipart, file field **`avatar`** (image/*, <=5 MB) | 200 `"Avatar uploaded successfully"`, `UserProfile` | 400 `"No image file provided"` / multer messages; replaces old Cloudinary asset best-effort |
| `DELETE /users/me/avatar` | - | 200 `"Avatar removed successfully"`, `UserProfile` (avatarUrl null) | idempotent (succeeds with no avatar) |
| `PATCH /users/me/password` | JSON `{ currentPassword (min1, "Current password is required"), newPassword (min 8, "New password must be at least 8 characters long") }` | 200 `"Password changed successfully"`, `data:null` | 401 `"Current password is incorrect"` (**note: 401 for a field error - do NOT treat as session expiry / do not auto-logout or auto-refresh on this one**); 400 `"This account has no password set. Use forgot-password to set one first."`; emails "Your password was changed"; no cookie change, other sessions stay valid |
| `DELETE /users/me` | - | 200 `"Account deleted successfully"`, `data:null`; **clears both cookies** | **soft delete** (`isDeleted`, `deletedAt`); email stays reserved forever (re-register -> 409); no password confirmation required; irreversible from the UI's view (no restore endpoint); does not remove their posts/connections/executions |

Common errors on every route: 401 (1.6), 404 `"User not found"`.
Quirk: `PATCH /users/me` etc. use a separate path from `GET /auth/me`; both exist; prefer `/users/me` for the profile page and `/auth/me` for bootstrap (cheaper: no accounts join).

---

## 5. Platform module

### 5.1 Public/auth list - `GET /api/v1/platforms`
- Access: **auth** (despite the "public" name in docs; unauthenticated callers get 401).
- Success **200** `"Platforms fetched successfully"`, `data: Platform[]` ordered by `sortOrder asc`, only `isActive = true`. **Includes `COMING_SOON` platforms** (UI should show them disabled; only `status === "LIVE"` can be connected/published).
- No pagination, no query params.

### 5.2 Admin - `/api/v1/admin/platforms` (**admin**)
| Method + path | Request | Success | Errors |
|---|---|---|---|
| `POST /` | JSON: `key` (trimmed, min1, `/^[a-z0-9-]+$/`, messages `"Key is required"`, `"Key must be a lowercase slug (letters, numbers, hyphens)"`), `name` (trimmed min1 `"Name is required"`), `status?` PlatformStatus (default COMING_SOON), `sortOrder?` **integer number** (a string fails), `isActive?` boolean (default true) | **201** `"Platform created successfully"`, `Platform` | 409 `"A platform with this key already exists"`, 400 validation |
| `GET /` | - | 200 `"Platforms fetched successfully"`, `Platform[]` incl. inactive, `sortOrder asc` | - |
| `GET /:id` | - | 200 `"Platform fetched successfully"`, `Platform` | 404 `"Platform not found"` |
| `PATCH /:id` | JSON: any of `name`, `status`, `sortOrder`, `isActive`. `key` is **immutable** (stripped if sent) | 200 `"Platform updated successfully"`, `Platform` | 404; 400 validation. Empty body `{}` is accepted (no-op) |
| `PATCH /:id/logo` | multipart field **`logo`** | 200 `"Platform logo updated successfully"`, `Platform` | 400 `"No image file provided"` + multer messages; 404 |

- No DELETE: a platform is "retired" with `PATCH { isActive:false }` (it then disappears from the public list; existing connections/publications keep their FK).
- Audit rows written: `PLATFORM_CREATED`, `PLATFORM_UPDATED` (logo set is **not** audited).
- Quirk: setting a platform `status` to LIVE does not mean a connector exists. Only keys `linkedin` and `facebook` have connectors/publishers; other LIVE keys get 501 on connect (5.3 below / section 6).

---

## 6. Connection module - `/api/v1/connections`

Tokens are AES-256-GCM encrypted at rest and never returned. One connection per `(user, platform)`; reconnecting upserts. Disconnect hard-deletes.

### 6.1 `GET /connections`
- Access: auth. Success **200** `"Connections fetched successfully"`, `data: Connection[]` ordered by `createdAt asc`. Includes `status: "EXPIRED"` ones (derived from `expiresAt`). No pagination.

### 6.2 `GET /connections/:platform/connect`
- Access: auth. `:platform` = platform **key** (e.g. `linkedin`, `facebook`).
- Success **200** `"Authorization URL generated"`, `data: { authUrl: string }`. Frontend does `window.location.href = authUrl`.
- Issues a single-use random `state` stored in Redis for **10 minutes**, bound to `{userId, platformKey}`.
- Errors: 404 `"Platform not found"`; 400 `"This platform is not available to connect yet"` (status != LIVE; note `isActive=false` is **not** checked); 501 `"No integration is wired for this platform yet"`.
- LinkedIn scopes: `openid profile w_member_social`. Facebook scopes: `pages_show_list,pages_manage_posts,pages_read_engagement`.

### 6.3 `GET /connections/:platform/callback?code=&state=`
- Access: **public (NOT auth-guarded)** - identity comes from the `state`.
- **Returns JSON, not a redirect** (see gaps). Status 200, with `data` of `ConnectCallbackResult`:
  - LinkedIn and Facebook-with-exactly-one-Page: message `"Platform connected successfully"`, `{ kind:"connected", connection: Connection }`.
  - Facebook with 0 or 2+ Pages: message `"Select a Page to finish connecting"`, `{ kind:"select-page", pages: FacebookPage[] }` (the page list can be **empty** if the user administers no Pages - handle this state). Held in Redis for 10 min keyed by userId (one in-flight Facebook connect per user).
- Errors: 400 `"Invalid or expired OAuth state"` (unknown, expired, replayed, or state for a different platform); 400 `"Missing authorization code"` (e.g. user denied consent: provider sends `?error=access_denied&state=...` and no `code`; state is consumed); 400 `"This platform is not available to connect yet"`; 404 `"Platform not found"`; 501; **502** `"Failed to exchange LinkedIn authorization code"`, `"Failed to fetch LinkedIn member identity"`, `"Failed to exchange Facebook authorization code"`, `"Failed to obtain a long-lived Facebook token"`, `"Failed to list Facebook Pages"`, `"No Facebook Page returned"`.
- Cookies: none set/needed.
- Provider redirect URIs are configured in backend env as `LINKEDIN_REDIRECT_URI` / `FACEBOOK_REDIRECT_URI` = `http://localhost:5000/api/v1/connections/<key>/callback` (the **backend** URL). With those values the browser lands on raw JSON at the backend origin. To drive this from the SPA the redirect URIs must be changed (backend env + provider consoles) to a **frontend route** that then calls this endpoint with `fetch(..., {credentials:"include"})` passing the `code` and `state` it received. **UNVERIFIED** end-to-end (backend docs only record the idea in `docs/credentials-setup-log.md`; live OAuth was never automated).

### 6.4 `GET /connections/facebook/pages`
- Access: auth. Success **200** `"Facebook Pages fetched successfully"`, `data: FacebookPage[]`.
- Error: 400 `"No Facebook Page selection in progress. Start connecting Facebook first."` (nothing stashed or >10 min). Static route registered before `/:platform/*`.

### 6.5 `POST /connections/facebook/select-page`
- Access: auth. Body `{ pageId: string }` (trimmed, min 1, `"pageId is required"`).
- Success **200** `"Facebook Page connected successfully"`, `data: Connection` (platform.key `facebook`). Clears the stash.
- Errors: 400 `"No Facebook Page selection in progress. Start connecting Facebook first."`; 400 `"That Page is not among your available Pages"`; 400/404 from LIVE gate.
- Quirk: the Page token has no `expiresAt`, so `status` will read `CONNECTED` even if Facebook later invalidates it; the failure only shows at publish time as a FAILED publication.

### 6.6 `DELETE /connections/:platform`
- Access: auth. Success **200** `"Platform disconnected successfully"`, `data: null`.
- Errors: 404 `"Platform not found"`; 404 `"You are not connected to this platform"` (so a second DELETE is a 404, not idempotent).
- Audit: `CONNECTION_DISCONNECTED` (entityType `SocialConnection`, **entityId = platform key**, not a uuid).
- Side effect: history keeps `platformAccountName` snapshot; retries will require reconnecting first.

---

## 7. Post module - `/api/v1/posts` (all **auth**, owner-scoped)

Posts are **immutable** (no PATCH/PUT; `PATCH /posts/:id` -> 404 "Route not found"). Delete is soft; executions still show the content.

### 7.1 `POST /posts`
- Body: **multipart/form-data** (or JSON works too if no image: multer is a no-op for non-multipart; UNVERIFIED live). Fields: `content` string trimmed min 1 (`"Content is required"`; **no max length**), `title` optional string (trimmed; empty/whitespace becomes absent), file field **`image`** (optional, image/*, <=5 MB).
- Order of middleware: multer first, then zod, so multer errors (400) surface before content validation.
- Success **201** `"Post created successfully"`, `data: Post` (raw row; `imageUrl` is a Cloudinary URL).
- Errors: 400 validation/multer; 401; 500 on Cloudinary failure.
- No idempotency key: double submit creates two posts.
- Quirk: platform-specific limits (LinkedIn/Facebook text length, image size) are not validated here; they surface later as FAILED publications.

### 7.2 `GET /posts`
- Query: `page`, `limit` (default 10, max 100), `sort` (`createdAt` | `title`, optional `-` prefix; default `-createdAt`), `search` (case-insensitive contains over `content` OR `title`; empty string = no filter).
- Success **200** `"Posts fetched successfully"`, `data: Post[]`, `meta: PageMeta`. Excludes soft-deleted.

### 7.3 `GET /posts/:id`
- Success **200** `"Post fetched successfully"`, `Post`. 404 `"Post not found"` for missing, soft-deleted, or someone else's post (indistinguishable).

### 7.4 `DELETE /posts/:id`
- Success **200** `"Post deleted successfully"`, `data:null`. 404 `"Post not found"`. Second delete -> 404. Cloudinary image is **not** removed.

---

## 8. Execution / publish module

### 8.1 `POST /posts/:id/publish`  (path param is the **post id**)
- Access: auth (owner of post).
- Body JSON: `{ platforms: string[] }` - platform **keys**, min 1 element (`"Select at least one platform to publish to"`), each trimmed non-empty. No max; duplicates are de-duplicated server-side.
- Success **202** `"Publishing started"`, `data: { executionId: string; status: "PENDING" }`.
- Errors: 400 validation; 404 `"Post not found"` (missing, deleted, not yours); 400 `"This post has no content to publish"`; 404 `"Unknown platform: <key>"`; 400 `"<Platform name> is not available to publish to yet"` (status not LIVE); 400 `"Connect <Platform name> before publishing to it"` (no connection). Validation is all-or-nothing and sequential: the first failing platform's message is returned.
- Side effects: creates `Execution` (PENDING) + one `Publication` (PENDING) per platform with an account-name snapshot, then enqueues a BullMQ job. Worker processes platforms **sequentially**, one attempt each; failure of one platform does not stop others.
- Idempotency: **none**. Each call creates a new execution; double-click = duplicate posts on the social network. UI must disable the button after click and navigate to the execution.
- Quirk: no pre-check of `EXPIRED` connections; they fail later with a provider message.

### 8.2 `GET /executions`
- Access: auth (owner-scoped).
- Query: `page`, `limit` (10/100); `sort` one of `createdAt`, `startedAt`, `completedAt` (optional `-`; default `-createdAt`); `status` one of ExecutionStatus (invalid -> ignored); `dateFrom`, `dateTo` (anything `new Date()` parses, e.g. ISO; filters `createdAt` gte/lte; unparsable ignored). No free-text search.
- Success **200** `"Executions fetched successfully"`, `data: ExecutionListItem[]`, `meta`.

### 8.3 `GET /executions/:id`
- Success **200** `"Execution fetched successfully"`, `data: ExecutionDetail`. 404 `"Execution not found"` (missing or not yours).
- `publications` ordered by `createdAt asc`. `failureReason` comes from the latest attempt's `errorMessage` and is only set when the publication is FAILED. Messages are clean strings produced by the publishers, e.g.: `"LinkedIn rejected the access token - reconnect LinkedIn and retry"`, `"Facebook rejected the post - the Page token may be expired; reconnect Facebook and retry"`, `"Reconnect <Platform> before publishing"`, `"No publisher is configured for <Platform>"`, `"Could not fetch the post image to publish to LinkedIn"`, `"LinkedIn rejected the image upload"`, or the generic `"Publish failed"`. (Source strings use an em dash; treat as free text.)
- `post` data still shows content when `isDeleted: true`.
- Status derivation: any publication PENDING/RUNNING -> execution `RUNNING`; all SUCCESS -> `COMPLETED`; mixed -> `PARTIALLY_COMPLETED`; all FAILED -> `FAILED`. Execution starts as `PENDING` until the worker picks it up. **Terminal states** = COMPLETED, PARTIALLY_COMPLETED, FAILED (stop polling). Note `completedAt` is set after every worker run (also after retries).
- Polling guidance: no push channel; poll every ~2-3 s while status is PENDING/RUNNING.

### 8.4 `POST /publications/:id/retry`  (**publication id**, from `publications[].id`)
- Access: auth (owner via execution). No body.
- Success **202** `"Retry started"`, `data: { executionId, publicationId }`.
- Errors: 404 `"Publication not found"` (missing/not yours); 400 `"Only a failed publication can be retried"`; 400 `"Connect <Platform name> before retrying"`.
- Side effects: rebinds the publication to the user's current connection, enqueues a job; worker appends attempt #N, recomputes execution status (PARTIALLY_COMPLETED can become COMPLETED).
- Idempotency quirk: the publication stays `FAILED` until the worker flips it to RUNNING, so a fast double-click can enqueue two jobs (no guard in code). **UNVERIFIED** race outcome. Disable the button on click and poll.

### 8.5 `POST /executions/:id/retry`  (**execution id**)
- Access: auth. No body. Success **202** `"Retry started"`, `data: { executionId, retried: number }`.
- Errors: 404 `"Execution not found"`; 400 `"This execution has no failed publications to retry"`; 400 `"Connect <Platform name> before retrying"` (all-or-nothing: validates and rebinds all failed ones first). Enqueues one job per failed publication.

---

## 9. Payment module - `/api/v1/payments` (bKash tokenized sandbox)

Flow: `POST /create` -> browser to `redirectUrl` (bKash) -> bKash redirects browser to **backend** `GET /payments/callback` -> backend verifies server-side and **302-redirects to the frontend** `${FRONTEND_BASE_URL}/payment/success` or `/payment/failure` (no query params). The frontend therefore needs routes `/payment/success` and `/payment/failure`, and must confirm premium by calling `GET /auth/me` (or `GET /payments/:id` / `POST /payments/verify` if it kept `paymentId`) - never trust the redirect alone.

### 9.1 `POST /payments/create`
- Access: auth. No body (amount/currency come from server env; client cannot choose).
- Success **201** `"Payment initiated"`, `data: CreatePaymentResult` = `{ paymentId (internal uuid), redirectUrl (bKash URL) }`.
- Errors: 502 `"Could not authenticate with bKash"`, `"Could not start the bKash payment"`, `"bKash did not return a payment session"`; 500 for other bKash/Redis errors.
- Side effects: inserts Payment(PENDING, `merchantInvoiceNumber = INV-<uuid>`, `payerReference = userId`), calls bKash create with `callbackURL = BACKEND_URL/api/v1/payments/callback`.
- Quirks: **no check that the user is already premium** (a premium user can create more payments); every call creates a new PENDING row; the frontend must store `paymentId` (e.g. sessionStorage) **before** redirecting if it wants to call `verify` after returning, because the success/failure redirect carries no ids.

### 9.2 `GET /payments/callback?paymentID=&status=`
- Access: public (called by bKash via the user's browser). Not a JSON API: responds **302** to `FRONTEND_BASE_URL/payment/success` (premium granted) or `/payment/failure` (everything else, including any thrown error).
- `status` semantics: `success` -> backend calls bKash execute to confirm (statusCode `"0000"` required); `cancel` -> payment CANCELLED; any other -> FAILED.
- Idempotent: PENDING->SUCCESS flip is atomic; replays no-op, premium granted exactly once (`premiumSince` set only first time). Audit `PAYMENT_VERIFIED` (actor = payer, entityType `Payment`).
- The frontend never calls this directly.

### 9.3 `POST /payments/verify`
- Access: auth (owner-scoped). Body `{ paymentId: string }` (internal payment id; trimmed min 1, `"paymentId is required"`).
- Success **200** `"Payment verified"`, `data: Payment`. 404 `"Payment not found"`; 400 `"This payment has no gateway session to verify"`; 502 `"Could not verify the bKash payment"`.
- Idempotent safety net: already SUCCESS returns as is. If bKash reports a non-"0000" status on a PENDING payment it flips to FAILED. (Quirk: calling verify while the user has not yet completed payment at bKash may mark a still-pending payment FAILED. Only call it after returning from bKash.)

### 9.4 `GET /payments/:id`
- Access: auth (owner-scoped). Success **200** `"Payment fetched successfully"`, `data: Payment`. 404 `"Payment not found"`.

### 9.5 `GET /payments`
- Access: auth. Query: `page`, `limit` (10/100), `status` (PaymentStatus; invalid ignored). Always newest first (no `sort` param).
- Success **200** `"Payments fetched successfully"`, `data: Payment[]`, `meta`. Never includes `gatewayResponse`.
- Route order: `/create`, `/callback`, `/verify`, `/` are static; `/:id` last.

---

## 10. Upcoming features

### 10.1 Premium - `/api/v1/upcoming-features` (**premium**: auth + `isPremium`)
- `GET /` -> 200 `"Upcoming features fetched successfully"`, `UpcomingFeature[]` where `isPremiumVisible = true`, `sortOrder asc`. No pagination.
- `GET /:slug` -> 200 `"Upcoming feature fetched successfully"`, `UpcomingFeature`. 404 `"Upcoming feature not found"` (nonexistent or hidden).
- Non-premium -> 403 `"This area is for premium members"`. Note an ADMIN who is not premium also gets 403 here (admins use the admin endpoints).
- Responses include `imagePublicId` (ignore).

### 10.2 Admin - `/api/v1/admin/upcoming-features` (**admin**)
| Method + path | Request | Success | Errors |
|---|---|---|---|
| `POST /` | JSON: `slug` (trimmed, min1, `/^[a-z0-9-]+$/`), `title`, `shortDescription`, `description` (each trimmed min1, messages `"Title is required"`, `"Short description is required"`, `"Description is required"`, `"Slug is required"`, `"Slug must be a lowercase slug (letters, numbers, hyphens)"`), `status?` UpcomingFeatureStatus (default COMING_SOON), `sortOrder?` int, `isPremiumVisible?` bool (default true) | **201** `"Upcoming feature created successfully"`, `UpcomingFeature` | 409 `"A feature with this slug already exists"` |
| `GET /` | - | 200 `UpcomingFeature[]` (all, incl. hidden) | - |
| `GET /:id` | - | 200 `UpcomingFeature` | 404 `"Upcoming feature not found"` |
| `PATCH /:id` | JSON partial of the create fields (slug **is** editable here) | 200 `"Upcoming feature updated successfully"` | 404; 409 slug clash |
| `PATCH /:id/image` | multipart field **`image`** | 200 `"Upcoming feature image updated successfully"` | 400 file errors; 404 |
| `DELETE /:id` | - | 200 `"Upcoming feature deleted successfully"`, `data:null` | 404 (hard delete) |

Audit: `FEATURE_CREATED`, `FEATURE_UPDATED`, `FEATURE_DELETED` (image set is not audited).

---

## 11. Admin users - `/api/v1/admin/users`

All return `AdminUser` (safe projection, no avatar, no `updatedAt`, no `providers`).

| Method + path | Access | Request | Success | Errors |
|---|---|---|---|---|
| `GET /` | admin | query `page`, `limit` (10/100), `search` (case-insens. contains on `email` OR `name`); newest first; **includes soft-deleted users** (`isDeleted:true`) and admins | 200 `"Users fetched successfully"`, `AdminUser[]`, `meta` | - |
| `GET /:id` | admin | - | 200 `"User fetched successfully"`, `AdminUser` | 404 `"User not found"` |
| `PATCH /:id/status` | admin | JSON `{ status: "ACTIVE" \| "BLOCKED" }` | 200 `"User status updated successfully"`, `AdminUser` | 400 `"You cannot change your own status"`; 404 |
| `PATCH /:id/role` | **superadmin** | JSON `{ role: Role }` | 200 `"User role updated successfully"`, `AdminUser` | 403 (ADMIN gets the generic forbidden message); 400 `"You cannot change your own role"`; 404 |
| `PATCH /:id/premium` | admin | JSON `{ isPremium: boolean }` | 200 `"User premium status updated successfully"`, `AdminUser` | 404 |

Notes:
- Enum validation failures return a zod message (exact text UNVERIFIED) with 400.
- Premium grant sets `premiumSince` only if empty; revoke leaves `premiumSince` untouched (history). No payment is created.
- Blocking takes effect immediately for that user's existing sessions (401 on next call).
- **No hierarchy guard**: an ADMIN can block/unblock or grant/revoke premium on another ADMIN or the SUPER_ADMIN, and can act on soft-deleted users; the UI should hide those controls for equal/higher roles (policy choice, not enforced by backend). SUPER_ADMIN can assign `SUPER_ADMIN` to anyone.
- Audit actions written: `USER_BLOCKED`, `USER_UNBLOCKED` (entityType `User`, metadata `{status}`), `USER_ROLE_CHANGED` (metadata `{role}`), `USER_PREMIUM_GRANTED`, `USER_PREMIUM_REVOKED` (metadata `{isPremium, premiumSince}`).
- Not audited: logins, logout, account deletion, logo/image uploads, post/publish actions.

## 12. Admin audit logs - `GET /api/v1/admin/audit-logs` (**admin**)
- Query: `page`, `limit` (10/100), `actorId`, `action`, `entityType` (exact-match string filters, all optional). Always newest first; no date filter or text search.
- Success **200** `"Audit logs fetched successfully"`, `data: AuditLog[]`, `meta`. Read-only, append-only.
- `actorId` is the user uuid (nullable if the actor was deleted via FK SetNull... note: users are soft-deleted so effectively always set); **there is no actor name/email join** - the UI must resolve names via `GET /admin/users/:id` (N+1) or show ids.
- Known `action` values: `PLATFORM_CREATED`, `PLATFORM_UPDATED`, `FEATURE_CREATED`, `FEATURE_UPDATED`, `FEATURE_DELETED`, `USER_BLOCKED`, `USER_UNBLOCKED`, `USER_ROLE_CHANGED`, `USER_PREMIUM_GRANTED`, `USER_PREMIUM_REVOKED`, `CONNECTION_DISCONNECTED`, `PAYMENT_VERIFIED`. Known `entityType`: `Platform`, `UpcomingFeature`, `User`, `SocialConnection`, `Payment`. `action`/`entityType` are free strings in the DB (not enums), so new values may appear.
- `metadata` examples: Platform `{key,name}` (+`{status,isActive}` on update); Feature `{slug,title}` (+`status`); Payment `{amount: string, currency}`.

---

## 13. Frontend consumption matrix

Change names: auth-ui, user-profile-ui, app-shell-and-marketing, platforms-and-connections-ui, post-composer-ui, publish-and-executions-ui, premium-payment-ui, upcoming-features-ui, admin-console-ui.

| Endpoint | Consumed by (frontend change) |
|---|---|
| `POST /auth/register` | auth-ui |
| `POST /auth/verify-email` | auth-ui |
| `POST /auth/login` | auth-ui |
| `POST /auth/refresh-token` | auth-ui (shared API client interceptor) |
| `POST /auth/logout` | auth-ui (invoked from app-shell user menu) |
| `GET /auth/me` | auth-ui (session bootstrap) / app-shell-and-marketing (guards, role/premium gating) |
| `POST /auth/forgot-password` | auth-ui |
| `POST /auth/reset-password` | auth-ui |
| `GET /users/me` | user-profile-ui |
| `PATCH /users/me` | user-profile-ui |
| `PATCH /users/me/avatar` | user-profile-ui |
| `DELETE /users/me/avatar` | user-profile-ui |
| `PATCH /users/me/password` | user-profile-ui |
| `DELETE /users/me` | user-profile-ui |
| `GET /platforms` | platforms-and-connections-ui (also post-composer-ui platform picker) |
| `GET /connections` | platforms-and-connections-ui (also post-composer-ui, app-shell dashboard summary) |
| `GET /connections/:platform/connect` | platforms-and-connections-ui |
| `GET /connections/:platform/callback` | platforms-and-connections-ui (only if redirect URI moved to a frontend route; otherwise NOT consumed) |
| `GET /connections/facebook/pages` | platforms-and-connections-ui |
| `POST /connections/facebook/select-page` | platforms-and-connections-ui |
| `DELETE /connections/:platform` | platforms-and-connections-ui |
| `POST /posts` | post-composer-ui |
| `GET /posts` | post-composer-ui (post library / picker) |
| `GET /posts/:id` | post-composer-ui |
| `DELETE /posts/:id` | post-composer-ui |
| `POST /posts/:id/publish` | publish-and-executions-ui (triggered from composer) |
| `GET /executions` | publish-and-executions-ui (also app-shell dashboard "recent executions") |
| `GET /executions/:id` | publish-and-executions-ui |
| `POST /publications/:id/retry` | publish-and-executions-ui |
| `POST /executions/:id/retry` | publish-and-executions-ui |
| `POST /payments/create` | premium-payment-ui |
| `GET /payments/callback` | NOT consumed (bKash/browser redirect target; frontend only provides `/payment/success` and `/payment/failure` pages) |
| `POST /payments/verify` | premium-payment-ui |
| `GET /payments/:id` | premium-payment-ui |
| `GET /payments` | premium-payment-ui (payment history in profile/billing) |
| `GET /upcoming-features` | upcoming-features-ui (marketing teaser for non-premium must come from elsewhere; see gaps) |
| `GET /upcoming-features/:slug` | upcoming-features-ui |
| `GET /admin/platforms` | admin-console-ui |
| `POST /admin/platforms` | admin-console-ui |
| `GET /admin/platforms/:id` | admin-console-ui |
| `PATCH /admin/platforms/:id` | admin-console-ui (incl. retire via `isActive:false`) |
| `PATCH /admin/platforms/:id/logo` | admin-console-ui |
| `GET /admin/upcoming-features` | admin-console-ui |
| `POST /admin/upcoming-features` | admin-console-ui |
| `GET /admin/upcoming-features/:id` | admin-console-ui |
| `PATCH /admin/upcoming-features/:id` | admin-console-ui |
| `PATCH /admin/upcoming-features/:id/image` | admin-console-ui |
| `DELETE /admin/upcoming-features/:id` | admin-console-ui |
| `GET /admin/users` | admin-console-ui |
| `GET /admin/users/:id` | admin-console-ui |
| `PATCH /admin/users/:id/status` | admin-console-ui |
| `PATCH /admin/users/:id/role` | admin-console-ui (SUPER_ADMIN only controls) |
| `PATCH /admin/users/:id/premium` | admin-console-ui |
| `GET /admin/audit-logs` | admin-console-ui |
| `GET /`, `GET /health` | not consumed (optional: app-shell health/maintenance banner) |

Backend endpoints present but not (necessarily) consumed: `GET /payments/callback` (server-to-browser redirect), `GET /connections/:platform/callback` (unless the redirect URI is moved), `GET /auth/me` vs `GET /users/me` overlap (use `/auth/me` for bootstrap), `GET /admin/platforms/:id` and `GET /admin/upcoming-features/:id` (only needed for dedicated edit pages; list data already contains every field), `GET /`/`GET /health`. Endpoints the frontend might expect but that **do not exist**: see gaps.

---

## 14. Known gaps / backend quirks the frontend must work around

1. **OAuth connect callback returns JSON, not a redirect.** Provider redirect URIs point at the backend (`http://localhost:5000/api/v1/connections/<key>/callback`), so the browser ends on raw JSON and the user is stranded. Work-around (needs backend env + provider console change, **UNVERIFIED live**): set `*_REDIRECT_URI` to a frontend route (e.g. `/connections/callback/:platform`), which reads `code` + `state` from the URL and calls `GET /connections/:platform/callback` with credentials, then routes on `data.kind` (`connected` -> connections page; `select-page` -> Page picker via `GET /connections/facebook/pages`). Both authUrl and token exchange read the same env value, so they stay consistent. Alternatively ask backend to 302 to `FRONTEND_URL/connections?...` (not implemented).
2. **No resend-OTP endpoint.** Resend = call `POST /auth/register` again with the same name/email/password (overwrites pending record and OTP) or `POST /auth/forgot-password` again. Each counts toward the shared 20-per-15-min IP limiter. The UI must keep the registration form data in memory/sessionStorage to allow resend (password would need re-entry; do not persist plaintext password in storage - ask the user to re-enter).
3. **Dev builds may expose `otp`** in `register` and `forgot-password` response `data` (`EXPOSE_OTP_IN_RESPONSE=true` and non-production). Use only behind a dev flag (e.g. autofill in dev); never render it in production builds.
4. **OTP lifetime 5 minutes, no countdown from server** - client must compute its own timer from the moment of the 200; no "expires at" in the response.
5. **Validation errors are one comma-joined string** (no field map). Display as form-level error; optionally substring-match known messages per field.
6. **Mixed 401 meaning**: `PATCH /users/me/password` returns 401 `"Current password is incorrect"` and login returns 401 `"Invalid email or password"`. The API client's "401 -> refresh -> redirect to login" interceptor must exclude `/auth/login`, `/auth/register`, `/auth/verify-email`, `/auth/reset-password`, `/auth/refresh-token`, and `PATCH /users/me/password`, otherwise users get logged out on a typo.
7. **No automatic session refresh**; access cookie dies after 1 day. Implement refresh-on-401 once + retry.
8. **Cookie/cross-site deployment**: production cookies are `SameSite=None; Secure` -> requires HTTPS on both sides; Safari/ITP and third-party-cookie blocking can drop them; Next.js middleware cannot read cookies set for the backend's domain. Prefer same-site hosting or a same-origin proxy/rewrite for `/api/v1`. **UNVERIFIED** target topology.
9. **`GET /platforms` requires login** (not truly public) and returns `COMING_SOON` platforms too; a marketing page cannot call it anonymously. Marketing content for platforms/features must be static or the backend extended.
10. **Upcoming-features catalogue is premium-only**; non-premium users (and admins who are not premium) get 403. There is no public teaser endpoint, so the "upsell" view must be hard-coded copy.
11. **Premium price is not exposed** by any endpoint (env `PREMIUM_PRICE`/`PREMIUM_CURRENCY`, default 500 BDT). Show price via a frontend env/constant (must be kept in sync manually) or after `GET /payments` rows. Payment `amount` is a **string**.
12. **Payment return page carries no ids.** `/payment/success|failure` redirects have no query params. Store `paymentId` (from `/payments/create`) client-side before redirecting; on return, call `GET /auth/me` to confirm `isPremium`, and optionally `POST /payments/verify` (only after returning from bKash - calling it early may mark a pending payment FAILED). `/payments/create` does not stop already-premium users.
13. **Publishing is async, no push.** `202` from `/posts/:id/publish`; poll `GET /executions/:id`. No idempotency key (double submit = duplicate publish); retry endpoints can race on double-click. No scheduled publishing, no per-platform content overrides, no draft status.
14. **Platform limits unvalidated**: no max `content` length or image dimension checks on `POST /posts`; platform rejection shows up as FAILED publication `failureReason`.
15. **Connection status is only derived from `expiresAt`**; Facebook Page connections never expire in the data, so a revoked token only shows up as a publish failure (reason says to reconnect). `EXPIRED` LinkedIn connections are still publishable targets as far as the API's pre-checks go.
16. **Facebook select-page edge cases**: 0 Pages -> `select-page` with empty list; exactly 1 Page is auto-connected (frontend never sees the picker); selection stash lasts 10 min and is keyed per user.
17. **Admin lists include soft-deleted users** (`isDeleted: true`) and all roles; no hierarchy guard on block/premium; role change SUPER_ADMIN only; self-actions blocked with 400.
18. **Audit logs have no actor name/email**, no date filter; `CONNECTION_DISCONNECTED.entityId` is a platform key.
19. **Two "me" endpoints with different shapes**: `/auth/me` (no `providers`) vs `/users/me` (with `providers`). Cache both under one user query and merge.
20. **Soft-deleted account is permanent from the client's view**: email stays taken; no restore endpoint; delete requires no password re-entry (UI should confirm).
21. **No Google login route** even though `GOOGLE` exists in `AuthProvider`, `google-auth-library` and `GOOGLE_CLIENT_ID` config exist (`lib/googleAuth.ts` is unused by any route - grep-verified). Do not build "Sign in with Google".
22. **No email-change, no avatar-by-URL, no notification/preferences, no dashboard statistics endpoint.** Dashboard "recent executions" = `GET /executions?limit=5`; "connected platforms" = `GET /connections`. "Basic publishing statistics" must be derived client-side from `meta.total` of filtered `GET /executions?status=...` calls.
23. **Error body is not uniform** (see 1.3): 404 route-not-found has no `statusCode`; global-limiter 429 is plain text; JSON parse errors come back as 500. The client error normalizer must handle non-JSON and missing fields and fall back to HTTP status text.
24. **Rate limiting is per-IP and shared** across the five auth write endpoints (20 / 15 min). Surface the 429 message and disable submit with a cooldown; do not auto-retry.
25. **Number inputs**: `sortOrder` must be sent as a JSON **number** (zod `number().int()`), not a string, in admin platform/feature forms; `isActive`, `isPremiumVisible`, `isPremium` must be real booleans.
26. **Publication id vs execution id vs post id**: publish uses the **post id**; retry-one uses `publications[].id`; retry-all uses the **execution id**. `GET /executions/:id` is the only place publication ids appear.
27. **Cloudinary-dependent endpoints** (avatar, logo, post image, feature image) were **skipped in the backend E2E suite** (no live credentials): upload happy paths are **UNVERIFIED** against a real Cloudinary account. Likewise live LinkedIn/Facebook OAuth and publishing, and real bKash payment, were verified only via injected deterministic seams, not live (per `docs/full-flow-test-report.md` and `docs/decisions.md`).

### UNVERIFIED summary
- Exact zod default message text for missing/wrong-typed fields; exact enum-validation messages for admin PATCH endpoints.
- Decimal serialization format of `Payment.amount` (string confirmed by Prisma Decimal semantics; formatting like `"500"` vs `"500.00"` not observed).
- Malformed-JSON response (expected 500 from handler code), global-limiter 429 body text.
- JSON (non-multipart) body acceptance on `POST /posts`.
- Moving OAuth redirect URIs to a frontend route (code reasoning only).
- Production cookie behaviour across domains; `trust proxy` impact.
- Retry-button double-click race outcome.
- Live Cloudinary / LinkedIn / Facebook / bKash behaviour.
- All response shapes: derived from code (no captured examples exist in Postman or docs).
