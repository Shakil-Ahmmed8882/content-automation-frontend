## Purpose

Post-composer-ui lets a signed-in user write a post with an optional image, preview it per platform,
save it, browse their posts, view one, and delete it, and hands a saved post to the publish flow.

## ADDED Requirements

### Requirement: Compose a post with validation

The system SHALL provide a Create Post page with a required content field, an optional title and an
optional single image, validating before submit with the same rules as the backend.

#### Scenario: Empty content blocked
- **WHEN** the user submits with blank or whitespace-only content
- **THEN** the system SHALL show "Content is required" and SHALL NOT call the API

#### Scenario: Valid post saved
- **WHEN** the user submits valid content (and optionally a title and image)
- **THEN** the system SHALL send multipart data to `POST /posts`, show a success toast, and open the new post's detail page

#### Scenario: Server rejection
- **WHEN** the backend returns an error
- **THEN** the system SHALL show its message and SHALL keep the user's entered text and image

### Requirement: Single image upload rules

The system SHALL accept at most one image, of an image MIME type and no larger than 5 MB, showing a
preview with a remove control.

#### Scenario: Invalid file rejected
- **WHEN** the user picks a non-image file or one over 5 MB that cannot be reduced
- **THEN** the system SHALL show an inline error and SHALL NOT attach the file

#### Scenario: Image preview and removal
- **WHEN** the user picks a valid image and then removes it
- **THEN** the system SHALL show the preview and afterwards submit without an image

### Requirement: Target platforms limited to connected platforms

The system SHALL offer only connected platforms as publish targets and direct the user to
`/connections` for the rest.

#### Scenario: Connected platforms selectable
- **WHEN** LinkedIn and Facebook are connected
- **THEN** both SHALL appear as selectable checkboxes with the connected account name

#### Scenario: Expired or missing connection
- **WHEN** a platform is expired or not connected
- **THEN** it SHALL be disabled with a Reconnect or Connect link to `/connections`

#### Scenario: No connections
- **WHEN** the user has no connected platforms
- **THEN** the system SHALL show an empty state linking to `/connections` and Save & publish SHALL be disabled

### Requirement: Live per-platform preview

The system SHALL render a preview for each selected platform that updates as the user types or changes
the image, labelled as an approximation.

#### Scenario: Preview updates live
- **WHEN** the user edits content or attaches an image with a platform selected
- **THEN** that platform's preview SHALL reflect the change without a request

### Requirement: Publish handoff

The system SHALL, on Save & publish with at least one selected platform, create the post and then
navigate to `/posts/[id]?publish=<platformKeys>` for the publish flow to take over.

#### Scenario: Save and publish
- **WHEN** the user selects a target and chooses Save & publish
- **THEN** the system SHALL create the post and navigate with the selected platform keys

#### Scenario: No target selected
- **WHEN** the user chooses Save & publish with no target selected
- **THEN** the system SHALL show "Select at least one platform" and SHALL NOT create the post

### Requirement: Posts list with infinite scroll

The system SHALL list the user's posts newest first with debounced search, loading further pages as
the user scrolls, with loading, empty and error states.

#### Scenario: Scrolling loads more
- **WHEN** the user reaches the end of loaded posts and `page < totalPages`
- **THEN** the system SHALL fetch the next page and append it

#### Scenario: Empty and search-empty
- **WHEN** the user has no posts, or a search matches none
- **THEN** the system SHALL show a no-results state (with a Create Post action when there are no posts)

### Requirement: Post detail and delete

The system SHALL show a post's title, content, image and date at `/posts/[id]` and let the user delete
it after confirmation.

#### Scenario: Missing post
- **WHEN** `GET /posts/:id` returns 404
- **THEN** the system SHALL show a not-found state with a link back to the list

#### Scenario: Confirmed delete
- **WHEN** the user confirms Delete in the modal
- **THEN** the system SHALL call `DELETE /posts/:id`, show a toast, remove it from the list, and return to the list
