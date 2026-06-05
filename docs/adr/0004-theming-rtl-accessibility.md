# ADR-0004 — Theming, RTL, and accessibility baseline

- Status: Accepted
- Date: 2026-06-05
- Deciders: Frontend platform, Accessibility, Design, Internationalization
- Supersedes: —

## Context

Livraison operates in markets with mixed reading directions (Arabic, Hebrew, Latin scripts) and serves users across the accessibility spectrum. A consistent baseline is required so components do not become an accessibility or localization liability over time.

## Decision

1. **Theming**: Two themes, `dark` (default) and `light`. Selected via `data-theme` on `<html>`. Tokens are applied as CSS custom properties in `:root[data-theme="dark"]` and `:root[data-theme="light"]`. Tenant overrides are nested selectors (`[data-tenant="..."]`).
2. **RTL**:
   - All component layouts use **CSS logical properties** (`inline-start`, `inline-end`, `padding-inline-*`, `margin-inline-*`).
   - Components must not rely on `left`/`right` for layout.
   - Storybook ships an RTL toolbar to validate visual mirroring.
3. **Accessibility (WCAG 2.2 AA)**:
   - Every interactive element has a visible focus ring (`--color-focus-ring`, ≥ 3:1 contrast against adjacent surface).
   - Touch targets meet 44 × 44 px minimum.
   - Form fields always provide a programmatic label, plus helper and error text wired via `aria-describedby` and `aria-errormessage`.
   - Loading state communicates via `aria-busy="true"` and disables interaction.
   - Reduced motion is respected (CSS `prefers-reduced-motion`).
   - Storybook integrates `@storybook/addon-a11y` to surface violations during component development.

## Consequences

- Reviewers may reject components that introduce hard-coded color values, physical-direction layout, or missing focus rings.
- Accessibility tests are part of the Definition of Done for primitives, validated through Testing Library and the Storybook a11y addon.
- New tenants are onboarded by setting one CSS variable scope, not by adding theme branches in component code.
