import type { BookingStatus, PaymentStatus } from './booking';

/**
 * Entitas baris tabel `customers` (Master Pelanggan).
 */
export interface CustomerRow {
  id_customer: number;
  nama_customer: string;
  no_whatsapp: string;
  created_at: Date | string;
}

/**
 * Entitas baris tabel `paket_layanan` (Master Paket Layanan Foto).
 */
export interface PaketLayananRow {
  id_paket: number;
  nama_paket: string;
  durasi_menit: number;
  harga: number | string;
  status_aktif: number;
}

/**
 * Entitas baris tabel `lokasi` (Master Ruangan Studio).
 * Nilai: 1 = Studio 1, 2 = Studio 2.
 */
export interface LokasiRow {
  id_lokasi: number;
  nama_lokasi: string;
  alamat: string;
}

/**
 * Entitas baris tabel `admin` (Master Staf Operasional & Pemilik).
 */
export interface AdminRow {
  id_admin: number;
  nama_admin: string;
  email: string | null;
  role: 'admin' | 'owner';
}

/**
 * Entitas baris tabel `bookings` (Fakta Transaksi Pemesanan).
 */
export interface BookingRow {
  id_booking: number;
  id_customer: number;
  id_paket: number;
  id_lokasi: number;
  id_admin: number | null;
  tanggal_booking: Date | string;
  jam_booking: string;
  jam_selesai: string;
  nominal_dp: number | string;
  status_pembayaran: PaymentStatus;
  status_booking: BookingStatus;
  id_event_calendar: string | null;
  catatan: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

/**
 * Entitas baris hasil kueri JOIN terpadu untuk Tabel Operasional (PRD Bab 5.1).
 * Menggabungkan relasi tabel `bookings`, `customers`, `paket_layanan`, dan `lokasi`.
 */
export interface BookingDetailRow {
  id_booking: number;
  id_customer: number;
  nama_customer: string;
  no_whatsapp: string;
  id_paket: number;
  nama_paket: string;
  harga_paket: number | string;
  durasi_menit: number;
  id_lokasi: number;
  studio: string;
  tanggal_booking: Date | string;
  jam_booking: string;
  jam_selesai: string;
  nominal_dp: number | string;
  status_pembayaran: PaymentStatus;
  status_booking: BookingStatus;
  id_event_calendar: string | null;
  background_detail: string | null;
  created_at: Date | string;
}

/**
 * Entitas baris tabel `sesi_percakapan` (State Mesin Bot WhatsApp n8n).
 */
export interface SesiPercakapanRow {
  id_sesi: number;
  no_whatsapp: string;
  tahap: string;
  tanggal_diminta: Date | string | null;
  jam_diminta: string | null;
  updated_at: Date | string;
}
