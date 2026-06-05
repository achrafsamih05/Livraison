/**
 * Motion tokens.
 *
 * All durations should be small and purposeful. Components must respect the
 * prefers-reduced-motion media query and disable non-essential transitions.
 */
export const durations = {
  instant: '0ms',
  fast: '120ms',
  base: '180ms',
  slow: '240ms',
} as const;

export const easings = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  decelerate: 'cubic-bezier(0, 0, 0, 1)',
  accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
} as const;

export type DurationToken = keyof typeof durations;
export type EasingToken = keyof typeof easings;
