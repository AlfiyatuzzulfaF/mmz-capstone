import {
  BookingDomainError,
  cancelBooking,
} from '@/services/booking.service';
import { cancelCalendarEvent } from '@/services/calendar.service';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/bookings/[id]
 * Membatalkan jadwal pemesanan secara SOFT DELETE (PRD Bab 4.5).
 * Mengubah status_booking = 'batal', melepaskan slot kalender, dan mempertahankan DP untuk pembukuan kas.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = Number(id);

    if (isNaN(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID reservasi tidak valid',
        },
        { status: 400 }
      );
    }

    const canceledBooking = await cancelBooking(bookingId);

    // Batalkan / lepaskan event kalender Google
    if (canceledBooking.id_event_calendar) {
      cancelCalendarEvent(
        canceledBooking.id_lokasi,
        canceledBooking.id_event_calendar
      ).catch((err) => {
        console.error('[API Calendar Cancel Error]:', err);
      });
    }

    return NextResponse.json({
      success: true,
      data: canceledBooking,
      message: 'Pemesanan berhasil dibatalkan dan slot jadwal telah dibebaskan.',
    });
  } catch (error: unknown) {
    if (error instanceof BookingDomainError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    const message =
      error instanceof Error ? error.message : 'Gagal memproses pembatalan pemesanan';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
