import { pool } from '@/lib/db';
import type { BookingFilterParams, PaymentStatus } from '@/types/booking';
import type { BookingDetailRow } from '@/types/database';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

/**
 * Interface parameter input untuk pembuatan reservasi walk-in secara transaksional.
 */
export interface InsertWalkinBookingParams {
  nama_customer: string;
  no_whatsapp: string;
  id_paket: number;
  id_lokasi: number;
  id_admin?: number | null;
  tanggal_booking: string;
  jam_booking: string;
  jam_selesai: string;
  nominal_dp: number;
  status_pembayaran: PaymentStatus;
  status_booking: 'menunggu_dp' | 'terkonfirmasi';
  id_event_calendar?: string | null;
  catatan?: string | null;
}

/**
 * Mengambil daftar reservasi operasional dengan filter kriteria dinamis (PRD Bab 4.3 & 5.1).
 * Menggunakan Prepared Statements untuk mencegah SQL Injection (KNF-03) dan indeks komposit (KNF-04).
 *
 * @param filter Parameter penyaringan tanggal, studio, status, dan pencarian nama/telepon
 * @returns Promise<BookingDetailRow[]> Daftar data baris operasional lengkap
 */
export async function getBookings(
  filter: BookingFilterParams = {}
): Promise<BookingDetailRow[]> {
  const queryConditions: string[] = [];
  const queryParams: (string | number)[] = [];

  // Filter rentang tanggal sesi
  if (filter.startDate) {
    queryConditions.push('b.tanggal_booking >= ?');
    queryParams.push(filter.startDate);
  }
  if (filter.endDate) {
    queryConditions.push('b.tanggal_booking <= ?');
    queryParams.push(filter.endDate);
  }

  // Filter studio spesifik
  if (filter.studioId && filter.studioId !== 'all') {
    queryConditions.push('b.id_lokasi = ?');
    queryParams.push(Number(filter.studioId));
  }

  // Filter status pembayaran kasir
  if (filter.paymentStatus && filter.paymentStatus !== 'all') {
    queryConditions.push('b.status_pembayaran = ?');
    queryParams.push(filter.paymentStatus);
  }

  // Filter status pemesanan
  if (filter.bookingStatus && filter.bookingStatus !== 'all') {
    queryConditions.push('b.status_booking = ?');
    queryParams.push(filter.bookingStatus);
  }

  // Filter pencarian nama pelanggan atau nomor WhatsApp
  if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
    queryConditions.push('(c.nama_customer LIKE ? OR c.no_whatsapp LIKE ?)');
    const term = `%${filter.searchQuery.trim()}%`;
    queryParams.push(term, term);
  }

  const whereClause =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      b.id_booking,
      b.id_customer,
      c.nama_customer,
      c.no_whatsapp,
      b.id_paket,
      p.nama_paket,
      p.harga AS harga_paket,
      p.durasi_menit,
      b.id_lokasi,
      l.nama_lokasi AS studio,
      b.tanggal_booking,
      b.jam_booking,
      b.jam_selesai,
      b.nominal_dp,
      b.status_pembayaran,
      b.status_booking,
      b.id_event_calendar,
      b.catatan AS background_detail,
      b.created_at
    FROM test.bookings b
    JOIN test.customers c ON b.id_customer = c.id_customer
    JOIN test.paket_layanan p ON b.id_paket = p.id_paket
    JOIN test.lokasi l ON b.id_lokasi = l.id_lokasi
    ${whereClause}
    ORDER BY b.tanggal_booking ASC, b.jam_booking ASC;
  `;

  const [rows] = await pool.query<RowDataPacket[]>(sql, queryParams);
  return rows as BookingDetailRow[];
}

/**
 * Mengambil satu data reservasi berdasarkan ID booking.
 *
 * @param id ID booking
 * @returns Promise<BookingDetailRow | null>
 */
export async function getBookingById(
  id: number
): Promise<BookingDetailRow | null> {
  const sql = `
    SELECT 
      b.id_booking,
      b.id_customer,
      c.nama_customer,
      c.no_whatsapp,
      b.id_paket,
      p.nama_paket,
      p.harga AS harga_paket,
      p.durasi_menit,
      b.id_lokasi,
      l.nama_lokasi AS studio,
      b.tanggal_booking,
      b.jam_booking,
      b.jam_selesai,
      b.nominal_dp,
      b.status_pembayaran,
      b.status_booking,
      b.id_event_calendar,
      b.catatan AS background_detail,
      b.created_at
    FROM test.bookings b
    JOIN test.customers c ON b.id_customer = c.id_customer
    JOIN test.paket_layanan p ON b.id_paket = p.id_paket
    JOIN test.lokasi l ON b.id_lokasi = l.id_lokasi
    WHERE b.id_booking = ?
    LIMIT 1;
  `;

  const [rows] = await pool.query<RowDataPacket[]>(sql, [id]);
  if (!rows || rows.length === 0) {
    return null;
  }
  return rows[0] as BookingDetailRow;
}

/**
 * Memeriksa apakah terjadi bentrok jadwal (slot collision / overlap) pada studio dan tanggal yang sama.
 * Logika overlap: jadwal eksisting yang aktif (status_booking != 'batal') bertabrakan jika:
 *   jam_booking < endTime AND jam_selesai > startTime
 *
 * @param idLokasi ID Studio (1 = Studio 1, 2 = Studio 2)
 * @param date Tanggal pemotretan (YYYY-MM-DD)
 * @param startTime Jam mulai (HH:mm)
 * @param endTime Jam selesai (HH:mm)
 * @param excludeId ID booking yang dikecualikan (digunakan saat reschedule booking yang sama)
 * @returns Promise<boolean> True jika terjadi bentrok jadwal, False jika slot tersedia
 */
export async function checkSlotConflict(
  idLokasi: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: number
): Promise<boolean> {
  let sql = `
    SELECT id_booking
    FROM test.bookings
    WHERE id_lokasi = ?
      AND tanggal_booking = ?
      AND status_booking != 'batal'
      AND jam_booking < ?
      AND jam_selesai > ?
  `;

  const queryParams: (number | string)[] = [idLokasi, date, endTime, startTime];

  if (excludeId !== undefined && excludeId !== null) {
    sql += ' AND id_booking != ?';
    queryParams.push(excludeId);
  }

  sql += ' LIMIT 1;';

  const [rows] = await pool.query<RowDataPacket[]>(sql, queryParams);
  return rows.length > 0;
}

/**
 * Menyimpan data pemesanan walk-in secara transaksional:
 * 1. Menemukan atau membuat rekam pelanggan baru berdasarkan no_whatsapp.
 * 2. Memasukkan transaksi reservasi baru ke tabel bookings.
 *
 * @param client Instans Pool atau PoolConnection transaksi
 * @param bookingData Rincian transaksi booking walk-in
 * @returns Promise<number> ID booking yang baru dibuat
 */
export async function insertWalkinBooking(
  client: Pool | PoolConnection,
  bookingData: InsertWalkinBookingParams
): Promise<number> {
  // 1. Cek apakah customer dengan nomor WhatsApp ini sudah ada
  const checkCustomerSql =
    'SELECT id_customer, nama_customer FROM test.customers WHERE no_whatsapp = ? LIMIT 1;';
  const [existingCustomers] = await client.query<RowDataPacket[]>(
    checkCustomerSql,
    [bookingData.no_whatsapp]
  );

  let customerId: number;

  if (existingCustomers.length > 0) {
    customerId = Number(existingCustomers[0].id_customer);
    // Perbarui nama pelanggan jika ada perbedaan
    if (existingCustomers[0].nama_customer !== bookingData.nama_customer) {
      await client.execute(
        'UPDATE test.customers SET nama_customer = ? WHERE id_customer = ?;',
        [bookingData.nama_customer, customerId]
      );
    }
  } else {
    // Buat pelanggan baru
    const insertCustomerSql =
      'INSERT INTO test.customers (nama_customer, no_whatsapp) VALUES (?, ?);';
    const [customerResult] = await client.execute<ResultSetHeader>(
      insertCustomerSql,
      [bookingData.nama_customer, bookingData.no_whatsapp]
    );
    customerId = customerResult.insertId;
  }

  // 2. Simpan transaksi ke tabel bookings
  const insertBookingSql = `
    INSERT INTO test.bookings (
      id_customer,
      id_paket,
      id_lokasi,
      id_admin,
      tanggal_booking,
      jam_booking,
      jam_selesai,
      nominal_dp,
      status_pembayaran,
      status_booking,
      id_event_calendar,
      catatan
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const [bookingResult] = await client.execute<ResultSetHeader>(
    insertBookingSql,
    [
      customerId,
      bookingData.id_paket,
      bookingData.id_lokasi,
      bookingData.id_admin ?? null,
      bookingData.tanggal_booking,
      bookingData.jam_booking,
      bookingData.jam_selesai,
      bookingData.nominal_dp,
      bookingData.status_pembayaran,
      bookingData.status_booking,
      bookingData.id_event_calendar ?? null,
      bookingData.catatan ?? null,
    ]
  );

  return bookingResult.insertId;
}

