import { cn } from '@/lib/utils';
import type { BookingStatus, PaymentStatus, StudioId } from '@/types/booking';
import React from 'react';

type StudioBadgeProps = {
  variant: 'studio';
  status: StudioId | number | string;
  className?: string;
};

type PaymentBadgeProps = {
  variant: 'payment';
  status: PaymentStatus | string;
  className?: string;
};

type BookingBadgeProps = {
  variant: 'booking';
  status: BookingStatus | string;
  className?: string;
};

export type StatusBadgeProps = StudioBadgeProps | PaymentBadgeProps | BookingBadgeProps;

export function StatusBadge({ variant, status, className }: StatusBadgeProps) {
  if (variant === 'studio') {
    const isStudio1 = status === 1 || status === '1' || status === 'Studio 1';
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          isStudio1
            ? 'bg-blue-50 border-blue-200/60 text-blue-700'
            : 'bg-emerald-50 border-emerald-200/60 text-emerald-700',
          className
        )}
      >
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            isStudio1 ? 'bg-blue-600' : 'bg-emerald-600'
          )}
        />
        {isStudio1 ? 'Studio 1' : 'Studio 2'}
      </span>
    );
  }

  if (variant === 'payment') {
    switch (status) {
      case 'lunas':
        return (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-medium',
              className
            )}
          >
            Lunas
          </span>
        );
      case 'dp_diterima':
        return (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-medium',
              className
            )}
          >
            DP Diterima
          </span>
        );
      case 'belum_dibayar':
      default:
        return (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs font-medium',
              className
            )}
          >
            Belum Dibayar
          </span>
        );
    }
  }

  // Variant 'booking'
  switch (status) {
    case 'terkonfirmasi':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-medium',
            className
          )}
        >
          Terkonfirmasi
        </span>
      );
    case 'selesai':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-medium',
            className
          )}
        >
          Selesai
        </span>
      );
    case 'reschedule':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-medium',
            className
          )}
        >
          Reschedule
        </span>
      );
    case 'batal':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium',
            className
          )}
        >
          Batal
        </span>
      );
    case 'menunggu_dp':
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs font-medium',
            className
          )}
        >
          Menunggu DP
        </span>
      );
  }
}
