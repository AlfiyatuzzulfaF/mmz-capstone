import { z } from 'zod';

/**
 * Regex validasi nomor kontak WhatsApp Indonesia.
 * Mendukung format: 081234567890, 6281234567890, atau +6281234567890 (10 s.d. 14 digit).
 */
export const INDONESIAN_PHONE_REGEX = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;

/**
 * Regex validasi format tanggal ISO (YYYY-MM-DD).
 */
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Regex validasi format jam 24 jam (HH:mm).
 */
export const TIME_HH_MM_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/**
 * Utilitas untuk menormalisasi format nomor kontak ke format standar E.164 tanpa tanda plus (628xxx).
 */
export function normalizeIndonesianPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+62')) {
    return cleaned.slice(1);
  }
  if (cleaned.startsWith('08')) {
    return '62' + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Skema validasi input form pemesanan manual / walk-in (KF-04 & KNF-03).
 */
export const createBookingSchema = z.object({
  nama_customer: z
    .string({ message: 'Nama pelanggan wajib diisi' })
    .trim()
    .min(3, { message: 'Nama pelanggan wajib diisi minimal 3 karakter' })
    .max(100, { message: 'Nama pelanggan maksimal 100 karakter' }),

  no_whatsapp: z
    .string({ message: 'Nomor WhatsApp wajib diisi' })
    .trim()
    .regex(INDONESIAN_PHONE_REGEX, {
      message: 'Nomor WhatsApp tidak valid. Format: 08xx atau 628xx (minimal 10 digit)',
    }),

  id_paket: z.coerce
    .number({ message: 'Paket layanan harus berupa angka' })
    .int({ message: 'ID paket tidak valid' })
    .positive({ message: 'Silakan pilih paket layanan foto yang valid' }),

  id_lokasi: z.coerce
    .number({ message: 'Ruangan studio harus berupa angka' })
    .int({ message: 'ID studio tidak valid' })
    .refine((val) => val === 1 || val === 2, {
      message: 'Ruangan studio harus dipilih (Studio 1 atau Studio 2)',
    }),

  tanggal_booking: z
    .string({ message: 'Tanggal booking wajib diisi' })
    .trim()
    .regex(ISO_DATE_REGEX, {
      message: 'Tanggal sesi wajib diisi dengan format YYYY-MM-DD',
    }),

  jam_booking: z
    .string({ message: 'Jam booking wajib diisi' })
    .trim()
    .regex(TIME_HH_MM_REGEX, {
      message: 'Jam mulai sesi wajib diisi dengan format HH:mm',
    }),

  nominal_dp: z.coerce
    .number({ message: 'Nominal DP harus berupa angka' })
    .min(0, { message: 'Nominal DP tidak boleh bernilai negatif' })
    .default(0),

  catatan: z
    .string()
    .max(500, { message: 'Catatan tambahan maksimal 500 karakter' })
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * Skema validasi permintaan perubahan jadwal pemotretan / Reschedule (PRD Bab 4.4).
 */
export const rescheduleBookingSchema = z.object({
  id_booking: z.coerce
    .number({ message: 'ID booking harus berupa angka' })
    .int({ message: 'ID booking tidak valid' })
    .positive({ message: 'ID booking wajib disertakan' }),

  tanggal_booking: z
    .string({ message: 'Tanggal baru wajib diisi' })
    .trim()
    .regex(ISO_DATE_REGEX, {
      message: 'Tanggal baru wajib diisi dengan format YYYY-MM-DD',
    }),

  jam_booking: z
    .string({ message: 'Jam mulai baru wajib diisi' })
    .trim()
    .regex(TIME_HH_MM_REGEX, {
      message: 'Jam mulai baru wajib diisi dengan format HH:mm',
    }),

  catatan: z
    .string()
    .max(500, { message: 'Catatan tambahan maksimal 500 karakter' })
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
});

export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;

/**
 * Skema validasi pembaruan status pembayaran oleh kasir studio.
 */
export const updatePaymentStatusSchema = z.object({
  id_booking: z.coerce
    .number({ message: 'ID booking harus berupa angka' })
    .int({ message: 'ID booking tidak valid' })
    .positive({ message: 'ID booking wajib disertakan' }),

  status_pembayaran: z.enum(['belum_dibayar', 'dp_diterima', 'lunas'], {
    message: 'Status pembayaran tidak valid. Pilihan: belum_dibayar, dp_diterima, lunas',
  }),
});

export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;

/**
 * Skema validasi parameter kueri filter pada jadwal operasional (PRD Bab 4.3).
 */
export const filterBookingSchema = z.object({
  startDate: z
    .string()
    .regex(ISO_DATE_REGEX, { message: 'Format tanggal awal tidak valid (YYYY-MM-DD)' })
    .optional(),

  endDate: z
    .string()
    .regex(ISO_DATE_REGEX, { message: 'Format tanggal akhir tidak valid (YYYY-MM-DD)' })
    .optional(),

  studioId: z
    .union([z.literal('all'), z.coerce.number().int().refine((v) => v === 1 || v === 2)])
    .optional(),

  paymentStatus: z
    .union([z.literal('all'), z.enum(['belum_dibayar', 'dp_diterima', 'lunas'])])
    .optional(),

  bookingStatus: z
    .union([z.literal('all'), z.enum(['menunggu_dp', 'terkonfirmasi', 'batal', 'reschedule'])])
    .optional(),

  searchQuery: z.string().trim().max(100).optional(),
});

export type FilterBookingInput = z.infer<typeof filterBookingSchema>;
