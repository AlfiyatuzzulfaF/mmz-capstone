import { pool } from '@/lib/db';
import {
  getAnalyticsOverview as getAnalyticsOverviewRepo,
  getKpiSummary as getKpiSummaryRepo,
} from '@/repositories/analytics.repository';
import {
  checkSlotConflict,
  completeBooking as completeBookingRepo,
  getBookingById,
  getBookings,
  insertWalkinBooking,
  rescheduleBooking as rescheduleRepo,
  softDeleteBooking as softDeleteRepo,
  updatePaymentStatus as updatePaymentStatusRepo,
} from '@/repositories/booking.repository';
import type {
  AnalyticsData,
  BookingFilterParams,
  BookingListItem,
  KpiSummary,
  PaymentStatus,
} from '@/types/booking';
import type { BookingDetailRow } from '@/types/database';
import {
  createBookingSchema,
  normalizeIndonesianPhone,
} from '@/validations/booking.schema';
import type { RowDataPacket } from 'mysql2/promise';

/**
 * Custom Domain Exception untuk penanganan kesalahan aturan bisnis pemesanan.
 * Memuat kode kesalahan semantik dan HTTP status code terstandar.
 */
export class BookingDomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(
    message: string,
    code: string = 'BOOKING_DOMAIN_ERROR',
    statusCode: number = 400
  ) {
    super(message);
    this.name = 'BookingDomainError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Mengkalkulasi jam selesai sesi secara otomatis berdasarkan jam mulai dan durasi menit paket.
 *
 * @param startTime Jam mulai (format HH:mm atau HH:mm:ss)
 * @param durationMinutes Durasi sesi pemotretan dalam menit
 * @returns Format waktu selesai (HH:mm:ss)
 */
export function calculateEndTime(
  startTime: string,
  durationMinutes: number
): string {
  const parts = startTime.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const totalMinutes = hours * 60 + minutes + durationMinutes;

  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;

  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
}

/**
 * Memetakan baris database JOIN (BookingDetailRow) menjadi view model BookingListItem.
 */
export function mapRowToBookingListItem(
  row: BookingDetailRow
): BookingListItem {
  const dateStr =
    typeof row.tanggal_booking === 'string'
      ? row.tanggal_booking.split('T')[0]
      : row.tanggal_booking.toISOString().split('T')[0];

  const createdStr =
    typeof row.created_at === 'string'
      ? row.created_at
      : row.created_at.toISOString();

  return {
    idBooking: row.id_booking,
    idCustomer: row.id_customer,
    namaCustomer: row.nama_customer,
    noWhatsapp: row.no_whatsapp,
    idPaket: row.id_paket,
    namaPaket: row.nama_paket,
    hargaPaket: Number(row.harga_paket || 0),
    durasiMenit: Number(row.durasi_menit || 0),
    idLokasi: row.id_lokasi,
    studio: row.studio,
    tanggalBooking: dateStr,
    jamBooking: row.jam_booking,
    jamSelesai: row.jam_selesai,
    nominalDp: Number(row.nominal_dp || 0),
    statusPembayaran: row.status_pembayaran,
    statusBooking: row.status_booking,
    idEventCalendar: row.id_event_calendar ?? null,
    backgroundDetail: row.background_detail ?? null,
    createdAt: createdStr,
  };
}

/**
 * Membuat pemesanan manual / walk-in baru dengan validasi ketat, pencegahan double-booking, dan transaksi ACID (KF-04 & KF-09).
 *
 * @param payload Data input mentah dari formulir walk-in
 * @returns Promise<BookingDetailRow> Data reservasi yang berhasil disimpan
 */
export async function createWalkinBooking(
  payload: unknown
): Promise<BookingDetailRow> {
  // 1. Validasi skema input Zod
  const validated = createBookingSchema.parse(payload);
  const normalizedPhone = normalizeIndonesianPhone(validated.no_whatsapp);

  // 2. Ambil informasi paket layanan untuk mendapatkan durasi dan harga paket
  const [pkgs] = await pool.query<RowDataPacket[]>(
    'SELECT id_paket, nama_paket, durasi_menit, harga, status_aktif FROM test.paket_layanan WHERE id_paket = ? LIMIT 1;',
    [validated.id_paket]
  );

  if (!pkgs || pkgs.length === 0) {
    throw new BookingDomainError(
      'Paket layanan foto tidak ditemukan.',
      'PACKAGE_NOT_FOUND',
      404
    );
  }

  const pkg = pkgs[0];
  if (!pkg.status_aktif) {
    throw new BookingDomainError(
      'Paket layanan foto yang dipilih sedang nonaktif.',
      'PACKAGE_INACTIVE',
      400
    );
  }

  // 3. Kalkulasi jam_selesai otomatis (jam_booking + durasi_menit)
  const startTime =
    validated.jam_booking.length === 5
      ? `${validated.jam_booking}:00`
      : validated.jam_booking;
  const endTime = calculateEndTime(startTime, Number(pkg.durasi_menit));

  // 4. Double-Booking Prevention (KF-09): Periksa bentrok slot di database
  const hasConflict = await checkSlotConflict(
    validated.id_lokasi,
    validated.tanggal_booking,
    startTime,
    endTime
  );

  if (hasConflict) {
    throw new BookingDomainError(
      'Slot jadwal pada tanggal dan jam tersebut sudah terisi untuk Studio yang dipilih. Silakan pilih ruangan lain atau sesuaikan jam sesi foto.',
      'SLOT_OCCUPIED',
      409
    );
  }

  // Tentukan status pembayaran awal berdasarkan DP
  const hargaPaket = Number(pkg.harga || 0);
  let statusPembayaran: PaymentStatus = 'belum_dibayar';
  if (validated.nominal_dp >= hargaPaket && hargaPaket > 0) {
    statusPembayaran = 'lunas';
  } else if (validated.nominal_dp > 0) {
    statusPembayaran = 'dp_diterima';
  }

  // 5. Eksekusi transaksi database terkelola (ACID)
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const bookingId = await insertWalkinBooking(conn, {
      nama_customer: validated.nama_customer,
      no_whatsapp: normalizedPhone,
      id_paket: validated.id_paket,
      id_lokasi: validated.id_lokasi,
      id_admin: 1, // Default Frontdesk Staff
      tanggal_booking: validated.tanggal_booking,
      jam_booking: startTime,
      jam_selesai: endTime,
      nominal_dp: validated.nominal_dp,
      status_pembayaran: statusPembayaran,
      status_booking: 'terkonfirmasi',
      catatan: validated.catatan ?? null,
    });

    await conn.commit();

    const createdRecord = await getBookingById(bookingId);
    if (!createdRecord) {
      throw new BookingDomainError(
        'Gagal mengambil rincian reservasi yang baru disimpan.',
        'FETCH_FAILED',
        500
      );
    }

    return createdRecord;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Melakukan verifikasi pelunasan tagihan kasir (PRD Bab 4.4).
 *
 * @param idBooking ID pemesanan
 * @returns Promise<BookingDetailRow> Rincian reservasi setelah status diperbarui ke 'lunas'
 */
export async function settlePayment(
  idBooking: number
): Promise<BookingDetailRow> {
  const booking = await getBookingById(idBooking);

  if (!booking) {
    throw new BookingDomainError(
      'Data reservasi tidak ditemukan.',
      'NOT_FOUND',
      404
    );
  }

  if (booking.status_booking === 'batal') {
    throw new BookingDomainError(
      'Pemesanan yang telah dibatalkan tidak dapat dilunasi.',
      'INVALID_STATUS',
      400
    );
  }

  if (booking.status_pembayaran === 'lunas') {
    return booking;
  }

  const updated = await updatePaymentStatusRepo(idBooking, 'lunas');
  if (!updated) {
    throw new BookingDomainError(
      'Gagal memperbarui status pelunasan di basis data.',
      'UPDATE_FAILED',
      500
    );
  }

  return (await getBookingById(idBooking))!;
}

/**
 * Menyelesaikan sesi pemotretan (mengubah status booking menjadi 'selesai').
 *
 * @param idBooking ID pemesanan
 * @returns Promise<BookingDetailRow> Data reservasi setelah status menjadi selesai
 */
export async function completeBookingSession(
  idBooking: number
): Promise<BookingDetailRow> {
  const booking = await getBookingById(idBooking);

  if (!booking) {
    throw new BookingDomainError(
      'Data reservasi tidak ditemukan.',
      'NOT_FOUND',
      404
    );
  }

  if (booking.status_booking === 'batal') {
    throw new BookingDomainError(
      'Pemesanan yang telah dibatalkan tidak dapat ditandai selesai.',
      'INVALID_STATUS',
      400
    );
  }

  if (booking.status_booking === 'selesai') {
    return booking;
  }

  const completed = await completeBookingRepo(idBooking);
  if (!completed) {
    throw new BookingDomainError(
      'Gagal memperbarui status selesai di basis data.',
      'UPDATE_FAILED',
      500
    );
  }

  return (await getBookingById(idBooking))!;
}

/**
 * Mengatur ulang jadwal sesi pemotretan (Reschedule) dengan validasi ketersediaan slot (PRD Bab 4.4).
 *
 * @param idBooking ID pemesanan
 * @param newDate Tanggal pemotretan baru (YYYY-MM-DD)
 * @param newStartTime Jam mulai baru (HH:mm)
 * @param catatan Catatan tambahan opsional
 * @returns Promise<BookingDetailRow> Data reservasi setelah berhasil di-reschedule
 */
export async function rescheduleBooking(
  idBooking: number,
  newDate: string,
  newStartTime: string,
  catatan?: string | null
): Promise<BookingDetailRow> {
  const booking = await getBookingById(idBooking);

  if (!booking) {
    throw new BookingDomainError(
      'Data reservasi tidak ditemukan.',
      'NOT_FOUND',
      404
    );
  }

  if (booking.status_booking === 'batal') {
    throw new BookingDomainError(
      'Pemesanan yang telah dibatalkan tidak dapat diatur ulang jadwalnya.',
      'INVALID_STATUS',
      400
    );
  }

  // Hitung jam selesai baru berdasarkan durasi paket sesi
  const startTime =
    newStartTime.length === 5 ? `${newStartTime}:00` : newStartTime;
  const endTime = calculateEndTime(startTime, booking.durasi_menit);

  // Periksa bentrok slot pada waktu baru (mengecualikan ID booking yang sedang di-reschedule)
  const hasConflict = await checkSlotConflict(
    booking.id_lokasi,
    newDate,
    startTime,
    endTime,
    idBooking
  );

  if (hasConflict) {
    throw new BookingDomainError(
      'Slot jadwal pada tanggal dan jam tersebut sudah terisi untuk Studio yang dipilih. Silakan pilih ruangan lain atau sesuaikan jam sesi foto.',
      'SLOT_OCCUPIED',
      409
    );
  }

  const updated = await rescheduleRepo(
    idBooking,
    newDate,
    startTime,
    endTime,
    catatan ?? booking.background_detail
  );

  if (!updated) {
    throw new BookingDomainError(
      'Gagal memperbarui jadwal di basis data.',
      'UPDATE_FAILED',
      500
    );
  }

  return (await getBookingById(idBooking))!;
}

/**
 * Membatalkan jadwal pemesanan secara SOFT DELETE (PRD Bab 4.5).
 * Status diubah menjadi 'batal', slot jadwal dibebaskan, dan nominal DP tetap tersimpan untuk pembukuan.
 *
 * @param idBooking ID pemesanan yang dibatalkan
 * @returns Promise<BookingDetailRow> Data reservasi setelah dibatalkan
 */
export async function cancelBooking(
  idBooking: number
): Promise<BookingDetailRow> {
  const booking = await getBookingById(idBooking);

  if (!booking) {
    throw new BookingDomainError(
      'Data reservasi tidak ditemukan.',
      'NOT_FOUND',
      404
    );
  }

  if (booking.status_booking === 'batal') {
    throw new BookingDomainError(
      'Pemesanan ini sudah berstatus dibatalkan.',
      'ALREADY_CANCELED',
      400
    );
  }

  const canceled = await softDeleteRepo(idBooking);
  if (!canceled) {
    throw new BookingDomainError(
      'Gagal memproses pembatalan di basis data.',
      'UPDATE_FAILED',
      500
    );
  }

  return (await getBookingById(idBooking))!;
}

/**
 * Mengambil daftar seluruh jadwal reservasi operasional terformat untuk tabel dashboard.
 *
 * @param filters Parameter penyaringan jadwal
 * @returns Promise<BookingListItem[]>
 */
export async function fetchOperationalBookings(
  filters: BookingFilterParams = {}
): Promise<BookingListItem[]> {
  const rows = await getBookings(filters);
  return rows.map(mapRowToBookingListItem);
}

/**
 * Mengambil ringkasan metrik 4 kartu KPI Scorecard (PRD Bab 4.2 & 5.2).
 *
 * @param startDate Filter tanggal mulai
 * @param endDate Filter tanggal akhir
 * @returns Promise<KpiSummary>
 */
export async function fetchKpiSummary(
  startDate?: string,
  endDate?: string
): Promise<KpiSummary> {
  return getKpiSummaryRepo(startDate, endDate);
}

/**
 * Mengambil ringkasan data analitik terpadu (KPI, grafik paket terlaris, dan diagram donat studio).
 *
 * @param startDate Filter tanggal mulai
 * @param endDate Filter tanggal akhir
 * @returns Promise<AnalyticsData>
 */
export async function fetchAnalyticsOverview(
  startDate?: string,
  endDate?: string
): Promise<AnalyticsData> {
  return getAnalyticsOverviewRepo(startDate, endDate);
}
