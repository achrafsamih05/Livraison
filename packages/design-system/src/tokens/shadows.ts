/**
 * Shadow tokens.
 *
 * Soft shadows aligned with the dark, glass-like panel aesthetic from SKILL.md.
 * Components must use semantic shadow tokens via CSS variables when contextual
 * elevation is required (cards, popovers, drawers).
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.32)',
  md: '0 4px 12px rgba(0, 0, 0, 0.36)',
  lg: '0 12px 32px rgba(0, 0, 0, 0.44)',
  focus: '0 0 0 3px rgba(12, 92, 171, 0.45)',
} as const;

export type ShadowToken = keyof typeof shadows;
