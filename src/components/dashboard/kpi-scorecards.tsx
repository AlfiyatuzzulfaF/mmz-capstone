'use client';

import { formatRupiah } from '@/lib/utils';
import type { KpiSummary } from '@/types/booking';
import {
  AlertCircle,
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  CreditCard,
} from 'lucide-react';

export interface KpiScorecardsProps {
  summary?: KpiSummary;
  isLoading?: boolean;
}

/**
 * Komponen Skeleton untuk kartu KPI saat data sedang dimuat.
 */
function KpiSkeletonCard() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[175px] animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-28 bg-neutral-200 rounded-full" />
        <div className="h-8 w-8 bg-neutral-100 rounded-full" />
      </div>
      <div>
        <div className="h-10 w-36 bg-neutral-200 rounded-xl mb-3" />
        <div className="h-3 w-44 bg-neutral-100 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Komponen 4 Kartu Metrik Ringkasan Operasional (KPI Scorecards) bergaya Zentra Clean SaaS.
 * Menampilkan Total Reservasi, Akumulasi DP dengan striped bar, Pemesanan Terkonfirmasi, dan Menunggu Pelunasan.
 */
export function KpiScorecards({
  summary = {
    totalBooking: 0,
    totalDpMasuk: 0,
    bookingTerkonfirmasi: 0,
    menungguPelunasan: 0,
  },
  isLoading = false,
}: KpiScorecardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KpiSkeletonCard />
        <KpiSkeletonCard />
        <KpiSkeletonCard />
        <KpiSkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {/* 1. KARTU: TOTAL RESERVASI */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between relative group hover:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.06)] transition-all">
        {/* Header Kartu */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Reservasi
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
            <CalendarDays className="h-4 w-4" />
          </div>
        </div>

        {/* Nilai Utama & Micro Trend Pill */}
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
            {summary.totalBooking}
          </span>
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
            <ArrowUpRight className="w-3 h-3" /> +12.5%
          </span>
        </div>

        <p className="text-xs text-neutral-500 font-medium">
          Sesi aktif dan terjadwal di sistem
        </p>
      </div>

      {/* 2. KARTU: TOTAL AKUMULASI DP (DENGAN STRIPED PROGRESS BAR) */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between relative group hover:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.06)] transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Akumulasi DP
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <CreditCard className="h-4 w-4" />
          </div>
        </div>

        {/* Nilai Format Rupiah */}
        <div className="mb-2">
          <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
            {formatRupiah(summary.totalDpMasuk)}
          </span>
        </div>

        {/* Micro-Visual: Striped Segmented Progress Bar (Studio 1 vs Studio 2) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Studio 1 (60%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Studio 2 (40%)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-neutral-100 flex overflow-hidden">
            {/* Studio 1 Striped Bar */}
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{
                width: '60%',
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px)',
              }}
            />
            {/* Studio 2 Striped Bar */}
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{
                width: '40%',
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px)',
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. KARTU: PEMESANAN TERKONFIRMASI */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between relative group hover:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.06)] transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Pemesanan Terkonfirmasi
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <CalendarCheck className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
            {summary.bookingTerkonfirmasi}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            Kalender Aktif
          </span>
        </div>

        <p className="text-xs text-neutral-500 font-medium">
          Slot jadwal studio telah terkunci
        </p>
      </div>

      {/* 4. KARTU: MENUNGGU PELUNASAN */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between relative group hover:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.06)] transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Menunggu Pelunasan
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
            {summary.menungguPelunasan}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
            Tagihan Kasir
          </span>
        </div>

        <p className="text-xs text-neutral-500 font-medium">
          DP diterima, menunggu sisa pembayaran
        </p>
      </div>
    </div>
  );
}
