import { pool } from '@/lib/db';
import type {
  AnalyticsData,
  KpiSummary,
  StudioRatioStat,
  TopPackageStat,
} from '@/types/booking';
import type { RowDataPacket } from 'mysql2/promise';

/**
 * Mengambil ringkasan 4 kartu metrik utama (KPI Scorecards) dari basis data (PRD Bab 4.2 & 5.2).
 * Kueri mengecualikan transaksi yang dibatalkan (`status_booking != 'batal'`).
 *
 * @param startDate Filter tanggal mulai pemotretan opsional (YYYY-MM-DD)
 * @param endDate Filter tanggal akhir pemotretan opsional (YYYY-MM-DD)
 * @returns Promise<KpiSummary> Total booking, total akumulasi DP, terkonfirmasi, dan menunggu pelunasan
 */
export async function getKpiSummary(
  startDate?: string,
  endDate?: string
): Promise<KpiSummary> {
  const conditions: string[] = ["status_booking != 'batal'"];
  const params: string[] = [];

  if (startDate) {
    conditions.push('tanggal_booking >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('tanggal_booking <= ?');
    params.push(endDate);
  }

  const sql = `
    SELECT 
      COUNT(id_booking) AS total_booking,
      COALESCE(SUM(nominal_dp), 0) AS total_dp_masuk,
      COUNT(CASE WHEN status_booking = 'terkonfirmasi' THEN 1 END) AS booking_terkonfirmasi,
      COUNT(CASE WHEN status_pembayaran = 'dp_diterima' THEN 1 END) AS menunggu_pelunasan
    FROM test.bookings
    WHERE ${conditions.join(' AND ')};
  `;

  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  const result = rows[0] || {};

  return {
    totalBooking: Number(result.total_booking || 0),
    totalDpMasuk: Number(result.total_dp_masuk || 0),
    bookingTerkonfirmasi: Number(result.booking_terkonfirmasi || 0),
    menungguPelunasan: Number(result.menunggu_pelunasan || 0),
  };
}

/**
 * Mengambil data peringkat paket foto terlaris untuk grafik batang (PRD Bab 5.3).
 *
 * @param startDate Filter tanggal mulai opsional
 * @param endDate Filter tanggal akhir opsional
 * @returns Promise<TopPackageStat[]> Nama paket dan total jumlah sesi terjual
 */
export async function getTopSellingPackages(
  startDate?: string,
  endDate?: string
): Promise<TopPackageStat[]> {
  const conditions: string[] = ["b.status_booking != 'batal'"];
  const params: string[] = [];

  if (startDate) {
    conditions.push('b.tanggal_booking >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('b.tanggal_booking <= ?');
    params.push(endDate);
  }

  const sql = `
    SELECT 
      p.nama_paket,
      COUNT(b.id_booking) AS total_terjual
    FROM test.bookings b
    JOIN test.paket_layanan p ON b.id_paket = p.id_paket
    WHERE ${conditions.join(' AND ')}
    GROUP BY p.nama_paket
    ORDER BY total_terjual DESC;
  `;

  const [rows] = await pool.query<RowDataPacket[]>(sql, params);

  return rows.map((row) => ({
    namaPaket: String(row.nama_paket),
    totalTerjual: Number(row.total_terjual || 0),
  }));
}

/**
 * Mengambil data rasio pemakaian ruangan Studio 1 vs Studio 2 untuk diagram donat (PRD Bab 5.3).
 *
 * @param startDate Filter tanggal mulai opsional
 * @param endDate Filter tanggal akhir opsional
 * @returns Promise<StudioRatioStat[]> Nama studio, total sesi, dan persentase penggunaan
 */
export async function getStudioUtilizationRatio(
  startDate?: string,
  endDate?: string
): Promise<StudioRatioStat[]> {
  const conditions: string[] = ["b.status_booking != 'batal'"];
  const params: string[] = [];

  if (startDate) {
    conditions.push('b.tanggal_booking >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('b.tanggal_booking <= ?');
    params.push(endDate);
  }

  const sql = `
    SELECT 
      l.id_lokasi,
      l.nama_lokasi AS studio,
      COUNT(b.id_booking) AS total_sesi
    FROM test.bookings b
    JOIN test.lokasi l ON b.id_lokasi = l.id_lokasi
    WHERE ${conditions.join(' AND ')}
    GROUP BY l.id_lokasi, l.nama_lokasi
    ORDER BY l.id_lokasi ASC;
  `;

  const [rows] = await pool.query<RowDataPacket[]>(sql, params);

  const totalAllSessions = rows.reduce(
    (sum, row) => sum + Number(row.total_sesi || 0),
    0
  );

  return rows.map((row) => {
    const totalSesi = Number(row.total_sesi || 0);
    const persentase =
      totalAllSessions > 0
        ? Number(((totalSesi / totalAllSessions) * 100).toFixed(1))
        : 0;

    return {
      studio: String(row.studio),
      totalSesi,
      persentase,
    };
  });
}

/**
 * Mengambil agregasi lengkap analitik bisnis (KPI + Grafik Batang + Diagram Donat) secara efisien dan paralel.
 *
 * @param startDate Filter tanggal mulai opsional
 * @param endDate Filter tanggal akhir opsional
 * @returns Promise<AnalyticsData> Seluruh data analitik siap saji untuk dashboard
 */
export async function getAnalyticsOverview(
  startDate?: string,
  endDate?: string
): Promise<AnalyticsData> {
  const [kpi, topPackages, studioRatio] = await Promise.all([
    getKpiSummary(startDate, endDate),
    getTopSellingPackages(startDate, endDate),
    getStudioUtilizationRatio(startDate, endDate),
  ]);

  return {
    kpi,
    topPackages,
    studioRatio,
  };
}
