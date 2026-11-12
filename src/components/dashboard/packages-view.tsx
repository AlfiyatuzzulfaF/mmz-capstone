'use client';

import { formatRupiah } from '@/lib/utils';
import type { PaketLayananRow } from '@/types/database';
import { Clock, Plus } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface PackagesViewProps {
  onOpenWalkinModal: () => void;
}

export function PackagesView({ onOpenWalkinModal }: PackagesViewProps) {
  const [packages, setPackages] = useState<
    Array<Omit<PaketLayananRow, 'status_aktif'> & { status_aktif: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPackages() {
      try {
        const res = await fetch('/api/packages');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPackages(json.data);
        }
      } catch (err) {
        console.error('Gagal memuat katalog paket:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPackages();
  }, []);

  const getPackageBadgeColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('wedding')) return 'bg-rose-50 text-rose-700 border-rose-200/80';
    if (lower.includes('prewedding')) return 'bg-pink-50 text-pink-700 border-pink-200/80';
    if (lower.includes('engagement') || lower.includes('lamaran'))
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    if (lower.includes('graduation') || lower.includes('wisuda'))
      return 'bg-purple-50 text-purple-700 border-purple-200/80';
    if (lower.includes('portrait')) return 'bg-blue-50 text-blue-700 border-blue-200/80';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  };

  return (
    <div className="space-y-6">
      {/* Header Bar Katalog Paket Layanan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Katalog Paket Layanan MMZ Studio
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Pilihan paket foto studio, wisuda, prewedding, wedding, dan dokumentasi lamaran resmi
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenWalkinModal}
          className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-sm transition-all whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Booking Walk-in Baru</span>
        </button>
      </div>

      {/* Grid Kartu Paket */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 border border-neutral-100/90 animate-pulse space-y-4"
            >
              <div className="h-6 w-32 bg-neutral-100 rounded-full" />
              <div className="h-4 w-48 bg-neutral-100 rounded" />
              <div className="h-8 w-28 bg-neutral-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((pkg) => {
            const badgeClass = getPackageBadgeColor(pkg.nama_paket);

            return (
              <div
                key={pkg.id_paket}
                className="bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md hover:border-neutral-200 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${badgeClass}`}
                    >
                      ID #{pkg.id_paket}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{pkg.durasi_menit} Menit</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 tracking-tight group-hover:text-blue-600 transition-colors">
                    {pkg.nama_paket}
                  </h3>

                  <p className="text-xs text-neutral-500 mt-1 mb-4">
                    {pkg.nama_paket.toLowerCase().includes('wedding')
                      ? 'Liputan dokumentasi pernikahan lengkap dengan fotografer profesional & master foto.'
                      : pkg.nama_paket.toLowerCase().includes('prewedding')
                      ? 'Sesi foto prewedding eksklusif indoor studio dengan konsep tematik & lighting artistik.'
                      : pkg.nama_paket.toLowerCase().includes('engagement')
                      ? 'Dokumentasi momen lamaran & pertunangan istimewa dengan edit warna profesional.'
                      : pkg.nama_paket.toLowerCase().includes('graduation')
                      ? 'Foto wisuda keluarga & solo dengan backdrop toga elegan dan cetak premium.'
                      : pkg.nama_paket.toLowerCase().includes('portrait')
                      ? 'Sesi foto portrait profesional untuk portofolio, CV, atau profil formal.'
                      : 'Sesi self-photo studio santai berdua atau grup kecil dengan remote shutter mandiri.'}
                  </p>

                  <div className="pt-3 border-t border-neutral-100/80">
                    <span className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider block">
                      Tarif Resmi
                    </span>
                    <span className="text-2xl font-bold tracking-tight text-neutral-900 font-mono">
                      {formatRupiah(Number(pkg.harga))}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100/80">
                  <button
                    type="button"
                    onClick={onOpenWalkinModal}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pesan via Walk-in</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
