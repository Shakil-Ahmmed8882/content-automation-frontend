## Purpose

The app shell is the public marketing site plus the authenticated dashboard frame: navigation,
route protection, premium-aware menus, and fallback states shared by every feature page.

## ADDED Requirements

### Requirement: Public marketing home page

The system SHALL serve a public home page at `/` with a hero (mesh-gradient background, headline,
primary CTA), a features section, a how-it-works section, a pricing/premium teaser, a final CTA, and
a footer, all in the dark Vercel theme and responsive down to phone width.

#### Scenario: Guest views the home page
- **WHEN** a guest opens `/`
- **THEN** the system SHALL render all sections without requiring login and the hero CTA SHALL lead to `/register`

#### Scenario: Premium teaser links onward
- **WHEN** a user clicks the premium teaser action
- **THEN** the system SHALL navigate to `/payment` if signed in, or to `/register` if a guest

### Requirement: Session-aware navbar

The system SHALL show Login and Get started in the navbar for guests, and a Dashboard button with an
avatar menu (Profile, Logout) for signed-in users, while never redirecting a signed-in user away from
the home page.

#### Scenario: Signed-in user opens home
- **WHEN** a signed-in user opens `/`
- **THEN** the system SHALL render the home page with a Dashboard button in the navbar

#### Scenario: Session is loading
- **WHEN** the session request is still pending
- **THEN** the navbar SHALL show a neutral placeholder instead of flashing guest actions

### Requirement: Protected app routes

The system SHALL protect `/dashboard`, `/create`, `/connections`, `/executions`, `/profile`,
`/payment` and `/upcoming-features` with an AuthGuard that requires an active session.

#### Scenario: Guest opens a protected route
- **WHEN** a guest opens `/dashboard`
- **THEN** the system SHALL redirect to `/login?next=/dashboard`

#### Scenario: Session check pending
- **WHEN** the session is loading on a protected route
- **THEN** the system SHALL show a shell-shaped skeleton and SHALL NOT render page content

### Requirement: Dashboard sidebar

The system SHALL render a sidebar with Dashboard, Create Post, Connections, Executions and Profile
for all users, an Upcoming Features entry only for premium users, and an Upgrade entry only for
non-premium users, highlighting the active route and collapsing to a drawer on mobile.

#### Scenario: Premium user sees Upcoming Features
- **WHEN** a user with `isPremium` true opens the dashboard
- **THEN** the sidebar SHALL list Upcoming Features and SHALL NOT list Upgrade

#### Scenario: Non-premium user sees Upgrade
- **WHEN** a user with `isPremium` false opens the dashboard
- **THEN** the sidebar SHALL list Upgrade linking to `/payment` and SHALL NOT list Upcoming Features

#### Scenario: Mobile navigation
- **WHEN** the viewport is phone width
- **THEN** the sidebar SHALL be hidden behind a menu button that opens it as a drawer

### Requirement: Dashboard overview page

The system SHALL show at `/dashboard` a welcome header with the user's name, a premium status card,
and quick-link cards to Create Post, Connections and Executions, with an empty state where data is
not yet available.

#### Scenario: Overview renders for a new user
- **WHEN** a signed-in user with no connections opens `/dashboard`
- **THEN** the system SHALL show the welcome header, premium card, and a prompt to connect a platform

### Requirement: Error, loading and not-found states

The system SHALL provide a 404 page, a route-level error boundary with a retry action, and a loading
skeleton for each route group.

#### Scenario: Unknown URL
- **WHEN** a user opens a path that does not exist
- **THEN** the system SHALL show the 404 page with a link to home (or dashboard when signed in)

#### Scenario: Render error
- **WHEN** a page throws during render
- **THEN** the system SHALL show the error state with a Try again action and keep the shell intact

### Requirement: Dashboard shows connections, recent executions and a premium crown

The system SHALL show on `/dashboard` the user's connected platforms (from the shared connections
hook), their five most recent executions with status badges (from `GET /executions?limit=5`), and a
Create Post quick action, each with its own loading, empty and error state. A small crown badge
labelled "Premium" SHALL appear beside the user's identity (navbar avatar menu, sidebar user area) for
premium users only. Heavy analytics are out of scope.

#### Scenario: Widgets reflect real data
- **WHEN** a user with two connections and three executions opens `/dashboard`
- **THEN** the system SHALL list both connected platforms and the recent executions with their status, each linking to its page

