# payment-ui Specification

## Purpose
The user-facing premium upgrade flow (bKash sandbox): start payment, handle the return redirect,
show payment status, refresh premium state, and list payment history.

## ADDED Requirements

### Requirement: Start a premium payment
The `/payment` page SHALL show premium benefits and an "Upgrade to Premium" button that creates a
payment and sends the browser to bKash.

#### Scenario: Successful start
- **WHEN** a non-premium user clicks "Upgrade to Premium"
- **THEN** the app SHALL call `POST /payments/create`, store the returned `paymentId`, and navigate the browser to the returned `redirectUrl`

#### Scenario: Create fails
- **WHEN** `POST /payments/create` returns an error or network failure
- **THEN** the page SHALL show the backend `message` in an error state with a retry action and SHALL NOT redirect

#### Scenario: Already premium
- **WHEN** the profile reports `isPremium: true`
- **THEN** the page SHALL show a "You are Premium" state with the `premiumSince` date and SHALL NOT offer the upgrade button

### Requirement: Double-submit protection
The upgrade action SHALL NOT create more than one payment per user intent.

#### Scenario: Rapid double click
- **WHEN** the user clicks the upgrade button twice quickly
- **THEN** only one `POST /payments/create` SHALL be sent and the button SHALL show a loading/disabled state until navigation or error

### Requirement: Handle bKash return on success page
`/payment/success` SHALL confirm the payment with the backend before declaring success, since the redirect carries no query params.

#### Scenario: Confirmed success
- **WHEN** the user lands on `/payment/success` and `POST /payments/verify` returns `status: "SUCCESS"`
- **THEN** the page SHALL show a success state with amount, currency and `providerTransactionId`, and a link to Upcoming Features

#### Scenario: Not actually paid
- **WHEN** verify returns `FAILED` or `CANCELLED` (or 404)
- **THEN** the page SHALL show the matching failure state instead of success

#### Scenario: Still pending
- **WHEN** verify returns `PENDING`
- **THEN** the page SHALL show a "Confirming payment" state, retry a bounded number of times, then offer a manual Retry button

### Requirement: Failure and cancel states
`/payment/failure` SHALL explain what happened using the payment's real status.

#### Scenario: Cancelled by user
- **WHEN** `GET /payments/:id` returns `CANCELLED`
- **THEN** the page SHALL say the payment was cancelled and offer "Try again" back to `/payment`

#### Scenario: Failed or unknown
- **WHEN** the status is `FAILED`, or no payment can be resolved
- **THEN** the page SHALL show a generic failure message with "Try again" and a link to payment history

### Requirement: Premium state refresh
After a confirmed `SUCCESS` the app SHALL reflect premium immediately.

#### Scenario: Badge and gates update
- **WHEN** a payment is confirmed `SUCCESS`
- **THEN** the `/auth/me` and `/users/me` queries SHALL be invalidated and the premium badge and Upcoming Features sidebar entry SHALL appear without a manual reload

### Requirement: Payment history list
`/payment/history` SHALL list the user's payments newest first with pagination and status filtering.

#### Scenario: Populated list
- **WHEN** `GET /payments?page&limit` returns rows
- **THEN** the page SHALL show date, amount+currency, status badge and invoice number per row, with `Pagination` driven by `meta`

#### Scenario: Filter by status
- **WHEN** the user picks a status (`PENDING|SUCCESS|FAILED|CANCELLED`)
- **THEN** the list SHALL refetch with `status=<value>` and reset to page 1

#### Scenario: Empty and error
- **WHEN** there are no payments, or the request fails
- **THEN** the page SHALL show an empty state with an upgrade CTA, or an error state with retry; loading SHALL show skeleton rows

### Requirement: Payment detail
`/payment/history/[id]` SHALL show one payment owned by the user.

#### Scenario: Detail and not found
- **WHEN** `GET /payments/:id` succeeds
- **THEN** the page SHALL show provider, purpose, amount, currency, status, invoice number, transaction id, `paidAt`, `createdAt`
- **WHEN** it returns 404
- **THEN** the page SHALL show a "Payment not found" state
