import type { BookingDetailRow } from '@/types/database';

/**
 * Payload pengiriman notifikasi konfirmasi booking ke webhook n8n (KF-12 & ARCHITECTURE.md 5.2).
 */
export interface BookingConfirmedNotificationPayload {
  event: string;
  id_booking: number;
  customer_name: string;
  phone_number: string;
  studio: string;
  package_name: string;
  date: string;
  start_time: string;
  end_time: string;
  nominal_dp: number;
  status_pembayaran: string;
}

/**
 * Mengirimkan sinyal webhook ke n8n Automation Engine untuk pengiriman pesan WhatsApp konfirmasi ke customer (KF-12).
 * Operasi ini berjalan secara aman (*fail-safe non-blocking*): jika webhook n8n offline di lingkungan dev,
 * sistem hanya mencatat log dan tidak menggagalkan penyimpanan pemesanan di antarmuka.
 *
 * @param booking Rincian data booking lengkap dari database
 * @returns Promise<boolean> True jika webhook berhasil dikirim atau fallback tercatat
 */
export async function triggerBookingConfirmedNotification(
  booking: BookingDetailRow
): Promise<boolean> {
  const webhookBaseUrl =
    process.env.N8N_WEBHOOK_URL || 'https://n8n.yourstudio.com/webhook/mmz-booking-notification';

  const dateStr =
    typeof booking.tanggal_booking === 'string'
      ? booking.tanggal_booking.split('T')[0]
      : booking.tanggal_booking.toISOString().split('T')[0];

  const payload: BookingConfirmedNotificationPayload = {
    event: 'BOOKING_VERIFIED',
    id_booking: booking.id_booking,
    customer_name: booking.nama_customer,
    phone_number: booking.no_whatsapp,
    studio: booking.studio,
    package_name: booking.nama_paket,
    date: dateStr,
    start_time: booking.jam_booking,
    end_time: booking.jam_selesai,
    nominal_dp: Number(booking.nominal_dp || 0),
    status_pembayaran: booking.status_pembayaran,
  };

  const targetUrl = webhookBaseUrl.endsWith('/')
    ? `${webhookBaseUrl}booking-confirmed`
    : `${webhookBaseUrl}/booking-confirmed`;

  console.log(`[n8n Notification] Menyiapkan dispatch WhatsApp via webhook ke ${targetUrl}:`, {
    id_booking: payload.id_booking,
    customer: payload.customer_name,
    phone: payload.phone_number,
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      console.log(`[n8n Notification] Berhasil mengirim webhook untuk Booking #${booking.id_booking}.`);
      return true;
    } else {
      console.warn(
        `[n8n Notification Warning] Webhook mengembalikan status ${response.status}: ${response.statusText}`
      );
      return false;
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown webhook error';
    console.warn(
      `[n8n Notification Fallback] Gagal menjangkau webhook n8n (${targetUrl}): ${errMessage}. Pemesanan tetap tersimpan di database.`
    );
    return false;
  }
}
