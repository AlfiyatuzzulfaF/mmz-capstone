'use client';

import { StatusBadge } from '@/components/ui/status-badge';
import { formatDisplayPhone, formatIndonesianDate, formatRupiah } from '@/lib/utils';
import type { BookingListItem } from '@/types/booking';
import { normalizeIndonesianPhone } from '@/validations/booking.schema';
import {
  Calendar,
  CalendarX2,
  Camera,
  Check,
  Loader2,
  MessageCircle,
  Search,
  XCircle,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

export interface OperationalTableProps {
  bookings: BookingListItem[];
  isLoading?: boolean;
  onSettlePayment?: (idBooking: number) => Promise<void>;
  onCompleteSession?: (idBooking: number) => Promise<void>;
  onReschedule?: (booking: BookingListItem) => void;
  onCancel?: (booking: BookingListItem) => void;
}

export function OperationalTable({
  bookings,
  isLoading = false,
  onSettlePayment,
  onCompleteSession,
  onReschedule,
  onCancel,
}: OperationalTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [settlingIds, setSettlingIds] = useState<Record<number, boolean>>({});
  const [completingIds, setCompletingIds] = useState<Record<number, boolean>>({});

  // Filter client-side berdasarkan pencarian nama pelanggan, paket, atau nomor whatsapp
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const query = searchQuery.toLowerCase().trim();
    return bookings.filter(
      (b) =>
        b.namaCustomer.toLowerCase().includes(query) ||
        b.namaPaket.toLowerCase().includes(query) ||
        b.noWhatsapp.includes(query) ||
        (b.backgroundDetail && b.backgroundDetail.toLowerCase().includes(query))
    );
  }, [bookings, searchQuery]);

  const handleSettle = async (idBooking: number) => {
    if (!onSettlePayment || settlingIds[idBooking]) return;
    try {
      setSettlingIds((prev) => ({ ...prev, [idBooking]: true }));
      await onSettlePayment(idBooking);
    } finally {
      setSettlingIds((prev) => {
        const next = { ...prev };
        delete next[idBooking];
        return next;
      });
    }
  };

  const handleComplete = async (idBooking: number) => {
    if (!onCompleteSession || completingIds[idBooking]) return;
    try {
      setCompletingIds((prev) => ({ ...prev, [idBooking]: true }));
      await onCompleteSession(idBooking);
    } finally {
      setCompletingIds((prev) => {
        const next = { ...prev };
        delete next[idBooking];
        return next;
      });
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] mt-6">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
            Jadwal Sesi Operasional
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Daftar reservasi terkonfirmasi dan antrean kasir studio
          </p>
        </div>

        {/* Micro Search Input Pill */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pelanggan / paket..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-neutral-100/70 border border-neutral-200/60 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:bg-white focus:border-neutral-300 transition-all placeholder:text-neutral-400 text-neutral-800"
          />
        </div>
      </div>

      {/* Table Element & Responsive Horizontal Scroll Container */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-neutral-100 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              <th className="py-3 px-4">Waktu Sesi</th>
              <th className="py-3 px-4">Ruang</th>
              <th className="py-3 px-4">Pelanggan</th>
              <th className="py-3 px-4">Paket & Catatan</th>
              <th className="py-3 px-4">Uang Muka (DP)</th>
              <th className="py-3 px-4">Status Pembayaran</th>
              <th className="py-3 px-4">Status Booking</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100/70 text-sm">
            {isLoading ? (
              // Loading Skeleton Shimmer
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-20 bg-neutral-100 rounded mb-1" />
                    <div className="h-3 w-16 bg-neutral-100 rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-5 w-18 bg-neutral-100 rounded-full" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-24 bg-neutral-100 rounded mb-1" />
                    <div className="h-3 w-28 bg-neutral-100 rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-32 bg-neutral-100 rounded mb-1" />
                    <div className="h-3 w-40 bg-neutral-100 rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-20 bg-neutral-100 rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-5 w-20 bg-neutral-100 rounded-full" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-5 w-24 bg-neutral-100 rounded-full" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="h-7 w-16 bg-neutral-100 rounded-full ml-auto" />
                  </td>
                </tr>
              ))
            ) : filteredBookings.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
                      <CalendarX2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-neutral-800">
                      Belum ada jadwal pemotretan pada rentang tanggal ini.
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {searchQuery
                        ? 'Coba ubah kata kunci pencarian Anda.'
                        : 'Pilih rentang tanggal lain atau tambahkan pemesanan walk-in baru.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Booking Rows
              filteredBookings.map((booking) => {
                const isSettling = settlingIds[booking.idBooking];
                const isCompleting = completingIds[booking.idBooking];
                const isPaid = booking.statusPembayaran === 'lunas';
                const isCanceled = booking.statusBooking === 'batal';
                const isCompleted = booking.statusBooking === 'selesai';
                const waPhone = normalizeIndonesianPhone(booking.noWhatsapp);
                const waLink = `https://wa.me/${waPhone}`;

                return (
                  <tr
                    key={booking.idBooking}
                    className="hover:bg-neutral-50/70 transition-colors group"
                  >
                    {/* Waktu Sesi */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-neutral-900">
                        {formatTime(booking.jamBooking)} - {formatTime(booking.jamSelesai)}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {formatIndonesianDate(booking.tanggalBooking)}
                      </div>
                    </td>

                    {/* Ruang */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge variant="studio" status={booking.idLokasi} />
                    </td>

                    {/* Pelanggan & WA Link */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-neutral-900">{booking.namaCustomer}</div>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors mt-0.5"
                        title="Hubungi via WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3 fill-emerald-600/10" />
                        <span>{formatDisplayPhone(booking.noWhatsapp)}</span>
                      </a>
                    </td>

                    {/* Paket & Catatan */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-neutral-900 truncate">
                        {booking.namaPaket}
                      </div>
                      <div className="text-xs text-neutral-500 truncate" title={booking.backgroundDetail || '-'}>
                        {booking.backgroundDetail ? `Catatan: ${booking.backgroundDetail}` : '-'}
                      </div>
                    </td>

                    {/* Nominal DP */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-neutral-900">
                      {formatRupiah(booking.nominalDp)}
                    </td>

                    {/* Status Pembayaran */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge variant="payment" status={booking.statusPembayaran} />
                    </td>

                    {/* Status Booking */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge variant="booking" status={booking.statusBooking} />
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Tombol Lunas */}
                        {!isPaid && !isCanceled && (
                          <button
                            type="button"
                            title="Tandai Pembayaran Lunas"
                            onClick={() => handleSettle(booking.idBooking)}
                            disabled={isSettling}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white text-xs font-medium transition-all shadow-sm disabled:opacity-60"
                          >
                            {isSettling ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            <span>Lunas</span>
                          </button>
                        )}

                        {/* Tombol Selesai Sesi */}
                        {!isCompleted && !isCanceled && (
                          <button
                            type="button"
                            title="Tandai Sesi Foto Selesai"
                            onClick={() => handleComplete(booking.idBooking)}
                            disabled={isCompleting}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-medium transition-all shadow-sm disabled:opacity-60"
                          >
                            {isCompleting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Camera className="w-3 h-3" />
                            )}
                            <span>Selesai Sesi</span>
                          </button>
                        )}

                        {/* Tombol Reschedule */}
                        <button
                          type="button"
                          title={
                            isCanceled || isCompleted
                              ? 'Pemesanan tidak dapat diatur ulang'
                              : 'Reschedule Jadwal'
                          }
                          disabled={isCanceled || isCompleted}
                          onClick={() => onReschedule?.(booking)}
                          className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>

                        {/* Tombol Batalkan (Soft Delete) */}
                        <button
                          type="button"
                          title={
                            isCanceled || isCompleted
                              ? 'Pemesanan tidak dapat dibatalkan'
                              : 'Batalkan Booking'
                          }
                          disabled={isCanceled || isCompleted}
                          onClick={() => onCancel?.(booking)}
                          className="p-1.5 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
