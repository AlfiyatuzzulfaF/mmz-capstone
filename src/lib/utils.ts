import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility helper to merge conditional class names with Tailwind CSS resolution.
 * Combines clsx for conditional class handling and tailwind-merge to resolve style conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
