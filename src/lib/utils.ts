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

/**
 * Format a YYYY-MM-DD date string to Indonesian localized format (e.g., "15 Nov 2026").
 */
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Format a phone number into readable grouped chunks (e.g., "0812-3456-7890").
 */
export function formatDisplayPhone(phone: string): string {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('62')) {
    const local = '0' + clean.slice(2);
    return local.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
  }
  return clean.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
}