/**
 * Memperbarui status pembayaran kasir untuk reservasi terkait (PRD Bab 4.4).
 *
 * @param id ID booking
 * @param status Status pembayaran baru ('belum_dibayar' | 'dp_diterima' | 'lunas')
 * @returns Promise<boolean> True jika baris berhasil diupdate
 */
export async function updatePaymentStatus(
  id: number,
  status: PaymentStatus
): Promise<boolean> {
  const sql = `
    UPDATE test.bookings 
    SET status_pembayaran = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id_booking = ?;
  `;

  const [result] = await pool.execute<ResultSetHeader>(sql, [status, id]);
  return result.affectedRows > 0;
}

/**
 * Memperbarui jadwal sesi pemesanan (Reschedule) dan mencatat status 'reschedule' (PRD Bab 4.4).
 *
 * @param id ID booking
 * @param newDate Tanggal pemotretan baru (YYYY-MM-DD)
 * @param newStart Jam mulai baru (HH:mm)
 * @param newEnd Jam selesai baru (HH:mm)
 * @param catatan Catatan tambahan opsional
 * @returns Promise<boolean> True jika jadwal berhasil diperbarui
 */
export async function rescheduleBooking(
  id: number,
  newDate: string,
  newStart: string,
  newEnd: string,
  catatan?: string | null
): Promise<boolean> {
  const sql = `
    UPDATE test.bookings 
    SET tanggal_booking = ?,
        jam_booking = ?,
        jam_selesai = ?,
        status_booking = 'reschedule',
        catatan = COALESCE(?, catatan),
        updated_at = CURRENT_TIMESTAMP 
    WHERE id_booking = ?;
  `;

  const [result] = await pool.execute<ResultSetHeader>(sql, [
    newDate,
    newStart,
    newEnd,
    catatan ?? null,
    id,
  ]);
  return result.affectedRows > 0;
}

/**
 * Melakukan pembatalan pemesanan secara SOFT DELETE (PRD Bab 4.5).
 * DILARANG KERAS mengeksekusi perintah fisik `DELETE FROM`.
 * Pembatalan mengubah `status_booking = 'batal'`, membebaskan slot jadwal dan mempertahankan nominal DP untuk audit pembukuan.
 *
 * @param id ID booking yang dibatalkan
 * @returns Promise<boolean> True jika status berhasil diubah ke 'batal'
 */
export async function softDeleteBooking(id: number): Promise<boolean> {
  const sql = `
    UPDATE test.bookings 
    SET status_booking = 'batal', updated_at = CURRENT_TIMESTAMP 
    WHERE id_booking = ?;
  `;

  const [result] = await pool.execute<ResultSetHeader>(sql, [id]);
  return result.affectedRows > 0;
}
