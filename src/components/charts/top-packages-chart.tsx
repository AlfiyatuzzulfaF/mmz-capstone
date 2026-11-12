'use client';

import type { TopPackageStat } from '@/types/booking';
import { Package, PackageOpen } from 'lucide-react';
import React, { useMemo } from 'react';

export interface TopPackagesChartProps {
  data: TopPackageStat[];
  isLoading?: boolean;
}

export function TopPackagesChart({ data, isLoading = false }: TopPackagesChartProps) {
  const { totalAll, maxSales } = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.totalTerjual, 0);
    const max = Math.max(...data.map((item) => item.totalTerjual), 1);
    return { totalAll: total, maxSales: max };
  }, [data]);

  return (
    <div className="bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* Header Kartu */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neutral-900" />
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">
              Paket Terlaris
            </h3>
          </div>
          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xs text-neutral-500 mb-5">
          Peringkat volume pemesanan paket foto aktif
        </p>
      </div>

      {/* Konten Grafik Batang */}
      <div className="space-y-4 my-auto">
        {isLoading ? (
          // Loading Skeleton
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="animate-pulse space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-28 bg-neutral-100 rounded" />
                <div className="h-3.5 w-16 bg-neutral-100 rounded" />
              </div>
              <div className="w-full h-3.5 bg-neutral-100 rounded-full" />
            </div>
          ))
        ) : data.length === 0 || totalAll === 0 ? (
          // Empty State
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-2.5">
              <PackageOpen className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-neutral-700">
              Belum ada data penjualan paket pada periode ini.
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Data akan otomatis diperbarui saat pemesanan baru terkonfirmasi.
            </p>
          </div>
        ) : (
          // Daftar Batang Paket
          data.map((item, index) => {
            const percentage =
              totalAll > 0 ? Math.round((item.totalTerjual / totalAll) * 100) : 0;
            const barWidth = Math.max((item.totalTerjual / maxSales) * 100, 6);

            return (
              <div key={item.namaPaket || index} className="space-y-1.5 group">
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-1.5 font-medium text-neutral-800 min-w-0">
                    <span className="w-4 text-neutral-400 font-mono text-[11px] shrink-0">
                      #{index + 1}
                    </span>
                    <span className="truncate">
                      {item.namaPaket}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                      {item.totalTerjual} sesi
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-semibold whitespace-nowrap">
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Bar Horizontal Rounded-Full */}
                <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-neutral-800 to-neutral-900 transition-all duration-700 ease-out group-hover:from-neutral-700 group-hover:to-neutral-800"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Kartu */}
      <div className="mt-5 pt-3 border-t border-neutral-100/80 flex items-center justify-between text-[11px] text-neutral-400">
        <span>Sumber: Riwayat Reservasi Terkonfirmasi</span>
        <span className="font-medium text-neutral-600">
          Total: {totalAll} sesi
        </span>
      </div>
    </div>
  );
}
