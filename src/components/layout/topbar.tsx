'use client';

import { NavTabId, useNavigation } from '@/context/navigation-context';
import { Bell, Search } from 'lucide-react';
import React from 'react';

export interface NavTabItem {
  id: NavTabId;
  label: string;
  href?: string;
}

const NAV_TABS: NavTabItem[] = [
  { id: 'overview', label: 'Ringkasan Operasional' },
  { id: 'jadwal', label: 'Jadwal Sesi' },
  { id: 'pelanggan', label: 'Pelanggan' },
  { id: 'paket', label: 'Paket Layanan' },
  { id: 'keuangan', label: 'Laporan Finansial' },
];

/**
 * Komponen Navigasi Atas (Topbar) dengan gaya kapsul Zentra Clean SaaS.
 * Mengadopsi prinsip Anti-UI-Slop, elevated light backdrop blur, dan active dark pill tabs.
 */
export function Topbar() {
  const { activeTab, setActiveTab } = useNavigation();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-neutral-200/60 bg-white/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Branding MMZ Studio Foto */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 font-bold text-lg text-white shadow-sm shadow-orange-500/30 transition-transform hover:scale-105">
            M
          </div>
          <div className="flex items-baseline">
            <span className="font-bold text-xl tracking-tight text-neutral-900">
              mmz
            </span>
            <span className="font-light text-xl tracking-tight text-neutral-400">
              studio
            </span>
          </div>
        </div>

        {/* Bar Navigasi Kapsul Desktop (Zentra Active Pill Tabs) */}
        <nav
          className="hidden md:flex items-center gap-1 rounded-full border border-neutral-200/60 bg-neutral-100/80 p-1 shadow-inner"
          aria-label="Navigasi Utama"
        >
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Utilitas Kanan: Pencarian, Notifikasi, dan Avatar Staf */}
        <div className="flex items-center gap-2">
          {/* Tombol Pencarian Cepat */}
          <button
            type="button"
            aria-label="Cari reservasi atau pelanggan"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Tombol Notifikasi dengan Indikator Oranye */}
          <button
            type="button"
            aria-label="Notifikasi aktivitas"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
          </button>

          {/* Avatar Kasir / Frontdesk */}
          <div
            title="Frontdesk Staff (Kasir)"
            className="ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white bg-neutral-800 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105"
          >
            AD
          </div>
        </div>
      </div>

      {/* Bar Navigasi Seluler (Horizontal Scrollable Pill Bar) */}
      <div className="flex md:hidden border-t border-neutral-100 px-4 py-2 overflow-x-auto no-scrollbar gap-1.5">
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