#### Scenario: Widgets degrade independently
- **WHEN** the recent-executions request fails but connections load
- **THEN** only the executions widget SHALL show an error with Retry and the rest of the page SHALL stay usable

#### Scenario: Crown badge for premium only
- **WHEN** `isPremium` is true
- **THEN** a crown badge labelled "Premium" SHALL be visible beside the user's name and SHALL NOT be rendered for non-premium users

### Requirement: Consistent API error handling and feedback

The system SHALL convert every failed API call into one typed error carrying the backend `message`,
HTTP status and optional field details, and SHALL show a human-readable message (a toast for actions, an
inline state for page loads) rather than raw server output, stack traces or tokens. Every primary action
SHALL give visible feedback (pending state, then a success or error toast).

#### Scenario: Backend message shown
- **WHEN** an action returns `{ success:false, message }`
- **THEN** the system SHALL show that `message` and SHALL NOT render the raw response body

#### Scenario: Unknown failure
- **WHEN** a request fails with a network error or a 5xx response without a usable message
- **THEN** the system SHALL show a generic "Something went wrong. Please try again." message with a retry path

#### Scenario: Field errors from the server
- **WHEN** a 400 response carries field-level details
- **THEN** the system SHALL attach them to the matching form fields

### Requirement: Global rate-limit and session-expiry messaging

The system SHALL handle HTTP 429 from any endpoint (global limiter of 300 requests / 15 min / IP, auth
limiter of 20) with a "Too many requests, please wait a moment" message and SHALL pause automatic
polling and retries while limited. When a session cannot be renewed, the system SHALL tell the user their
session expired and send them to `/login?next=` the current path.

#### Scenario: Non-auth endpoint rate limited
- **WHEN** any data request returns 429
- **THEN** the system SHALL show the rate-limit message, SHALL NOT retry automatically in a tight loop, and SHALL allow a manual retry

#### Scenario: Session expires mid-use
- **WHEN** a protected request returns 401 and the silent refresh fails
- **THEN** the system SHALL show "Your session expired. Please sign in again." and redirect to login preserving the path

### Requirement: Destructive actions require confirmation

The system SHALL require an explicit confirmation modal before any destructive or irreversible action
(delete post, disconnect platform, delete account, delete upcoming feature, block user, change role,
revoke premium), naming the target and offering a clearly secondary Cancel.

#### Scenario: Cancel changes nothing
- **WHEN** the user cancels or dismisses a confirmation modal
- **THEN** no request SHALL be sent and the UI state SHALL be unchanged

### Requirement: Premium gating is a UX hint, never the control

The system SHALL derive premium-only UI (Upcoming Features entry, crown, gates) from the backend
`isPremium` value only, SHALL never store or accept a client-supplied premium flag, and SHALL treat a 403
from a premium endpoint as the source of truth.

#### Scenario: Stale premium flag
- **WHEN** the UI shows a premium entry but the backend answers 403
- **THEN** the system SHALL refetch the session and show the upgrade gate instead of an error

### Requirement: Accessibility baseline

The system SHALL be operable by keyboard and screen reader: visible focus rings, labelled form fields with
errors announced via `aria-describedby`/`aria-live`, accessible names on icon-only buttons, focus
trapped in modals and returned on close, status conveyed by text or icon as well as colour, and
`prefers-reduced-motion` respected by animations.

#### Scenario: Keyboard-only use
- **WHEN** a user navigates the sidebar, a form and a confirmation modal using only the keyboard
- **THEN** every control SHALL be reachable, show focus, and Escape SHALL close the modal and restore focus

### Requirement: Responsive layout

The system SHALL lay out every page without horizontal scroll from 360px to desktop widths, with tables
degrading to stacked cards or horizontal scroll inside their container and touch targets of at least 40px.

#### Scenario: Phone width
- **WHEN** any page is opened at 375px
- **THEN** content SHALL fit the viewport width and primary actions SHALL be reachable without zooming

### Requirement: Client validation mirrors backend rules

The system SHALL validate forms with zod schemas that match the backend zod rules (email format,
password minimum 8, OTP exactly 6 digits, name non-empty after trim, post content non-empty after trim,
images `image/*` up to 5 MB, platform key `^[a-z0-9-]+$`, slug pattern, integer sortOrder) and SHALL still
display backend validation messages for anything the client cannot know.

#### Scenario: Parity
- **WHEN** a value is rejected by a backend zod schema
- **THEN** the same value SHALL be rejected client-side before any request, except rules requiring server state (uniqueness, current password)
