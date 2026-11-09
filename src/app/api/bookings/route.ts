import {
  BookingDomainError,
  createWalkinBooking,
  fetchOperationalBookings,
} from '@/services/booking.service';
import { createCalendarEvent } from '@/services/calendar.service';
import { triggerBookingConfirmedNotification } from '@/services/notification.service';
import {
  createBookingSchema,
  filterBookingSchema,
} from '@/validations/booking.schema';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings
 * Mengambil daftar jadwal operasional reservasi dengan filter dinamis.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const rawFilter = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      studioId: searchParams.get('studioId') || undefined,
      paymentStatus: searchParams.get('paymentStatus') || undefined,
      bookingStatus: searchParams.get('bookingStatus') || undefined,
      searchQuery: searchParams.get('searchQuery') || undefined,
    };

    const filter = filterBookingSchema.parse(rawFilter);
    const bookings = await fetchOperationalBookings(filter);

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0]?.message || 'Parameter filter tidak valid',
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

    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * Membuat reservasi pemesanan walk-in baru secara transaksional,
 * kemudian menyinkronkan event ke Google Calendar dan memicu notifikasi n8n WhatsApp.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedPayload = createBookingSchema.parse(body);

    // 1. Simpan pemesanan secara transaksional via BookingService
    const createdBooking = await createWalkinBooking(validatedPayload);

    // 2. Sinkronisasi kalender dan notifikasi (Fire-and-forget / non-blocking)
    createCalendarEvent(createdBooking).catch((err) => {
      console.error('[API Calendar Error]:', err);
    });

    triggerBookingConfirmedNotification(createdBooking).catch((err) => {
      console.error('[API Notification Error]:', err);
    });

    return NextResponse.json(
      {
        success: true,
        data: createdBooking,
        message: 'Pemesanan walk-in berhasil disimpan dan jadwal telah diperbarui.',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0]?.message || 'Validasi formulir gagal',
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

    const message = error instanceof Error ? error.message : 'Gagal membuat reservasi';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
