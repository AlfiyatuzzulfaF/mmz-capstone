'use client';

import type { BookingFilterParams, PaymentStatus } from '@/types/booking';
import {
  Calendar,
  ChevronDown,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface GlobalFilterBarProps {
  filters: BookingFilterParams;
  onFilterChange: (newFilters: Partial<BookingFilterParams>) => void;
  onRefresh: () => void;
  onOpenWalkinModal: () => void;
  isRefreshing?: boolean;
}

interface DatePresetOption {
  label: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Helper untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD.
 */
function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Helper untuk mendapatkan rentang bulan ini dalam format YYYY-MM-DD.
 */
function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  return {
    start: firstDay.toISOString().split('T')[0],
    end: lastDay.toISOString().split('T')[0],
  };
}

/**
 * Komponen Bar Filter Global dengan kontrol berbentuk kapsul (Pill Controls).
 * Mengatur filter tanggal, studio, status pembayaran, tombol refresh, dan aksi walk-in booking.
 */
export function GlobalFilterBar({
  filters,
  onFilterChange,
  onRefresh,
  onOpenWalkinModal,
  isRefreshing = false,
}: GlobalFilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<
    'date' | 'studio' | 'payment' | null
  >(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Menutup dropdown jika pengguna mengklik di luar area komponen
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Opsi Preset Tanggal
  const datePresets: DatePresetOption[] = [
    { label: 'Semua Waktu' },
    {
      label: 'Hari Ini',
      startDate: getTodayString(),
      endDate: getTodayString(),
    },
    {
      label: 'Bulan Ini',
      startDate: getCurrentMonthRange().start,
      endDate: getCurrentMonthRange().end,
    },
  ];

  // Menentukan label aktif tanggal
  let activeDateLabel = 'Semua Tanggal';
  if (filters.startDate && filters.endDate) {
    if (filters.startDate === filters.endDate) {
      activeDateLabel = 'Hari Ini';
    } else {
      activeDateLabel = 'Bulan Ini';
    }
  }

  // Menentukan label aktif studio
  let activeStudioLabel = 'Semua Ruangan';
  if (filters.studioId === 1) activeStudioLabel = 'Studio 1';
  if (filters.studioId === 2) activeStudioLabel = 'Studio 2';

  // Menentukan label aktif status pembayaran
  let activePaymentLabel = 'Semua Status';
  if (filters.paymentStatus === 'lunas') activePaymentLabel = 'Lunas';
  if (filters.paymentStatus === 'dp_diterima') activePaymentLabel = 'DP Diterima';
  if (filters.paymentStatus === 'belum_dibayar')
    activePaymentLabel = 'Menunggu Pembayaran';

  return (
    <div
      ref={containerRef}
      className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      {/* Judul Tampilan Halaman */}
      <div className="flex items-center gap-3">
        <h1 className="font-semibold text-2xl sm:text-3xl tracking-tight text-neutral-900">
          Ringkasan Operasional
        </h1>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200/80 text-xs font-medium text-neutral-600 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Sesi Aktif</span>
        </div>
      </div>

      {/* Kontrol Bar Kapsul (Pill Filters & Action Buttons) */}
      <div className="flex flex-wrap items-center gap-2 relative">
        {/* 1. Date Range Picker Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === 'date' ? null : 'date')
            }
            className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs font-medium text-neutral-700 hover:border-neutral-300 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>{activeDateLabel}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400 ml-0.5" />
          </button>

          {openDropdown === 'date' && (
            <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-white p-1.5 shadow-lg border border-neutral-100 z-50 animate-in fade-in zoom-in-95 duration-100">
              {datePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onFilterChange({
                      startDate: preset.startDate,
                      endDate: preset.endDate,
                    });
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors ${
                    activeDateLabel === preset.label
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Studio Selector Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === 'studio' ? null : 'studio')
            }
            className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs font-medium text-neutral-700 hover:border-neutral-300 transition-colors"
          >
            {filters.studioId === 1 && (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
            {filters.studioId === 2 && (
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            )}
            {(!filters.studioId || filters.studioId === 'all') && (
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
            )}
            <span>{activeStudioLabel}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400 ml-0.5" />
          </button>

          {openDropdown === 'studio' && (
            <div className="absolute left-0 mt-2 w-44 rounded-2xl bg-white p-1.5 shadow-lg border border-neutral-100 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  onFilterChange({ studioId: 'all' });
                  setOpenDropdown(null);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl font-medium transition-colors ${
                  !filters.studioId || filters.studioId === 'all'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-neutral-400" />
                <span>Semua Ruangan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onFilterChange({ studioId: 1 });
                  setOpenDropdown(null);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl font-medium transition-colors ${
                  filters.studioId === 1
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Studio 1</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onFilterChange({ studioId: 2 });
                  setOpenDropdown(null);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl font-medium transition-colors ${
                  filters.studioId === 2
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Studio 2</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Payment Status Filter Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === 'payment' ? null : 'payment')
            }
            className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs font-medium text-neutral-700 hover:border-neutral-300 transition-colors"
          >
            <span>{activePaymentLabel}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400 ml-0.5" />
          </button>

          {openDropdown === 'payment' && (
            <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-white p-1.5 shadow-lg border border-neutral-100 z-50 animate-in fade-in zoom-in-95 duration-100">
              {[
                { value: 'all', label: 'Semua Status' },
                {
                  value: 'lunas' as PaymentStatus,
                  label: 'Lunas',
                  dot: 'bg-emerald-500',
                },
                {
                  value: 'dp_diterima' as PaymentStatus,
                  label: 'DP Diterima',
                  dot: 'bg-amber-500',
                },
                {
                  value: 'belum_dibayar' as PaymentStatus,
                  label: 'Menunggu Pembayaran',
                  dot: 'bg-neutral-400',
                },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onFilterChange({
                      paymentStatus: item.value as PaymentStatus | 'all',
                    });
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl font-medium transition-colors ${
                    (item.value === 'all' &&
                      (!filters.paymentStatus ||
                        filters.paymentStatus === 'all')) ||
                    filters.paymentStatus === item.value
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {item.dot && (
                    <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                  )}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Action: Refresh Data Pill */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs font-medium text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-neutral-500 ${
              isRefreshing ? 'animate-spin text-orange-500' : ''
            }`}
          />
          <span>{isRefreshing ? 'Memuat...' : 'Perbarui'}</span>
        </button>

        {/* 5. Action: Add Walk-in Booking Button */}
        <button
          type="button"
          onClick={onOpenWalkinModal}
          className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-sm transition-all ml-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Booking Walk-in</span>
        </button>
      </div>
    </div>
  );
}
