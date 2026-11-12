'use client';

import { StudioRatioChart } from '@/components/charts/studio-ratio-chart';
import { TopPackagesChart } from '@/components/charts/top-packages-chart';
import { OwnerInsightCard } from '@/components/dashboard/owner-insight-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatIndonesianDate, formatRupiah } from '@/lib/utils';
import type {
  BookingListItem,
  KpiSummary,
  StudioRatioStat,
  TopPackageStat,
} from '@/types/booking';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import React, { useMemo } from 'react';

export interface FinancialViewProps {
  kpi: KpiSummary;
  topPackages: TopPackageStat[];
  studioRatio: StudioRatioStat[];
  bookings: BookingListItem[];
  isLoadingAnalytics: boolean;
  onSettlePayment: (idBooking: number) => Promise<void>;
}

export function FinancialView({
  kpi,
  topPackages,
  studioRatio,
  bookings,
  isLoadingAnalytics,
  onSettlePayment,
}: FinancialViewProps) {
  // Hitung total estimasi perputaran kas dan sisa tagihan kasir
  const financialStats = useMemo(() => {
    let totalLunasNominal = 0;
    let totalSisaTagihan = 0;
    let totalSudahLunasCount = 0;
    let totalMenungguPelunasanCount = 0;

    for (const b of bookings) {
      if (b.statusBooking === 'batal') continue;

      if (b.statusPembayaran === 'lunas') {
        totalSudahLunasCount += 1;
        totalLunasNominal += b.nominalDp; // Pembayaran penuh tercatat
      } else {
        totalMenungguPelunasanCount += 1;
        // Asumsi estimasi sisa tagihan untuk operasional kasir
        totalSisaTagihan += Math.max(b.nominalDp, 0);
      }
    }

    return {
      totalLunasNominal,
      totalSisaTagihan,
      totalSudahLunasCount,
      totalMenungguPelunasanCount,
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Header Bar Laporan Finansial */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Laporan Finansial & Arus Kas Studio
          </h2>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Rekapitulasi uang muka (DP), verifikasi pelunasan kasir, dan proyeksi omset per paket foto
        </p>
      </div>

      {/* Grid 4 Kartu Ringkasan Finansial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kartu 1: Total Akumulasi DP */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500">
              Total Akumulasi DP
            </span>
            <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900 font-mono">
            {formatRupiah(kpi.totalDpMasuk)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Uang muka terverifikasi di rekening kasir
          </p>
        </div>

        {/* Kartu 2: Tagihan Menunggu Pelunasan */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500">
              Menunggu Pelunasan
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-600 font-mono">
            {kpi.menungguPelunasan} Sesi
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            DP telah masuk, sisa dilunasi saat hari sesi foto
          </p>
        </div>

        {/* Kartu 3: Sesi Sudah Lunas */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500">
              Sesi Terverifikasi Lunas
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 font-mono">
            {financialStats.totalSudahLunasCount} Sesi
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Seluruh kewajiban pembayaran telah selesai
          </p>
        </div>

        {/* Kartu 4: Total Reservasi Berjalan */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500">
              Total Reservasi
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-blue-600 font-mono">
            {kpi.totalBooking} Reservasi
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Volume pesanan aktif pada kalender studio
          </p>
        </div>
      </div>

      {/* Baris Analitik Owner & Rasio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <OwnerInsightCard
          kpi={kpi}
          topPackages={topPackages}
          studioRatio={studioRatio}
          isLoading={isLoadingAnalytics}
        />
        <TopPackagesChart data={topPackages} isLoading={isLoadingAnalytics} />
        <StudioRatioChart data={studioRatio} isLoading={isLoadingAnalytics} />
      </div>

      {/* Tabel Rincian Keuangan Pemesanan */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
        <div className="mb-4">
          <h3 className="text-base font-bold text-neutral-900 tracking-tight">
            Catatan Finansial Transaksi
          </h3>
          <p className="text-xs text-neutral-500">
            Daftar nominal uang muka (DP) dan status pelunasan per reservasi
          </p>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-400 font-medium">
                <th className="py-3 px-4">ID & Tanggal</th>
                <th className="py-3 px-4">Nama Pelanggan</th>
                <th className="py-3 px-4">Paket Foto</th>
                <th className="py-3 px-4">Studio</th>
                <th className="py-3 px-4">Nominal DP</th>
                <th className="py-3 px-4">Status Pembayaran</th>
                <th className="py-3 px-4 text-right">Aksi Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100/70">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-400">
                    Belum ada riwayat transaksi finansial tercatat.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const isPaid = b.statusPembayaran === 'lunas';
                  const isCanceled = b.statusBooking === 'batal';

                  return (
                    <tr key={b.idBooking} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-neutral-800">
                        #{b.idBooking} · {formatIndonesianDate(b.tanggalBooking)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-neutral-900">
                        {b.namaCustomer}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-700">
                        {b.namaPaket}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge variant="studio" status={b.idLokasi} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-semibold font-mono text-neutral-900">
                        {formatRupiah(b.nominalDp)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge variant="payment" status={b.statusPembayaran} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        {!isPaid && !isCanceled ? (
                          <button
                            type="button"
                            onClick={() => onSettlePayment(b.idBooking)}
                            className="px-3 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-medium transition-all shadow-sm"
                          >
                            Tandai Lunas
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-400 font-medium">
                            {isCanceled ? 'Dibatalkan' : 'Terverifikasi Lunas'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
