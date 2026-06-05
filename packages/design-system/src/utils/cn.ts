import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Conditional class name composer.
 *
 * Combines `clsx` (conditional class arrays/objects) with `tailwind-merge`
 * (deduplicates conflicting Tailwind utility classes when consumers wire the
 * design system into a Tailwind app). Safe to use even without Tailwind.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
