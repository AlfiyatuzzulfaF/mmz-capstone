'use client';

import type { StudioRatioStat } from '@/types/booking';
import { Camera, PieChart } from 'lucide-react';
import React, { useMemo } from 'react';

export interface StudioRatioChartProps {
  data: StudioRatioStat[];
  isLoading?: boolean;
}

export function StudioRatioChart({ data, isLoading = false }: StudioRatioChartProps) {
  const { studio1, studio2, totalSessions, pct1, pct2 } = useMemo(() => {
    const s1 = data.find(
      (item) => item.studio.includes('1') || item.studio === 'Studio 1'
    ) || { studio: 'Studio 1', totalSesi: 0, persentase: 0 };

    const s2 = data.find(
      (item) => item.studio.includes('2') || item.studio === 'Studio 2'
    ) || { studio: 'Studio 2', totalSesi: 0, persentase: 0 };

    const total = s1.totalSesi + s2.totalSesi;
    const p1 = total > 0 ? Math.round((s1.totalSesi / total) * 100) : 50;
    const p2 = total > 0 ? 100 - p1 : 50;

    return {
      studio1: s1,
      studio2: s2,
      totalSessions: total,
      pct1: p1,
      pct2: p2,
    };
  }, [data]);

  // Radius = 54, Keliling Lingkaran = 2 * PI * 54 = 339.292
  const CIRCUMFERENCE = 339.292;
  const strokeLength1 = (pct1 / 100) * CIRCUMFERENCE;
  const strokeLength2 = (pct2 / 100) * CIRCUMFERENCE;

  return (
    <div className="bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* Header Kartu */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">
              Rasio Utilisasi Studio
            </h3>
          </div>
          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xs text-neutral-500 mb-4">
          Perbandingan proporsi pemakaian Studio 1 vs Studio 2
        </p>
      </div>

      {/* Konten Diagram Donat & Visualisasi */}
      <div className="my-auto py-2">
        {isLoading ? (
          // Loading Skeleton
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-pulse py-4">
            <div className="w-36 h-36 rounded-full bg-neutral-100" />
            <div className="space-y-3 w-full sm:w-44">
              <div className="h-9 w-full bg-neutral-100 rounded-full" />
              <div className="h-9 w-full bg-neutral-100 rounded-full" />
            </div>
          </div>
        ) : totalSessions === 0 ? (
          // Empty State
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-2.5">
              <Camera className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-neutral-700">
              Belum ada sesi pemotretan aktif pada periode ini.
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Grafik rasio akan terbentuk otomatis saat transaksi dicatat.
            </p>
          </div>
        ) : (
          // Diagram Donat SVG Responsif
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
                {/* Latar Belakang Track */}
                <circle
                  cx="80"
                  cy="80"
                  r="54"
                  fill="transparent"
                  stroke="#F4F5F7"
                  strokeWidth="16"
                />

                {/* Busur Studio 1 (Electric Blue #2563EB) */}
                <circle
                  cx="80"
                  cy="80"
                  r="54"
                  fill="transparent"
                  stroke="#2563EB"
                  strokeWidth="16"
                  strokeDasharray={`${strokeLength1} ${CIRCUMFERENCE}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />

                {/* Busur Studio 2 (Emerald Green #059669) */}
                <circle
                  cx="80"
                  cy="80"
                  r="54"
                  fill="transparent"
                  stroke="#059669"
                  strokeWidth="16"
                  strokeDasharray={`${strokeLength2} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-strokeLength1}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Teks Pusat Donat */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold tracking-tight text-neutral-900 leading-none">
                  {totalSessions}
                </span>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mt-1">
                  Total Sesi
                </span>
              </div>
            </div>

            {/* Pill Legend Kontrol */}
            <div className="space-y-2.5 w-full sm:w-auto">
              {/* Studio 1 Pill */}
              <div className="flex items-center justify-between sm:justify-start gap-3 px-3.5 py-2 rounded-2xl bg-blue-50/80 border border-blue-200/70 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-semibold text-blue-900">Studio 1</span>
                  <span className="text-blue-600/70 text-[11px]">(Reguler)</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto pl-2 font-mono">
                  <span className="font-semibold text-blue-900">{studio1.totalSesi} sesi</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    {pct1}%
                  </span>
                </div>
              </div>

              {/* Studio 2 Pill */}
              <div className="flex items-center justify-between sm:justify-start gap-3 px-3.5 py-2 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-900">Studio 2</span>
                  <span className="text-emerald-600/70 text-[11px]">(Self-Photo)</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto pl-2 font-mono">
                  <span className="font-semibold text-emerald-900">{studio2.totalSesi} sesi</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    {pct2}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Kartu */}
      <div className="mt-5 pt-3 border-t border-neutral-100/80 flex items-center justify-between text-[11px] text-neutral-400">
        <span>Kapasitas: 2 Ruangan Studio Aktif</span>
        <span className="font-medium text-neutral-600">
          Studio 1: {pct1}% · Studio 2: {pct2}%
        </span>
      </div>
    </div>
  );
}
