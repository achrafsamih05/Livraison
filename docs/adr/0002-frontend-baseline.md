# ADR-0002 — Frontend baseline: Next.js + Design System + Token-driven CSS variables

- Status: Accepted
- Date: 2026-06-05
- Deciders: Frontend platform, Design, Engineering leadership
- Supersedes: —

## Context

The platform requires multiple web portals (Admin, Internal Operations, Merchant, Customer + Public Tracking, Developer) that share visual identity, accessibility guarantees, and component behaviors. The portals must:

- Run as performant, server-rendered React apps with strong SEO for public surfaces.
- Support multiple tenants with brandable themes.
- Provide first-class RTL support (Arabic, Hebrew).
- Be operable by users with disabilities (WCAG 2.2 AA).
- Allow each portal team to ship independently while reusing a shared design system.

## Decision

1. **Application framework**: Next.js 14+ App Router for all web portals. Server Components by default; Client Components opt-in for interactivity.
2. **Shared design system**: A workspace package `@livraison/design-system` exposes tokens and primitives.
3. **Theming**: Tokens are exposed as CSS custom properties in a single `styles.css` shipped by the design system. Components consume semantic tokens (`var(--color-primary)`, `var(--color-text)`) and never hard-code color values.
4. **Styling approach**: Components use a small set of class names (e.g., `lv-button`) plus inline `style` for variant-specific values driven by tokens. This keeps the package usable in any consumer (Tailwind or vanilla CSS) and guarantees no Tailwind dependency leaks across the workspace.

## Alternatives considered

1. **CSS Modules per component.** Adequate but increases CSS payload duplication across apps and complicates token-driven theming.
2. **CSS-in-JS runtime (Emotion/Styled Components).** Adds runtime cost and conflicts with Next.js Server Components.
3. **Tailwind required in design system.** Strong DX in apps that already use Tailwind, but forces every consumer to adopt and configure Tailwind.
4. **Stitches / Vanilla Extract.** Static extraction is appealing; revisit when bundle pressure becomes critical. For Sprint 1, the simpler CSS-variable + inline-style approach is preferred.

## Consequences

- Visual changes can be made centrally by editing tokens in `styles.css` or in `tokens/*.ts`.
- Tenants can override semantic tokens in scoped selectors (`[data-tenant="acme"] { --color-primary: ... }`) without rebuilding the package.
- All component visuals are theme-agnostic by construction; light/dark theming is a single attribute switch on `<html>`.
- Storybook and tests must verify both themes and both directions (LTR/RTL); the Storybook preview is configured with toolbars to do so.
