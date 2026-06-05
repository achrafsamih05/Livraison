# @livraison/design-system

The shared design system for all Livraison web portals (Admin, Internal Operations, Merchant, Customer, Developer).

## Highlights

- **Dark-first** palette anchored to brand tokens defined in `SKILL.md`.
- **8pt baseline grid** spacing.
- **WCAG 2.2 AA** focus visibility and accessible primitives.
- **RTL ready** via CSS logical properties.
- **Theme switching** via `[data-theme="light" | "dark"]` on `<html>`.
- **Framework-agnostic styles**: tokens are exposed as CSS variables; components do not require Tailwind in the consumer.

## Installation

This is a workspace package and is consumed via the monorepo's pnpm workspace protocol. From any app:

```jsonc
{
  "dependencies": {
    "@livraison/design-system": "workspace:*",
  },
}
```

Import the global stylesheet once at the application root:

```ts
import '@livraison/design-system/styles.css';
```

## Sprint 1 scope

The package ships the foundations and four primitives:

- **Tokens**: `colorPalette`, `semanticColors`, `spacing`, typography (`fontFamilies`, `fontSizes`, `lineHeights`, `fontWeights`), `radii`, `shadows`, motion (`durations`, `easings`).
- **Primitives**: `Button`, `Input`, `Select`, `Tabs`.
- **Storybook** with a11y, theme, and direction toolbars.
- **Vitest + Testing Library** unit tests.

Additional primitives (Modal, Drawer, Toast, Popover, Tooltip, Table, Dialog, ...) ship in subsequent sprints per `IMPLEMENTATION.md`.

## Theming

Components consume CSS variables. To brand a tenant subtree, override the variables in a scoped selector:

```css
[data-tenant='acme'] {
  --color-primary: #ff5722;
  --color-primary-hover: #f4511e;
  --color-primary-active: #e64a19;
}
```

## Accessibility

Every primitive is keyboard-operable, ships with visible focus rings, exposes ARIA where appropriate, and is verified through `axe` in Storybook (the `@storybook/addon-a11y` panel) and through Testing Library assertions.
