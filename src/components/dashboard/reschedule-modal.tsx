'use client';

import { StatusBadge } from '@/components/ui/status-badge';
import { formatDisplayPhone, formatIndonesianDate } from '@/lib/utils';
import type { BookingListItem } from '@/types/booking';
import { rescheduleBookingSchema } from '@/validations/booking.schema';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

export interface RescheduleModalProps {
  booking: BookingListItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function RescheduleModal({ booking, onClose, onSuccess }: RescheduleModalProps) {
  if (!booking) return null;
  return (
    <RescheduleModalDialog
      key={booking.idBooking}
      booking={booking}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function RescheduleModalDialog({
  booking,
  onClose,
  onSuccess,
}: {
  booking: BookingListItem;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [newDate, setNewDate] = useState(booking.tanggalBooking);
  const [newStartTime, setNewStartTime] = useState(() => {
    return booking.jamBooking ? booking.jamBooking.slice(0, 5) : '10:00';
  });
  const [catatan, setCatatan] = useState(() => {
    return booking.backgroundDetail ? `Reschedule: ${booking.backgroundDetail}` : '';
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Ketersediaan Slot Real-time (Double-Booking Prevention)
  const [isCheckingSlot, setIsCheckingSlot] = useState(false);
  const [slotStatus, setSlotStatus] = useState<{
    checked: boolean;
    available: boolean;
    message?: string;
  }>({ checked: false, available: true });

  const handleClose = useCallback(() => {
    setFieldErrors({});
    setSubmitError(null);
    setSlotStatus({ checked: false, available: true });
    onClose();
  }, [onClose]);

  // Handle tombol Escape keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // Kalkulasi jam selesai otomatis berdasarkan jam mulai dan durasi menit paket
  const calculatedEndTime = useMemo(() => {
    if (!newStartTime) return '';
    try {
      const [h, m] = newStartTime.split(':').map(Number);
      const startMin = h * 60 + m;
      const endMin = startMin + (booking.durasiMenit || 45);
      const endH = Math.floor(endMin / 60) % 24;
      const endM = endMin % 60;
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    } catch {
      return '';
    }
  }, [newStartTime, booking.durasiMenit]);

  // Pengecekan Bentrok Slot Real-time (Debounced)
  useEffect(() => {
    if (!newDate || !newStartTime) return;

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsCheckingSlot(true);
      try {
        const params = new URLSearchParams({
          studioId: String(booking.idLokasi),
          date: newDate,
          startTime: newStartTime,
          durationMinutes: String(booking.durasiMenit || 45),
          excludeId: String(booking.idBooking),
        });

        const res = await fetch(`/api/bookings/check-slot?${params.toString()}`);
        const json = await res.json();

        if (!isCancelled) {
          if (json.success && json.data) {
            setSlotStatus({
              checked: true,
              available: json.data.available,
              message: json.message,
            });
          }
        }
      } catch (err) {
        console.error('Gagal memeriksa ketersediaan slot reschedule:', err);
      } finally {
        if (!isCancelled) {
          setIsCheckingSlot(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [booking.idLokasi, booking.durasiMenit, booking.idBooking, newDate, newStartTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    // 1. Validasi Zod
    const payload = {
      id_booking: booking.idBooking,
      tanggal_booking: newDate,
      jam_booking: newStartTime,
      catatan: catatan.trim() || undefined,
    };

    const parsed = rescheduleBookingSchema.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (key && typeof key === 'string') {
          errors[key] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    // 2. Cegah submit jika slot jadwal tujuan terdeteksi bentrok
    if (slotStatus.checked && !slotStatus.available) {
      setSubmitError('Jadwal tujuan tidak tersedia untuk studio ini. Silakan tentukan jam lain.');
      return;
    }

    // 3. Kirim ke API endpoint
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/bookings/${booking.idBooking}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal mengatur ulang jadwal reservasi.');
      }

      onSuccess('Jadwal sesi foto berhasil diperbarui.');
      handleClose();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Terjadi kendala saat memperbarui jadwal.';
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-neutral-100 relative animate-in zoom-in-95 duration-200 my-8">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                Reschedule Jadwal Sesi Foto
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Atur ulang tanggal dan jam pemotretan reservasi #{booking.idBooking}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup formulir"
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ringkasan Reservasi Saat Ini */}
        <div className="mt-4 p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-200/60 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-semibold text-neutral-900">{booking.namaCustomer}</span>
              <span className="text-neutral-400">({formatDisplayPhone(booking.noWhatsapp)})</span>
            </div>
            <StatusBadge variant="studio" status={booking.idLokasi} />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-neutral-200/50 text-neutral-600">
            <div>
              <span className="text-neutral-400">Paket: </span>
              <span className="font-medium text-neutral-800">{booking.namaPaket}</span>
              <span className="text-neutral-400"> ({booking.durasiMenit} Menit)</span>
            </div>
            <div>
              <span className="text-neutral-400">Jadwal Lama: </span>
              <span className="font-medium text-neutral-800">
                {formatIndonesianDate(booking.tanggalBooking)}, {booking.jamBooking.slice(0, 5)} - {booking.jamSelesai.slice(0, 5)}
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {submitError && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-relaxed">{submitError}</span>
          </div>
        )}

        {/* Form Reschedule */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Input Tanggal & Jam Baru */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Tanggal Sesi Baru</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className={`w-full px-3.5 py-2 text-xs bg-neutral-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  fieldErrors.tanggal_booking
                    ? 'border-rose-300 focus:ring-rose-500/20'
                    : 'border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/10'
                }`}
              />
              {fieldErrors.tanggal_booking && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {fieldErrors.tanggal_booking}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Jam Mulai Baru</span> <span className="text-rose-500">*</span>
                </span>
                {calculatedEndTime && (
                  <span className="text-[10px] font-normal text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                    Selesai: {calculatedEndTime}
                  </span>
                )}
              </label>
              <input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className={`w-full px-3.5 py-2 text-xs bg-neutral-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  fieldErrors.jam_booking
                    ? 'border-rose-300 focus:ring-rose-500/20'
                    : 'border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/10'
                }`}
              />
              {fieldErrors.jam_booking && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {fieldErrors.jam_booking}
                </p>
              )}
            </div>
          </div>

          {/* Real-time Conflict Alert Status */}
          <div className="pt-0.5">
            {isCheckingSlot ? (
              <div className="flex items-center gap-2 text-xs text-neutral-500 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                <span>Memeriksa ketersediaan slot ruangan tujuan...</span>
              </div>
            ) : slotStatus.checked && !slotStatus.available ? (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Jadwal tujuan tidak tersedia untuk studio ini. Silakan tentukan jam lain.
                </span>
              </div>
            ) : slotStatus.checked && slotStatus.available ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium py-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Slot jadwal tujuan tersedia ({newStartTime} – {calculatedEndTime})</span>
              </div>
            ) : null}
          </div>

          {/* Catatan / Alasan Penjadwalan Ulang */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Alasan / Catatan Penjadwalan Ulang</span>
              <span className="text-neutral-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Pelanggan meminta penundaan jadwal karena ada kendala lalu lintas"
              className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:bg-white focus:border-neutral-900 transition-all text-neutral-800 resize-none"
            />
            {fieldErrors.catatan && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {fieldErrors.catatan}
              </p>
            )}
          </div>

          {/* Footer Tombol Aksi */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-full text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (slotStatus.checked && !slotStatus.available)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white text-xs font-medium transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Jadwal Baru</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
