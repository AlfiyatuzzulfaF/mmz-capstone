/**
 * Status pembayaran kasir untuk reservasi MMZ Studio Foto.
 * - belum_dibayar: Belum ada pembayaran uang muka
 * - dp_diterima: Uang muka (DP) telah diterima, sisa tagihan menunggu pelunasan
 * - lunas: Biaya pemotretan telah dibayar 100%
 */
export type PaymentStatus = 'belum_dibayar' | 'dp_diterima' | 'lunas';

/**
 * Status siklus hidup reservasi.
 * - menunggu_dp: Menunggu pembayaran DP oleh pelanggan
 * - terkonfirmasi: Jadwal sesi foto telah disetujui dan slot kalender terkunci
 * - batal: Pemesanan dibatalkan (soft delete, slot kalender dilepas)
 * - reschedule: Jadwal sesi dipindahkan ke waktu/hari lain
 * - selesai: Sesi pemotretan telah selesai dilaksanakan
 */
export type BookingStatus =
  | 'menunggu_dp'
  | 'terkonfirmasi'
  | 'batal'
  | 'reschedule'
  | 'selesai';

/**
 * Identitas ruangan studio MMZ.
 */
export type StudioId = 1 | 2;
export type StudioName = 'Studio 1' | 'Studio 2';

/**
 * Parameter filter kueri tabel operasional jadwal di dashboard.
 */
export interface BookingFilterParams {
  startDate?: string;
  endDate?: string;
  studioId?: number | 'all';
  paymentStatus?: PaymentStatus | 'all';
  bookingStatus?: BookingStatus | 'all';
  searchQuery?: string;
}

/**
 * Representasi item baris pada tabel jadwal operasional antarmuka kasir/admin.
 */
export interface BookingListItem {
  idBooking: number;
  idCustomer: number;
  namaCustomer: string;
  noWhatsapp: string;
  idPaket: number;
  namaPaket: string;
  hargaPaket: number;
  durasiMenit: number;
  idLokasi: number;
  studio: string;
  tanggalBooking: string;
  jamBooking: string;
  jamSelesai: string;
  nominalDp: number;
  statusPembayaran: PaymentStatus;
  statusBooking: BookingStatus;
  idEventCalendar: string | null;
  backgroundDetail: string | null;
  createdAt: string;
}

/**
 * DTO untuk 4 Kartu Metrik Ringkasan Operasional (Scorecards KPI) - PRD Bab 4.2 & 5.2.
 */
export interface KpiSummary {
  /** Total seluruh transaksi aktif yang tidak dibatalkan */
  totalBooking: number;
  /** Total uang muka (DP) yang telah masuk ke buku kas (IDR) */
  totalDpMasuk: number;
  /** Jumlah pemesanan dengan status 'terkonfirmasi' */
  bookingTerkonfirmasi: number;
  /** Jumlah pemesanan yang menunggu pelunasan (status_pembayaran = 'dp_diterima') */
  menungguPelunasan: number;
}

/**
 * DTO data statistik paket terlaris untuk grafik batang (PRD Bab 5.3).
 */
export interface TopPackageStat {
  namaPaket: string;
  totalTerjual: number;
}

/**
 * DTO data rasio utilisasi ruangan Studio 1 vs Studio 2 untuk diagram donat (PRD Bab 5.3).
 */
export interface StudioRatioStat {
  studio: string;
  totalSesi: number;
  persentase?: number;
}

/**
 * Agregasi lengkap seluruh data analitik untuk halaman Overview/Dashboard.
 */
export interface AnalyticsData {
  kpi: KpiSummary;
  topPackages: TopPackageStat[];
  studioRatio: StudioRatioStat[];
}

/**
 * Format standar amplop respons API backend.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
