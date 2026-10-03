## Purpose

Connections-ui lets a signed-in user see the platform catalogue, connect or disconnect LinkedIn and
Facebook, pick a Facebook Page, and understand each connection's health.

## ADDED Requirements

### Requirement: Platform catalogue with connection status

The system SHALL show every active platform from `GET /platforms` as a card, in `sortOrder`, merged
with `GET /connections` to show Connected (with account name), Expired, Not connected, or Coming soon.

#### Scenario: Cards render with status
- **WHEN** the user opens `/connections`
- **THEN** the system SHALL show a skeleton while loading, then one card per platform with its logo, name and status badge

#### Scenario: Coming-soon platform is not connectable
- **WHEN** a platform has status `COMING_SOON`
- **THEN** the card SHALL show "Coming soon" and the connect action SHALL be disabled

#### Scenario: Load failure
- **WHEN** either request fails
- **THEN** the system SHALL show an error state with a retry action

### Requirement: Start an OAuth connection

The system SHALL start a connection by calling `GET /connections/:platform/connect` and navigating the
browser to the returned `authUrl`.

#### Scenario: Connect redirects to provider
- **WHEN** the user clicks Connect on a LIVE platform
- **THEN** the button SHALL show a pending state and the browser SHALL navigate to `authUrl`

#### Scenario: Connect refused
- **WHEN** the backend responds 400 or 501
- **THEN** the system SHALL show the backend message in a toast and stay on the page

### Requirement: Handle the provider return

The system SHALL expose `/connections/callback/[platform]` that forwards `code` and `state` to
`GET /connections/:platform/callback` exactly once and routes the user by the result.

#### Scenario: Connection completes
- **WHEN** the callback returns `kind: "connected"`
- **THEN** the system SHALL show a success toast and redirect to `/connections` with the new connection listed

#### Scenario: Provider denial or invalid state
- **WHEN** the query has `error` instead of `code`, or the backend rejects the state as invalid or expired
- **THEN** the system SHALL redirect to `/connections` with an error message and SHALL NOT retry the single-use code

### Requirement: Facebook Page selection

The system SHALL let the user choose a Facebook Page when the callback returns `kind: "select-page"`,
using `GET /connections/facebook/pages` and `POST /connections/facebook/select-page`.

#### Scenario: Pick a Page
- **WHEN** the picker lists Pages and the user selects one and confirms
- **THEN** the system SHALL submit `{ pageId }`, close the picker, and show Facebook as Connected with the Page name

#### Scenario: Selection expired
- **WHEN** the pages request returns 400 "no selection in progress"
- **THEN** the system SHALL tell the user to connect Facebook again and offer the Connect action

### Requirement: Disconnect with confirmation

The system SHALL disconnect a platform via `DELETE /connections/:platform` only after the user confirms
in a modal.

#### Scenario: Confirmed disconnect
- **WHEN** the user confirms Disconnect
- **THEN** the system SHALL call the API, show a success toast, and the card SHALL return to Not connected

#### Scenario: Cancelled or failed
- **WHEN** the user cancels, or the API returns an error
- **THEN** the connection SHALL remain and an error SHALL be shown on failure

### Requirement: Expired connection state

The system SHALL show connections whose status is `EXPIRED` with a warning badge and a Reconnect action
that re-runs the connect flow.

#### Scenario: Reconnect expired account
- **WHEN** a connection is `EXPIRED` and the user clicks Reconnect
- **THEN** the system SHALL start the connect flow and the card SHALL show Connected after the callback succeeds
