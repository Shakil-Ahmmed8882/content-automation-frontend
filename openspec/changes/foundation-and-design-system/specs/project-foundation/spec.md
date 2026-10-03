## Purpose

A runnable, conventional, verified base so each feature slice only adds its own api, hooks, and UI.

## ADDED Requirements

### Requirement: The app runs and builds cleanly

The system SHALL start in development, produce a production build, and pass type-check and lint with no errors.

#### Scenario: Quality gate
- **WHEN** the type-check, lint, and production build are run
- **THEN** each SHALL complete without errors

### Requirement: Data access follows the layered convention

The system SHALL provide an HTTP client that sends credentials with every request and a query client provider,
so features follow component → hook → api function → backend.

#### Scenario: Cookie credentials
- **WHEN** any API function issues a request
- **THEN** the request SHALL include credentials and target the configured API base URL

### Requirement: Reusable UI blocks are available and working

The system SHALL include the reusable UI block library (buttons, images/avatars, form fields, date and time
pickers, multipage modal, infinite scroll, pagination, skeletons) compiled and lint-clean in this project.

#### Scenario: Blocks compile
- **WHEN** the project is type-checked
- **THEN** every block in the library SHALL resolve its imports and type-check

### Requirement: A branded public home page exists

The system SHALL serve a public home page with header, hero, features, how-it-works, premium teaser, and footer
that adapts to mobile widths and has no console errors.

#### Scenario: Desktop and mobile
- **WHEN** the home page is opened at 1440px and at 390px width
- **THEN** all sections SHALL render without horizontal scroll and the mobile header SHALL offer a working menu

### Requirement: Planning and conventions are documented

The repository SHALL contain project conventions, a decision log, and validated OpenSpec changes for every
planned slice.

#### Scenario: Planned slices
- **WHEN** the OpenSpec changes are listed and validated
- **THEN** each planned slice SHALL exist and validate in strict mode
