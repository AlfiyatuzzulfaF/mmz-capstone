'use client';

import { StatusBadge } from '@/components/ui/status-badge';
import { formatDisplayPhone, formatIndonesianDate, formatRupiah } from '@/lib/utils';
import type { BookingListItem } from '@/types/booking';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

export interface CancelDialogProps {
  booking: BookingListItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function CancelDialog({ booking, onClose, onSuccess }: CancelDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  // Handle tombol Escape keyboard
  useEffect(() => {
    if (!booking) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [booking, handleClose]);

  if (!booking) return null;

  const handleConfirmCancel = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/bookings/${booking.idBooking}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal membatalkan jadwal pemesanan.');
      }

      onSuccess('Pemesanan berhasil dibatalkan dan slot kalender telah dibebaskan.');
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat membatalkan jadwal.';
      setErrorMessage(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-neutral-100 relative animate-in zoom-in-95 duration-200 my-8">
        {/* Tombol Silang */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup dialog"
          className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors absolute top-5 right-5"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">
              Batalkan Jadwal Pemotretan
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Konfirmasi pembatalan sesi reservasi #{booking.idBooking}
            </p>
          </div>
        </div>

        {/* Ringkasan Data Sesi yang Akan Dibatalkan */}
        <div className="mt-4 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-900">{booking.namaCustomer}</span>
            <StatusBadge variant="studio" status={booking.idLokasi} />
          </div>

          <div className="text-neutral-600 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-neutral-400">WhatsApp:</span>
              <span className="font-medium text-neutral-800">
                {formatDisplayPhone(booking.noWhatsapp)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Jadwal Sesi:</span>
              <span className="font-medium text-neutral-800">
                {formatIndonesianDate(booking.tanggalBooking)}, {booking.jamBooking.slice(0, 5)} - {booking.jamSelesai.slice(0, 5)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Paket Foto:</span>
              <span className="font-medium text-neutral-800">{booking.namaPaket}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-neutral-200/50">
              <span className="text-neutral-400">Uang Muka (DP):</span>
              <span className="font-semibold text-neutral-900">
                {formatRupiah(booking.nominalDp)}
              </span>
            </div>
          </div>
        </div>

        {/* Pesan Edukasi PRD Section 4.5 (Auditability Disclosure) */}
        <div className="mt-4 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-[11px] leading-relaxed text-amber-900">
          <p className="font-medium">
            Apakah Anda yakin ingin membatalkan jadwal pemotretan ini? Status pesanan akan diubah menjadi &apos;Dibatalkan&apos; dan slot kalender akan dibebaskan, namun catatan uang muka (DP) tetap tersimpan untuk pembukuan kas studio.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Tombol Tindakan */}
        <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-full text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Membatalkan...</span>
              </>
            ) : (
              <span>Ya, Batalkan Jadwal</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
