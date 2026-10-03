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
