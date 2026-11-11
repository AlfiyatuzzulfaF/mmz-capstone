import { pool } from '@/lib/db';
import type { PaketLayananRow } from '@/types/database';
import type { RowDataPacket } from 'mysql2/promise';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Fallback master paket jika database belum dapat dijangkau
const FALLBACK_PACKAGES: Array<Omit<PaketLayananRow, 'status_aktif'> & { status_aktif: number }> = [
  {
    id_paket: 1,
    nama_paket: 'Self-Photo Basic',
    durasi_menit: 30,
    harga: 80000,
    status_aktif: 1,
  },
  {
    id_paket: 2,
    nama_paket: 'Reguler Portrait',
    durasi_menit: 45,
    harga: 150000,
    status_aktif: 1,
  },
  {
    id_paket: 3,
    nama_paket: 'Graduation Deluxe',
    durasi_menit: 60,
    harga: 250000,
    status_aktif: 1,
  },
];

/**
 * GET /api/packages
 * Mengambil daftar paket layanan foto aktif untuk pilihan formulir booking.
 */
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_paket, nama_paket, durasi_menit, CAST(harga AS DECIMAL(10,2)) as harga, status_aktif FROM test.paket_layanan WHERE status_aktif = 1 ORDER BY id_paket ASC;'
    );

    if (rows && rows.length > 0) {
      const packages = rows.map((r) => ({
        id_paket: Number(r.id_paket),
        nama_paket: String(r.nama_paket),
        durasi_menit: Number(r.durasi_menit),
        harga: Number(r.harga),
        status_aktif: Number(r.status_aktif),
      }));

      return NextResponse.json({
        success: true,
        data: packages,
      });
    }

    return NextResponse.json({
      success: true,
      data: FALLBACK_PACKAGES,
    });
  } catch (error) {
    console.error('[API Packages Error]:', error);
    // Mengembalikan fallback data paket jika terjadi kegagalan jaringan
    return NextResponse.json({
      success: true,
      data: FALLBACK_PACKAGES,
      warning: 'Menggunakan data katalog paket lokal',
    });
  }
}
