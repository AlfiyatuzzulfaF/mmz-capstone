import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility helper to merge conditional class names with Tailwind CSS resolution.
 * Combines clsx for conditional class handling and tailwind-merge to resolve style conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Utility helper to format a numeric amount into Indonesian Rupiah currency string.
 * Example: 8450000 -> "Rp 8.450.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
