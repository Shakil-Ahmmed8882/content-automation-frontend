# upcoming-features-ui Specification

## Purpose
The premium-only Upcoming Features area: a card list, a per-feature detail page, and an upgrade
gate for non-premium users.

## ADDED Requirements

### Requirement: Feature card list
`/upcoming-features` SHALL list visible features as cards in backend order.

#### Scenario: Populated list
- **WHEN** a premium user opens `/upcoming-features` and `GET /upcoming-features` returns features
- **THEN** the page SHALL render one card per feature, in the returned (`sortOrder`) order, each with image, title, `shortDescription` and a status badge

#### Scenario: Card without image
- **WHEN** a feature has `imageUrl: null`
- **THEN** the card SHALL show a placeholder visual of the same size

#### Scenario: Open detail
- **WHEN** the user clicks a card
- **THEN** the app SHALL navigate to `/upcoming-features/<slug>`

### Requirement: Status badges
Each feature SHALL display its status as a distinguishable badge.

#### Scenario: Known statuses
- **WHEN** a feature's status is `COMING_SOON`, `IN_DEVELOPMENT` or `PLANNED`
- **THEN** the badge SHALL show a human-readable label ("Coming soon", "In development", "Planned") with a distinct style per status

### Requirement: Feature detail
`/upcoming-features/[slug]` SHALL show one feature in full.

#### Scenario: Detail loaded
- **WHEN** `GET /upcoming-features/:slug` succeeds
- **THEN** the page SHALL show the image, title, status badge and the full `description`, plus a back link to the list

#### Scenario: Unknown or hidden slug
- **WHEN** the API returns 404
- **THEN** the page SHALL show a "Feature not found" state with a link back to the list

### Requirement: Non-premium gate
Non-premium users SHALL be shown an upgrade call to action instead of feature content.

#### Scenario: Known non-premium user
- **WHEN** the profile reports `isPremium: false` and the user opens `/upcoming-features` or a detail URL
- **THEN** the page SHALL render an upgrade gate with a button to `/payment` and SHALL NOT show feature data

#### Scenario: API returns 403
- **WHEN** the list or detail request returns 403
- **THEN** the page SHALL render the same upgrade gate, not a generic error

### Requirement: Sidebar visibility
The Upcoming Features sidebar entry SHALL appear only for premium users.

#### Scenario: Entry toggles with premium state
- **WHEN** `isPremium` is false
- **THEN** the sidebar SHALL NOT show "Upcoming Features"
- **WHEN** premium state becomes true after a refresh
- **THEN** the entry SHALL appear without a manual reload

### Requirement: Loading, empty and error states
The list and detail pages SHALL handle all request states.

#### Scenario: Loading
- **WHEN** a request is in flight
- **THEN** the list SHALL show skeleton cards and the detail SHALL show a skeleton layout

#### Scenario: Empty
- **WHEN** the list returns an empty array
- **THEN** the page SHALL show an "Nothing planned yet" empty state

#### Scenario: Error
- **WHEN** the request fails with a non-403, non-404 error
- **THEN** the page SHALL show the error message with a Retry button

### Requirement: Premium identity on the page
The list page SHALL show a "Crown Premium" heading badge for premium users, and feature cards SHALL show
only real, data-driven content (no hard-coded features).

#### Scenario: Heading and data-driven content
- **WHEN** a premium user opens `/upcoming-features`
- **THEN** the heading SHALL include the crown "Premium" label and every card SHALL come from the API response
