# admin-console-ui Specification

## Purpose
Role-guarded admin screens for managing platforms, users, the audit log and upcoming features,
limited to operations the backend exposes.

## ADDED Requirements

### Requirement: Admin route guard
The `/admin` area SHALL be accessible only to `ADMIN` and `SUPER_ADMIN` sessions.

#### Scenario: Non-admin visits
- **WHEN** a signed-in `USER` opens any `/admin/*` URL
- **THEN** the app SHALL show a Forbidden page and SHALL NOT call admin endpoints

#### Scenario: Anonymous visits
- **WHEN** a visitor without a session opens `/admin/*`
- **THEN** the app SHALL redirect to `/login`

#### Scenario: Admin navigation
- **WHEN** an admin is signed in
- **THEN** the sidebar SHALL show an Admin entry linking to platforms, users, audit logs and upcoming features

### Requirement: Platform management
`/admin/platforms` SHALL let admins view and maintain the platform catalogue.

#### Scenario: List and create
- **WHEN** `GET /admin/platforms` returns platforms
- **THEN** the page SHALL list key, name, logo, status (`LIVE`/`COMING_SOON`), sortOrder and active flag
- **WHEN** an admin submits the create form (key, name, status, sortOrder, isActive)
- **THEN** the app SHALL call `POST /admin/platforms` and show the new row

#### Scenario: Edit, retire and logo
- **WHEN** an admin edits a platform
- **THEN** the key field SHALL be read-only and `PATCH /admin/platforms/:id` SHALL send name/status/sortOrder/isActive
- **WHEN** an admin uploads a logo
- **THEN** the app SHALL send multipart field `logo` to `PATCH /admin/platforms/:id/logo` and show the new logo
- **AND** no delete action SHALL be offered (retire by turning isActive off)

#### Scenario: Validation and conflict
- **WHEN** the key is not `^[a-z0-9-]+$` or already exists
- **THEN** the form SHALL show the validation or backend conflict message inline

### Requirement: User management
`/admin/users` SHALL list and manage users through the backend's supported actions.

#### Scenario: List, search, paginate
- **WHEN** an admin opens the page
- **THEN** it SHALL show name, email, role, premium flag, status and created date from `GET /admin/users` with `search`, `page`, `limit` controls and `Pagination` from `meta`

#### Scenario: View user
- **WHEN** an admin opens a user
- **THEN** the detail view SHALL show the `GET /admin/users/:id` fields (including `premiumSince`, `emailVerified`, `isDeleted`)

#### Scenario: Block and premium
- **WHEN** an admin confirms block or unblock
- **THEN** the app SHALL call `PATCH /admin/users/:id/status` with `BLOCKED` or `ACTIVE`
- **WHEN** an admin toggles premium
- **THEN** the app SHALL call `PATCH /admin/users/:id/premium` with `isPremium`

#### Scenario: Role change is SUPER_ADMIN only
- **WHEN** the signed-in role is `SUPER_ADMIN`
- **THEN** a role control SHALL call `PATCH /admin/users/:id/role` after confirmation
- **WHEN** the signed-in role is `ADMIN`
- **THEN** the role control SHALL NOT be shown

#### Scenario: Self-protection
- **WHEN** the row is the signed-in admin
- **THEN** status and role controls SHALL be disabled

### Requirement: Audit log viewer
`/admin/audit-logs` SHALL show a read-only, paginated, filterable trail.

#### Scenario: Filter and paginate
- **WHEN** an admin sets `actorId`, `action` or `entityType` filters
- **THEN** the list SHALL refetch `GET /admin/audit-logs` with those params, reset to page 1, and keep filters in the URL

#### Scenario: Row details
- **WHEN** an admin expands a row
- **THEN** it SHALL show entityId, ipAddress, userAgent and `metadata` JSON; and no edit or delete action SHALL exist

### Requirement: Upcoming features management
`/admin/upcoming-features` SHALL provide CRUD with image upload.

#### Scenario: List all including hidden
- **WHEN** the page loads `GET /admin/upcoming-features`
- **THEN** it SHALL show every feature with slug, title, status, sortOrder, isPremiumVisible and image

#### Scenario: Create and edit
- **WHEN** an admin submits slug, title, shortDescription, description, status, sortOrder, isPremiumVisible
- **THEN** the app SHALL call `POST` (create) or `PATCH /:id` (edit), and a duplicate slug SHALL show "A feature with this slug already exists"

#### Scenario: Image upload
- **WHEN** an admin chooses an image
- **THEN** the app SHALL send multipart field `image` to `PATCH /admin/upcoming-features/:id/image` and show the new image, with a retry on failure

#### Scenario: Delete
- **WHEN** an admin confirms the delete modal
- **THEN** the app SHALL call `DELETE /admin/upcoming-features/:id` and remove the row

### Requirement: Loading, empty and error states
Every admin list SHALL handle all request states.

#### Scenario: States
- **WHEN** a list is loading, empty, or fails
- **THEN** it SHALL show skeleton rows, an empty state, or an error with Retry respectively, and mutation errors SHALL show the backend `message` as a toast
