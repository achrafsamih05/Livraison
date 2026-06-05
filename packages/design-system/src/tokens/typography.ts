/**
 * Typography tokens.
 *
 * Type scale: 12 / 14 / 16 / 20 / 24 / 32. Aligned with the design system mission
 * in SKILL.md and the 8pt baseline grid.
 *
 * Font family is IBM Plex Sans; the mono channel reuses IBM Plex Sans by design
 * decision so text and inline code share metrics in dashboards. If a true
 * monospace is required later, switch the `mono` token to `IBM Plex Mono`.
 */
export const fontFamilies = {
  primary:
    '"IBM Plex Sans", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  display:
    '"IBM Plex Sans", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  mono: '"IBM Plex Sans", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
} as const;

export const fontSizes = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
} as const;

export const lineHeights = {
  xs: '16px',
  sm: '20px',
  base: '24px',
  lg: '28px',
  xl: '32px',
  '2xl': '40px',
} as const;

export const fontWeights = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

export type FontSizeToken = keyof typeof fontSizes;
export type FontWeightToken = keyof typeof fontWeights;
