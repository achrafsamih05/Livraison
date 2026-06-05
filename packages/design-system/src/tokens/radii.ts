/**
 * Border radius tokens.
 *
 * Components are "rounded" per the SKILL.md brand. These tokens give a calm,
 * cloud-platform feel without going fully pill-shaped except for chips/avatars.
 */
export const radii = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const;

export type RadiusToken = keyof typeof radii;
