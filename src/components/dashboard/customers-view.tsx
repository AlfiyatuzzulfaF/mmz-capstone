'use client';

import { formatDisplayPhone, formatIndonesianDate, formatRupiah } from '@/lib/utils';
import type { BookingListItem } from '@/types/booking';
import { normalizeIndonesianPhone } from '@/validations/booking.schema';
import { MessageCircle, Plus, Search, Users } from 'lucide-react';
import React, { useMemo, useState } from 'react';

export interface CustomersViewProps {
  bookings: BookingListItem[];
  onOpenWalkinModal: () => void;
}

interface CustomerSummary {
  namaCustomer: string;
  noWhatsapp: string;
  totalReservasi: number;
  totalDp: number;
  terakhirBooking: string;
}

export function CustomersView({ bookings, onOpenWalkinModal }: CustomersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Ekstraksi data agregasi pelanggan unik dari daftar riwayat pemesanan
  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerSummary>();

    for (const b of bookings) {
      const key = normalizeIndonesianPhone(b.noWhatsapp);
      const existing = customerMap.get(key);

      if (existing) {
        existing.totalReservasi += 1;
        existing.totalDp += b.nominalDp;
        if (b.tanggalBooking > existing.terakhirBooking) {
          existing.terakhirBooking = b.tanggalBooking;
        }
      } else {
        customerMap.set(key, {
          namaCustomer: b.namaCustomer,
          noWhatsapp: b.noWhatsapp,
          totalReservasi: 1,
          totalDp: b.nominalDp,
          terakhirBooking: b.tanggalBooking,
        });
      }
    }

    return Array.from(customerMap.values()).sort(
      (a, b) => b.totalReservasi - a.totalReservasi
    );
  }, [bookings]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.namaCustomer.toLowerCase().includes(q) ||
        c.noWhatsapp.includes(q)
    );
  }, [customers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Bar Direktori Pelanggan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Direktori Pelanggan MMZ Studio
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Data kontak pelanggan, akumulasi reservasi, dan akses cepat chat WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Input Pencarian */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama / WhatsApp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-full text-xs border border-neutral-200/80 bg-neutral-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 w-48 sm:w-64 transition-all"
            />
          </div>

          {/* Tombol Walk-in Baru */}
          <button
            type="button"
            onClick={onOpenWalkinModal}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-sm transition-all whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Booking Walk-in</span>
          </button>
        </div>
      </div>

      {/* Grid Kartu Pelanggan */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-neutral-800">
            Tidak ada pelanggan ditemukan
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {searchQuery
              ? 'Coba gunakan kata kunci pencarian nomor WhatsApp atau nama lain.'
              : 'Belum ada transaksi pemesanan yang tercatat.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const waPhone = normalizeIndonesianPhone(cust.noWhatsapp);
            const waLink = `https://wa.me/${waPhone}`;

            return (
              <div
                key={waPhone}
                className="bg-white rounded-3xl p-5 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:border-neutral-200 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-100/80 text-orange-600 font-bold flex items-center justify-center text-sm shadow-sm">
                        {cust.namaCustomer.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-neutral-900 group-hover:text-orange-600 transition-colors">
                          {cust.namaCustomer}
                        </h3>
                        <p className="text-xs text-neutral-500 font-mono">
                          {formatDisplayPhone(cust.noWhatsapp)}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 text-[11px] font-semibold font-mono">
                      {cust.totalReservasi} sesi
                    </span>
                  </div>

                  <div className="space-y-1.5 py-2 border-t border-neutral-100/80 text-xs">
                    <div className="flex justify-between text-neutral-500">
                      <span>Total DP Disetor:</span>
                      <span className="font-semibold text-neutral-800 font-mono">
                        {formatRupiah(cust.totalDp)}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-500">
                      <span>Terakhir Booking:</span>
                      <span className="text-neutral-700">
                        {formatIndonesianDate(cust.terakhirBooking)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100/80 flex items-center gap-2">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 text-xs font-semibold border border-emerald-200/60 transition-all active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={onOpenWalkinModal}
                    title="Buat Sesi Booking Baru"
                    className="p-2 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
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
