import {
  BookingDomainError,
  rescheduleBooking,
} from '@/services/booking.service';
import { updateCalendarEvent } from '@/services/calendar.service';
import { rescheduleBookingSchema } from '@/validations/booking.schema';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/bookings/[id]/reschedule
 * Mengatur ulang tanggal dan jam pemotretan setelah memastikan slot tujuan bebas dari bentrok jadwal.
 */
export async function PATCH(
  request: NextRequest,
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

    const body = await request.json();
    const validated = rescheduleBookingSchema.parse({
      ...body,
      id_booking: bookingId,
    });

    const updatedBooking = await rescheduleBooking(
      bookingId,
      validated.tanggal_booking,
      validated.jam_booking,
      validated.catatan
    );

    // Sinkronisasi kalender Google
    if (updatedBooking.id_event_calendar) {
      updateCalendarEvent(
        updatedBooking.id_lokasi,
        updatedBooking.id_event_calendar,
        validated.tanggal_booking,
        updatedBooking.jam_booking,
        updatedBooking.jam_selesai
      ).catch((err) => {
        console.error('[API Calendar Reschedule Error]:', err);
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedBooking,
      message: 'Jadwal sesi foto berhasil diatur ulang.',
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0]?.message || 'Input penjadwalan ulang tidak valid',
        },
        { status: 400 }
      );
    }

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
      error instanceof Error ? error.message : 'Gagal mengatur ulang jadwal reservasi';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
