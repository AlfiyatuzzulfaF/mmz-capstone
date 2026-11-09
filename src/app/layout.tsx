import { Topbar } from '@/components/layout/topbar';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MMZ Studio Foto — Pemantauan Operasional & Manajemen Booking',
  description:
    'Sistem Informasi Pemantauan Operasional & Manajemen Transaksi Studio 1 dan Studio 2 MMZ Photo Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#F4F5F7] text-neutral-900 selection:bg-orange-500 selection:text-white">
        {/* Header Navigasi Kapsul Zentra */}
        <Topbar />

        {/* Kontainer Utama Aplikasi */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
