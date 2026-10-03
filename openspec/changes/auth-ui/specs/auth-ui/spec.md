## Purpose

Auth-ui is how a person creates an account, proves their email, signs in and out, recovers a lost
password, and stays signed in across reloads without the browser ever handling tokens.

## ADDED Requirements

### Requirement: Registration with email verification

The system SHALL let a guest register with name, email and a password of at least 8 characters, then
require a 6-digit code sent to their email before the account is created and the user is signed in.

#### Scenario: Successful registration
- **WHEN** a guest submits valid details and then a correct code within 5 minutes
- **THEN** the system SHALL sign the user in and redirect to `/dashboard`

#### Scenario: Email already registered
- **WHEN** the backend replies that an account with the email exists
- **THEN** the system SHALL show that message on the form and offer a link to `/login`

#### Scenario: Wrong or expired code
- **WHEN** the user submits an incorrect or expired code
- **THEN** the system SHALL show the server message and, for an expired code, offer to start over

#### Scenario: Client validation
- **WHEN** the password is shorter than 8 characters or the code is not 6 digits
- **THEN** the system SHALL show field errors and SHALL NOT call the API

### Requirement: Login

The system SHALL let a user sign in with email and password and land on `/dashboard`, or on the
`next` path when it is a safe internal path.

#### Scenario: Valid credentials
- **WHEN** a user submits correct credentials
- **THEN** the system SHALL show the dashboard and the session SHALL reflect the user

#### Scenario: Invalid credentials
- **WHEN** the credentials are wrong
- **THEN** the system SHALL show "Invalid email or password" without indicating which field was wrong

#### Scenario: Blocked or deleted account
- **WHEN** the backend replies 403 for a blocked or deleted account
- **THEN** the system SHALL display that message

### Requirement: Logout

The system SHALL let a signed-in user log out, clearing the session and returning to the home page.

#### Scenario: Logout clears the session
- **WHEN** a signed-in user chooses Logout
- **THEN** the system SHALL call the logout endpoint, clear cached user data, and navigate to `/`

### Requirement: Password recovery

The system SHALL let a user request a reset code by email and then set a new password using the
email, the 6-digit code and a new password of at least 8 characters.

#### Scenario: Request reveals nothing
- **WHEN** a user submits any valid email on `/forgot-password`
- **THEN** the system SHALL show the same neutral confirmation whether or not the account exists

#### Scenario: Successful reset
- **WHEN** the user submits a valid code and new password
- **THEN** the system SHALL show a success message and redirect to `/login`

#### Scenario: Invalid reset code
- **WHEN** the code is wrong or expired
- **THEN** the system SHALL show the server message and keep the form filled

### Requirement: Session bootstrap and refresh

The system SHALL determine the current user on load via `GET /auth/me`, and on a 401 from any
request SHALL attempt one silent token refresh and retry before treating the user as signed out.

#### Scenario: Reload keeps the user signed in
- **WHEN** a signed-in user reloads any page
- **THEN** the system SHALL restore the session without showing the login page

#### Scenario: Expired access token
- **WHEN** an API call returns 401 and the refresh succeeds
- **THEN** the system SHALL retry the original call and the user SHALL see no interruption

#### Scenario: Refresh fails
- **WHEN** the refresh also returns 401
- **THEN** the system SHALL clear the session and redirect to `/login?next=` the current path

### Requirement: Redirect rules for auth pages

The system SHALL redirect signed-in users away from `/login`, `/register`, `/forgot-password` and
`/reset-password` to `/dashboard`, and SHALL ignore a `next` value that is not an internal path.

#### Scenario: Signed-in user opens login
- **WHEN** a signed-in user opens `/login`
- **THEN** the system SHALL redirect to `/dashboard`

#### Scenario: Unsafe next value
- **WHEN** the login URL carries `next=//evil.com`
- **THEN** the system SHALL redirect to `/dashboard` after login

### Requirement: Rate-limit and error messaging

The system SHALL show a distinct "too many attempts" state when the API replies 429 and a clear
retry message on network failure, with the submit button showing a loading state during requests.

#### Scenario: Rate limited
- **WHEN** an auth request returns 429
- **THEN** the system SHALL show "Too many attempts. Please try again later." and disable resubmission

#### Scenario: Network failure
- **WHEN** the API is unreachable
- **THEN** the system SHALL show a retryable error and keep entered values

### Requirement: No unavailable sign-in options

The system SHALL NOT render a Google (or other social) sign-in control while the backend exposes no
such endpoint, so no button pretends to work (PRD rule 4); the credentials flow is the only offered
method.

#### Scenario: Auth pages show credentials only
- **WHEN** `/login` or `/register` renders
- **THEN** no social sign-in button SHALL be present, and adding one later SHALL require a backend route

### Requirement: Session-expiry notice

The system SHALL tell the user when a session ended involuntarily and return them to where they were
after signing in again.

#### Scenario: Expired session notice
- **WHEN** the silent refresh fails on a protected page
- **THEN** the login page SHALL show "Your session expired. Please sign in again." and honour `next`
