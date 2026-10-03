## Purpose

A single dark visual language, derived from the Vercel-inspired design system, applied through tokens so every
surface — navbar, cards, buttons, forms, footer — stays consistent.

## ADDED Requirements

### Requirement: The application is dark-only

The system SHALL render every page with a dark theme and SHALL NOT depend on the visitor's OS color scheme.

#### Scenario: Visitor with a light OS theme
- **WHEN** a visitor whose OS prefers a light theme opens any page
- **THEN** the page SHALL render with the dark surfaces and light text

### Requirement: Styling uses design tokens

The system SHALL express colors, radii, shadows, and type scale as tokens in the global stylesheet, and UI
components SHALL use those tokens instead of raw color values.

#### Scenario: Token change propagates
- **WHEN** a surface or text token value is changed in the stylesheet
- **THEN** all components using that token SHALL reflect the change without per-component edits

### Requirement: Typography follows the design system

The system SHALL use Geist for text and Geist Mono for technical labels, SHALL cap heading weight at 600, and
SHALL apply negative letter-spacing to display headings.

#### Scenario: Headline style
- **WHEN** a display headline is rendered
- **THEN** it SHALL be sentence-case, weight 600 or lighter, with negative tracking

### Requirement: Buttons and cards follow the elevation and shape rules

The system SHALL render primary actions as a light pill-or-6px button on dark surfaces, and cards with a stacked
shadow plus an inset hairline instead of a single heavy drop shadow.

#### Scenario: Marketing call to action
- **WHEN** the home page hero renders its primary action
- **THEN** it SHALL be a pill-shaped light button with dark text

### Requirement: One brand mark across surfaces

The system SHALL use the same logo glyph in the header, the footer, and the browser tab icon.

#### Scenario: Browser tab
- **WHEN** any page is open in a browser tab
- **THEN** the tab icon SHALL show the brand mark
