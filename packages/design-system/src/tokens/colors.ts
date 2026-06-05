/**
 * Color tokens for the Livraison design system.
 *
 * Tokens are organized by semantic role (primary, neutral, success, warning, danger,
 * surface, text) with numbered scales suitable for both light and dark themes.
 *
 * Source values for the dark theme are anchored to SKILL.md:
 * - primary 600   = #0C5CAB
 * - secondary 700 = #0a4a8a
 * - success 500   = #10b981
 * - warning 500   = #f59e0b
 * - danger 500    = #ef4444
 * - surface       = #09090b
 * - text          = #fafafa
 *
 * Other shades are derived for accessible contrast and consistent hierarchy.
 */

export const colorPalette = {
  primary: {
    50: '#e8f1fb',
    100: '#cfe2f6',
    200: '#a0c5ed',
    300: '#71a7e3',
    400: '#427ed1',
    500: '#1f6cc1',
    600: '#0C5CAB',
    700: '#0a4a8a',
    800: '#083969',
    900: '#062a4f',
  },
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
  success: {
    50: '#ecfdf5',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  danger: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
} as const;

/**
 * Semantic color tokens. These are theme-agnostic names that map to palette values
 * via CSS variables in styles.css. Components must consume semantic tokens.
 */
export const semanticColors = {
  background: 'var(--color-background)',
  surface: 'var(--color-surface)',
  surfaceElevated: 'var(--color-surface-elevated)',
  border: 'var(--color-border)',
  borderStrong: 'var(--color-border-strong)',
  text: 'var(--color-text)',
  textMuted: 'var(--color-text-muted)',
  textSubtle: 'var(--color-text-subtle)',
  textInverted: 'var(--color-text-inverted)',
  primary: 'var(--color-primary)',
  primaryHover: 'var(--color-primary-hover)',
  primaryActive: 'var(--color-primary-active)',
  primaryForeground: 'var(--color-primary-foreground)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  dangerHover: 'var(--color-danger-hover)',
  focusRing: 'var(--color-focus-ring)',
} as const;

export type ColorPalette = typeof colorPalette;
export type SemanticColors = typeof semanticColors;
