'use client';

import { GlobalFilterBar } from '@/components/dashboard/global-filter-bar';
import { KpiScorecards } from '@/components/dashboard/kpi-scorecards';
import { OperationalTable } from '@/components/dashboard/operational-table';
import type { BookingFilterParams, BookingListItem, KpiSummary } from '@/types/booking';
import { CheckCircle2, XCircle } from 'lucide-react';
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

  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [isLoadingKpi, setIsLoadingKpi] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Mengambil data analitik KPI dan daftar pemesanan dari backend API
  useEffect(() => {
    let isCancelled = false;

    async function loadDashboardData() {
      try {
        // Parameter URL untuk analitik & bookings
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.set('startDate', filters.startDate);
        if (filters.endDate) queryParams.set('endDate', filters.endDate);
        if (filters.studioId && filters.studioId !== 'all') {
          queryParams.set('studioId', String(filters.studioId));
        }
        if (filters.paymentStatus && filters.paymentStatus !== 'all') {
          queryParams.set('paymentStatus', filters.paymentStatus);
        }

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

        // Mengambil KPI dan jadwal operasional secara paralel
        const [kpiRes, bookingsRes] = await Promise.all([
          fetch(`/api/analytics${queryString}`),
          fetch(`/api/bookings${queryString}`),
        ]);

        const [kpiJson, bookingsJson] = await Promise.all([
          kpiRes.json(),
          bookingsRes.json(),
        ]);

        if (!isCancelled) {
          if (kpiJson.success && kpiJson.data?.kpi) {
            setKpi(kpiJson.data.kpi);
          }
          if (bookingsJson.success && Array.isArray(bookingsJson.data)) {
            setBookings(bookingsJson.data);
          }
        }
      } catch (err) {
        console.error('Gagal memuat data dasbor:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingKpi(false);
          setIsLoadingBookings(false);
          setIsRefreshing(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isCancelled = true;
    };
  }, [filters.startDate, filters.endDate, filters.studioId, filters.paymentStatus, isRefreshing]);

  // Otomatis menutup notifikasi toast setelah 4 detik
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification]);

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

  // Pelunasan kasir dengan pembaruan UI optimistik
  const handleSettlePayment = async (idBooking: number) => {
    // Simpan salinan state sebelumnya untuk rollback jika request gagal
    const previousBookings = [...bookings];
    const previousKpi = { ...kpi };

    // 1. Pembaruan UI Optimistik seketika
    setBookings((prev) =>
      prev.map((item) =>
        item.idBooking === idBooking
          ? { ...item, statusPembayaran: 'lunas' }
          : item
      )
    );

    setKpi((prev) => ({
      ...prev,
      menungguPelunasan: Math.max(0, prev.menungguPelunasan - 1),
    }));

    try {
      const response = await fetch(`/api/bookings/${idBooking}/settle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal memperbarui status pelunasan.');
      }

      setNotification({
        type: 'success',
        message: `Pembayaran reservasi #${idBooking} berhasil diverifikasi Lunas.`,
      });
    } catch (error: unknown) {
      // 2. Rollback ke state sebelumnya jika terjadi kegagalan jaringan / server
      setBookings(previousBookings);
      setKpi(previousKpi);

      const errorMessage =
        error instanceof Error ? error.message : 'Terjadi kendala saat memproses pelunasan.';
      setNotification({
        type: 'error',
        message: errorMessage,
      });
    }
  };

  const handleReschedule = (booking: BookingListItem) => {
    console.log('Membuka modal Reschedule untuk booking #', booking.idBooking);
  };

  const handleCancel = (booking: BookingListItem) => {
    console.log('Membuka dialog pembatalan (soft delete) untuk booking #', booking.idBooking);
  };

  return (
    <div className="flex flex-col">
      {/* Toast Notifikasi Feedback Operasional */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-medium shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 ${
            notification.type === 'success'
              ? 'bg-neutral-900 text-white border border-neutral-800'
              : 'bg-rose-600 text-white border border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

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

      {/* 3. Tabel Operasional Jadwal Pemotretan (KF-13) */}
      <OperationalTable
        bookings={bookings}
        isLoading={isLoadingBookings}
        onSettlePayment={handleSettlePayment}
        onReschedule={handleReschedule}
        onCancel={handleCancel}
      />
    </div>
  );
}
