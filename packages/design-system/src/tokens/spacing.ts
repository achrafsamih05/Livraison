/**
 * 8pt baseline grid spacing tokens.
 *
 * Each step is 4px to support tight layouts (icons, chips) but the canonical
 * grid step is 8px. Components must compose layout from these tokens to keep
 * a consistent vertical and horizontal rhythm.
 */
export const spacing = {
  none: '0px',
  '0.5': '2px',
  '1': '4px',
  '1.5': '6px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
} as const;

export type SpacingToken = keyof typeof spacing;
