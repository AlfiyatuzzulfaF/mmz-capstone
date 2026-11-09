'use client';

import { GlobalFilterBar } from '@/components/dashboard/global-filter-bar';
import { KpiScorecards } from '@/components/dashboard/kpi-scorecards';
import type { BookingFilterParams, KpiSummary } from '@/types/booking';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [filters, setFilters] = useState<BookingFilterParams>({
    studioId: 'all',
    paymentStatus: 'all',
  });

  const [kpi, setKpi] = useState<KpiSummary>({
    totalBooking: 0,
    totalDpMasuk: 0,
    bookingTerkonfirmasi: 0,
    menungguPelunasan: 0,
  });

  const [isLoadingKpi, setIsLoadingKpi] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mengambil data analitik dan KPI dari backend endpoint /api/analytics
  useEffect(() => {
    let isCancelled = false;

    async function fetchDashboardKpi() {
      try {
        const params = new URLSearchParams();
        if (filters.startDate) params.set('startDate', filters.startDate);
        if (filters.endDate) params.set('endDate', filters.endDate);

        const url = `/api/analytics${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url);
        const json = await res.json();

        if (!isCancelled && json.success && json.data?.kpi) {
          setKpi(json.data.kpi);
        }
      } catch (err) {
        console.error('Gagal memuat data KPI dashboard:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingKpi(false);
          setIsRefreshing(false);
        }
      }
    }

    fetchDashboardKpi();

    return () => {
      isCancelled = true;
    };
  }, [filters.startDate, filters.endDate, isRefreshing]);

  const handleFilterChange = (newFilters: Partial<BookingFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
  };

  const handleOpenWalkin = () => {
    // Dipicu oleh tombol "+ Booking Walk-in", akan membuka modal walk-in (Task 10)
    console.log('Membuka formulir modal Booking Walk-in...');
  };

  return (
    <div className="flex flex-col">
      {/* 1. Kontrol Filter Global Bar */}
      <GlobalFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        onOpenWalkinModal={handleOpenWalkin}
        isRefreshing={isRefreshing}
      />

      {/* 2. Empat Kartu Metrik Ringkasan Operasional (KPI Scorecards) */}
      <KpiScorecards summary={kpi} isLoading={isLoadingKpi} />
    </div>
  );
}
