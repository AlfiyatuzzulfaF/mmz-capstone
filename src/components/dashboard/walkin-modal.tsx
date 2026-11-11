'use client';

import { formatRupiah } from '@/lib/utils';
import type { PaketLayananRow } from '@/types/database';
import { createBookingSchema } from '@/validations/booking.schema';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

export interface WalkinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const DEFAULT_PACKAGES: Array<Omit<PaketLayananRow, 'status_aktif'> & { status_aktif: number }> = [
  { id_paket: 1, nama_paket: 'Self-Photo Basic', durasi_menit: 30, harga: 80000, status_aktif: 1 },
  { id_paket: 2, nama_paket: 'Reguler Portrait', durasi_menit: 45, harga: 150000, status_aktif: 1 },
  { id_paket: 3, nama_paket: 'Graduation Deluxe', durasi_menit: 60, harga: 250000, status_aktif: 1 },
];

export function WalkinModal({ isOpen, onClose, onSuccess }: WalkinModalProps) {
  // Master paket layanan
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);

  // Form State
  const [namaCustomer, setNamaCustomer] = useState('');
  const [noWhatsapp, setNoWhatsapp] = useState('');
  const [idLokasi, setIdLokasi] = useState<1 | 2>(1);
  const [idPaket, setIdPaket] = useState<number>(1);
  const [tanggalBooking, setTanggalBooking] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [jamBooking, setJamBooking] = useState('10:00');
  const [nominalDp, setNominalDp] = useState<number>(50000);
  const [catatan, setCatatan] = useState('');

  // Status & Validasi
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

  const resetForm = useCallback(() => {
    setNamaCustomer('');
    setNoWhatsapp('');
    setCatatan('');
    setNominalDp(50000);
    setFieldErrors({});
    setSubmitError(null);
    setSlotStatus({ checked: false, available: true });
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Ambil data paket aktif dari backend saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;

    async function fetchPackages() {
      try {
        const res = await fetch('/api/packages');
        const json = await res.json();
        if (!isCancelled && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setPackages(json.data);
          setIdPaket(json.data[0].id_paket);
        }
      } catch (err) {
        console.warn('Gagal memuat katalog paket via API, menggunakan default.', err);
      }
    }

    fetchPackages();

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  // Handle tombol Escape keyboard
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Paket terpilih
  const selectedPackage = useMemo(() => {
    return packages.find((p) => p.id_paket === idPaket) || packages[0];
  }, [packages, idPaket]);

  // Jam Selesai Terkalkulasi Otomatis
  const calculatedEndTime = useMemo(() => {
    if (!jamBooking || !selectedPackage) return '';
    try {
      const [h, m] = jamBooking.split(':').map(Number);
      const startMin = h * 60 + m;
      const endMin = startMin + selectedPackage.durasi_menit;
      const endH = Math.floor(endMin / 60) % 24;
      const endM = endMin % 60;
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    } catch {
      return '';
    }
  }, [jamBooking, selectedPackage]);

  // Pengecekan Bentrok Slot Real-time (Debounced)
  useEffect(() => {
    if (!isOpen || !tanggalBooking || !jamBooking || !selectedPackage) return;

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsCheckingSlot(true);
      try {
        const params = new URLSearchParams({
          studioId: String(idLokasi),
          date: tanggalBooking,
          startTime: jamBooking,
          durationMinutes: String(selectedPackage.durasi_menit),
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
        console.error('Gagal memeriksa ketersediaan slot:', err);
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
  }, [isOpen, idLokasi, tanggalBooking, jamBooking, selectedPackage]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    // 1. Validasi Zod Client-side
    const payload = {
      nama_customer: namaCustomer,
      no_whatsapp: noWhatsapp,
      id_paket: idPaket,
      id_lokasi: idLokasi,
      tanggal_booking: tanggalBooking,
      jam_booking: jamBooking,
      nominal_dp: nominalDp,
      catatan: catatan.trim() || undefined,
    };

    const parsed = createBookingSchema.safeParse(payload);
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

    // 2. Cegah submit jika slot jadwal terdeteksi bentrok
    if (slotStatus.checked && !slotStatus.available) {
      setSubmitError(
        'Slot jadwal pada tanggal dan jam tersebut sudah terisi untuk Studio yang dipilih. Silakan pilih ruangan lain atau sesuaikan jam sesi foto.'
      );
      return;
    }

    // 3. Eksekusi pengiriman ke endpoint backend
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal menyimpan reservasi walk-in.');
      }

      // Reset form & sukses
      resetForm();
      onSuccess('Pemesanan walk-in berhasil disimpan dan event kalender telah diperbarui.');
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Terjadi kendala saat menyimpan data.';
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
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                Input Booking Walk-in Baru
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Pendaftaran langsung reservasi foto pelanggan di studio
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

        {/* Global Error Banner */}
        {submitError && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-relaxed">{submitError}</span>
          </div>
        )}

        {/* Form Isi Data */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 1. Nama Pelanggan & Nomor WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Nama Pelanggan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={namaCustomer}
                onChange={(e) => setNamaCustomer(e.target.value)}
                placeholder="Contoh: Rian Pratama"
                className={`w-full px-3.5 py-2 text-xs bg-neutral-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  fieldErrors.nama_customer
                    ? 'border-rose-300 focus:ring-rose-500/20'
                    : 'border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/10'
                }`}
              />
              {fieldErrors.nama_customer && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {fieldErrors.nama_customer}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Nomor WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={noWhatsapp}
                onChange={(e) => setNoWhatsapp(e.target.value)}
                placeholder="081234567890"
                className={`w-full px-3.5 py-2 text-xs bg-neutral-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  fieldErrors.no_whatsapp
                    ? 'border-rose-300 focus:ring-rose-500/20'
                    : 'border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/10'
                }`}
              />
              {fieldErrors.no_whatsapp && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {fieldErrors.no_whatsapp}
                </p>
              )}
            </div>
          </div>

          {/* 2. Pilihan Ruangan Studio (Pill Selector) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Ruangan Studio <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIdLokasi(1)}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-2xl text-xs font-semibold border transition-all ${
                  idLokasi === 1
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Studio 1 (Reguler)</span>
              </button>

              <button
                type="button"
                onClick={() => setIdLokasi(2)}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-2xl text-xs font-semibold border transition-all ${
                  idLokasi === 2
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-sm'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Studio 2 (Self-Photo)</span>
              </button>
            </div>
          </div>

          {/* 3. Pilihan Paket Layanan */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Paket Layanan Foto <span className="text-rose-500">*</span>
            </label>
            <select
              value={idPaket}
              onChange={(e) => setIdPaket(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:bg-white focus:border-neutral-900 transition-all font-medium text-neutral-800"
            >
              {packages.map((pkg) => (
                <option key={pkg.id_paket} value={pkg.id_paket}>
                  {pkg.nama_paket} — {pkg.durasi_menit} Menit ({formatRupiah(Number(pkg.harga))})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Tanggal & Jam Sesi dengan Kalkulasi Jam Selesai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Tanggal Sesi</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={tanggalBooking}
                onChange={(e) => setTanggalBooking(e.target.value)}
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
                  <span>Jam Mulai</span> <span className="text-rose-500">*</span>
                </span>
                {calculatedEndTime && (
                  <span className="text-[10px] font-normal text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                    Selesai: {calculatedEndTime}
                  </span>
                )}
              </label>
              <input
                type="time"
                value={jamBooking}
                onChange={(e) => setJamBooking(e.target.value)}
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

          {/* Real-time Conflict Alert Status (Double-Booking Prevention KF-09) */}
          <div className="pt-0.5">
            {isCheckingSlot ? (
              <div className="flex items-center gap-2 text-xs text-neutral-500 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                <span>Memeriksa ketersediaan slot ruangan...</span>
              </div>
            ) : slotStatus.checked && !slotStatus.available ? (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Slot jadwal pada tanggal dan jam tersebut sudah terisi untuk Studio yang dipilih.
                  Silakan pilih ruangan lain atau sesuaikan jam sesi foto.
                </span>
              </div>
            ) : slotStatus.checked && slotStatus.available ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium py-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Slot jadwal tersedia ({jamBooking} – {calculatedEndTime})</span>
              </div>
            ) : null}
          </div>

          {/* 5. Nominal Uang Muka (DP) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Nominal Uang Muka (DP) <span className="text-neutral-400 font-normal">(Default Rp 50.000)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-medium pointer-events-none">
                Rp
              </span>
              <input
                type="number"
                min={0}
                step={5000}
                value={nominalDp}
                onChange={(e) => setNominalDp(Number(e.target.value))}
                placeholder="50000"
                className="w-full pl-10 pr-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:bg-white focus:border-neutral-900 transition-all font-medium text-neutral-800"
              />
            </div>
            {fieldErrors.nominal_dp && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {fieldErrors.nominal_dp}
              </p>
            )}
          </div>

          {/* 6. Catatan / Permintaan Khusus Background */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Catatan / Variasi Background</span>
              <span className="text-neutral-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Background Putih Polos + Properti Toga Wisuda"
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
                <span>Simpan Pemesanan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
