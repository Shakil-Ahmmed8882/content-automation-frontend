## Purpose

User-profile-ui lets a signed-in user see and manage their own account: identity, avatar, password,
premium status, and deletion.

## ADDED Requirements

### Requirement: View profile

The system SHALL show at `/profile` the user's avatar, name, email, role, linked sign-in methods and
member-since date, with skeleton loading and an error state with retry.

#### Scenario: Profile loads
- **WHEN** a signed-in user opens `/profile`
- **THEN** the system SHALL display their details, with the email shown read-only

#### Scenario: Profile fails to load
- **WHEN** the profile request fails
- **THEN** the system SHALL show an error message with a Retry action

### Requirement: Premium badge

The system SHALL show a premium badge with the premium-since date for premium users, and an Upgrade
action linking to `/payment` for non-premium users.

#### Scenario: Premium user
- **WHEN** a premium user views their profile
- **THEN** the system SHALL show the premium badge and the date premium began

#### Scenario: Non-premium user
- **WHEN** a non-premium user views their profile
- **THEN** the system SHALL show an Upgrade button instead of the badge

### Requirement: Edit name

The system SHALL let the user change their name (required, trimmed, non-empty) and SHALL NOT allow
changing the email.

#### Scenario: Name saved
- **WHEN** the user submits a valid new name
- **THEN** the system SHALL save it, show a success message, and the navbar and sidebar SHALL show the new name

#### Scenario: Empty name
- **WHEN** the user submits an empty name
- **THEN** the system SHALL show "Name is required" and SHALL NOT call the API

### Requirement: Avatar management

The system SHALL let the user upload or replace an avatar (image files up to 5 MB) and remove it,
showing initials via BaseAvatar when no avatar exists.

#### Scenario: Avatar uploaded
- **WHEN** the user selects a valid image
- **THEN** the system SHALL show an uploading state, then display the new avatar everywhere in the app

#### Scenario: Invalid file
- **WHEN** the user selects a non-image or a file over 5 MB
- **THEN** the system SHALL show an inline error and SHALL NOT upload

#### Scenario: Avatar removed
- **WHEN** the user removes their avatar
- **THEN** the system SHALL show initials in place of the image

### Requirement: Change password

The system SHALL let a user with a password-based account change it by entering the current password
and a new password of at least 8 characters.

#### Scenario: Password changed
- **WHEN** the user submits the correct current password and a valid new password
- **THEN** the system SHALL show a success message and clear the form

#### Scenario: Wrong current password
- **WHEN** the backend replies that the current password is incorrect
- **THEN** the system SHALL show the error on the current-password field

#### Scenario: Account without a password
- **WHEN** the account has no password-based sign-in method
- **THEN** the system SHALL hide the form and point the user to forgot-password

### Requirement: Delete account

The system SHALL let the user delete their account only after an explicit confirmation modal, then
sign them out and return them to the home page.

#### Scenario: Deletion confirmed
- **WHEN** the user confirms deletion in the modal
- **THEN** the system SHALL delete the account, clear the session, and navigate to `/`

#### Scenario: Deletion cancelled
- **WHEN** the user cancels or closes the modal
- **THEN** the system SHALL leave the account and session unchanged

#### Scenario: Deletion fails
- **WHEN** the delete request fails
- **THEN** the system SHALL keep the modal open with the server error message

### Requirement: Account actions and entry points

The system SHALL show on `/profile` a Logout action and entry points to upgrade (non-premium) and to
payment history, so the profile is the hub for account and billing actions.

#### Scenario: Logout from profile
- **WHEN** the user chooses Logout on `/profile`
- **THEN** the system SHALL end the session and navigate to `/`

#### Scenario: Billing entry points
- **WHEN** the profile renders
- **THEN** it SHALL link to `/payment/history`, and to `/payment` when the user is not premium

### Requirement: Profile mutations give feedback and respect owner scope

The system SHALL show a pending state and a success or error toast for every profile mutation, and
SHALL never send a user id from the client (the backend resolves the user from the session).

#### Scenario: No client-supplied identity
- **WHEN** any profile request is made
- **THEN** the URL and body SHALL contain no user id and no email
