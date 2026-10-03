## Purpose

Executions-ui lets a user publish a saved post to chosen connected platforms, watch each platform's
progress live, retry failures, and review past executions.

## ADDED Requirements

### Requirement: Publish a post now

The system SHALL let the user publish a saved post to selected connected platforms via
`POST /posts/:id/publish` and then show the resulting execution.

#### Scenario: Publish started
- **WHEN** the user confirms Publish Now with at least one connected platform selected
- **THEN** the system SHALL call the API, show a "Publishing started" toast, and navigate to `/executions/<executionId>`

#### Scenario: Handoff pre-selection
- **WHEN** the user opens `/posts/[id]?publish=<keys>`
- **THEN** the panel SHALL pre-select those platforms but SHALL NOT publish until the user confirms

#### Scenario: Publish refused
- **WHEN** the API returns 400 or 404 (for example a platform is not connected)
- **THEN** the system SHALL show the backend message, link to `/connections` when a connection is missing, and SHALL NOT navigate

### Requirement: Live execution progress

The system SHALL poll `GET /executions/:id` while the execution is `PENDING` or `RUNNING` and display
each platform's publication status as it changes.

#### Scenario: Progress updates without reload
- **WHEN** a publication moves from pending to running to success
- **THEN** its badge SHALL update automatically and polling SHALL stop once the execution is terminal

#### Scenario: Slow or stalled execution
- **WHEN** an execution stays active beyond five minutes
- **THEN** the system SHALL show a "taking longer than expected" notice with a manual Refresh action

### Requirement: Result feedback

The system SHALL tell the user the outcome when an execution reaches a terminal state, with the
external post link for each success and the failure reason for each failure.

#### Scenario: All platforms succeed
- **WHEN** status becomes `COMPLETED`
- **THEN** the system SHALL show one success toast and a "View post" link per platform from `externalPostUrl`

#### Scenario: Partial or total failure
- **WHEN** status becomes `PARTIALLY_COMPLETED` or `FAILED`
- **THEN** the system SHALL show one toast and list each failed platform with its `failureReason`

### Requirement: Status badges

The system SHALL display execution and publication states with consistent badges combining text and
colour: Queued, Publishing, Published, Partial, Failed.

#### Scenario: Backend enums are mapped
- **WHEN** the status is `PENDING`, `RUNNING`, `COMPLETED` or `SUCCESS`, `PARTIALLY_COMPLETED`, or `FAILED`
- **THEN** the badge SHALL read Queued, Publishing, Published, Partial, or Failed respectively

### Requirement: Executions history

The system SHALL list the user's executions at `/executions` with pagination, a status filter and a
date range, each row showing the post title or preview, per-platform statuses, overall status and time.

#### Scenario: Filter and paginate
- **WHEN** the user picks a status or date range, or changes page
- **THEN** the system SHALL refetch `GET /executions` with the matching params and keep them in the URL

#### Scenario: Empty and error
- **WHEN** there are no executions or the request fails
- **THEN** the system SHALL show a no-results state (with a link to create a post) or an error state with retry

### Requirement: Execution detail

The system SHALL show at `/executions/[id]` the published content, image, overall status, timings, and
per-platform account name, status, published time, external link, failure reason and retry count.

#### Scenario: Deleted post
- **WHEN** the execution's post has `isDeleted` true
- **THEN** the system SHALL still show its content with a "Post deleted" note

#### Scenario: Unknown execution
- **WHEN** the API returns 404
- **THEN** the system SHALL show a not-found state linking back to `/executions`

### Requirement: Retry failed publications

The system SHALL offer Retry on failed publications and for the whole execution, calling
`POST /publications/:id/retry` or `POST /executions/:id/retry`, and resume live polling.

#### Scenario: Retry one platform
- **WHEN** the user clicks Retry on a failed publication
- **THEN** the system SHALL call the API, show it as queued, and poll until it is terminal while successful platforms stay unchanged

#### Scenario: Retry needs a connection
- **WHEN** the API returns 400 asking to connect the platform
- **THEN** the system SHALL show the message with a link to `/connections`

#### Scenario: Nothing to retry
- **WHEN** no publication is `retryable`
- **THEN** Retry controls SHALL NOT be shown

### Requirement: Visible read-only workflow

The system SHALL render the publishing workflow with React Flow on the execution detail page as a fixed,
read-only graph START -> PREPARE CONTENT -> one node per targeted platform (LinkedIn, Facebook) -> END, with
clearly visible connecting edges, and SHALL colour each node from the current execution and publication
statuses (pending, running, success, failed). The graph SHALL NOT be draggable, connectable or editable.

#### Scenario: Graph shows the structure
- **WHEN** a user opens an execution that targeted LinkedIn and Facebook
- **THEN** the system SHALL show START, PREPARE CONTENT, LINKEDIN, FACEBOOK and END nodes joined by edges

#### Scenario: Node state follows execution state
- **WHEN** LinkedIn succeeds and Facebook fails
- **THEN** the LinkedIn node SHALL show success, the Facebook node SHALL show failed, and the graph SHALL update during polling without reload

#### Scenario: Read-only
- **WHEN** the user tries to drag a node or draw an edge
- **THEN** nothing SHALL change, and the same status SHALL also be available as text/badges for accessibility

### Requirement: "You can leave this page" feedback

The system SHALL tell the user after a publish starts that "Publishing started. You can leave this page."
and that the run continues on the server, and SHALL still show current status when they return later.

#### Scenario: Leave and return
- **WHEN** a user starts a publish, closes the tab, and opens `/executions/<id>` later
- **THEN** the system SHALL show the up-to-date per-platform results

### Requirement: Publish validation parity

The system SHALL disable Publish Now until at least one connected platform is selected and the post has
content, and SHALL show the PRD messages "Select at least one platform", "Connect LinkedIn before
publishing" and "Facebook connection has expired. Please reconnect." for the matching conditions.

#### Scenario: Nothing selected
- **WHEN** no platform is checked
- **THEN** Publish Now SHALL be disabled with "Select at least one platform"

### Requirement: Outcome copy and history fidelity

The system SHALL phrase terminal outcomes as "Published successfully.", "LinkedIn published successfully,
but Facebook failed." (naming the real platforms), or "Publishing failed. You can retry.", and SHALL keep
showing a publication's recorded account name after its connection was disconnected.

#### Scenario: Partial outcome copy
- **WHEN** an execution ends PARTIALLY_COMPLETED with Facebook failed
- **THEN** the toast SHALL read "LinkedIn published successfully, but Facebook failed."

#### Scenario: Disconnected platform history
- **WHEN** a user disconnected a platform after publishing
- **THEN** the execution detail SHALL still show that publication's account name and result

### Requirement: Retry after reconnecting

The system SHALL let a user reconnect a platform from the retry guidance link and then retry the failed
publication successfully with the new connection.

#### Scenario: Reconnect then retry
- **WHEN** a retry is refused because the platform is not connected, and the user reconnects and returns
- **THEN** Retry SHALL be available and, when clicked, SHALL queue the publication
