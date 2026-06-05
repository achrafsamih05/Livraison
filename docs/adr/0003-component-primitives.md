# ADR-0003 — Component primitives strategy

- Status: Accepted
- Date: 2026-06-05
- Deciders: Frontend platform, Accessibility, Design
- Supersedes: —

## Context

The design system must ship dozens of accessible primitives (Button, Input, Select, Tabs, Modal, Drawer, Popover, Tooltip, Toast, Table, etc.). Building all primitives from scratch is high risk for accessibility regressions; building entirely on a single vendor library is a large commitment.

## Decision

Adopt a **layered primitive strategy**:

1. **Native HTML where possible.** Buttons, inputs, and selects are rendered as native elements. Native `<select>` is preferred over a custom combobox for single-select; it inherits OS-level affordances and is robust under assistive technologies. Custom comboboxes ship later as a separate `ComboBox` primitive.
2. **Radix UI for unstyled, accessible behavior shells.** Used for compound interactive primitives where ARIA is non-trivial (Tabs, Dialog, Popover, Tooltip, Dropdown). We adopt Radix's API surface and apply our visual treatment via tokens.
3. **Class Variance Authority (CVA)** for typed variant composition (e.g., Button size and variant matrices). Keeps component APIs strongly typed.
4. **`asChild` pattern** (via Radix Slot) for composability with routing libraries (e.g., `next/link`) without losing styles or accessibility.

## Consequences

- Each primitive owns its own folder with `Component.tsx`, `Component.test.tsx`, `Component.stories.tsx`, `index.ts`.
- Tests must verify accessible name, keyboard interaction, and ARIA reflection of state. Testing Library is the chosen tool.
- Storybook stories are required for every primitive and exercise variants and disabled/loading/error states.
- Adding a new primitive follows the same shape so consumers and tooling can rely on it.
