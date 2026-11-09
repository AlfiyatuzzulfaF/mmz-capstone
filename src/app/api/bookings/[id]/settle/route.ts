import {
  BookingDomainError,
  settlePayment,
} from '@/services/booking.service';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/bookings/[id]/settle
 * Memverifikasi dan mengubah status pembayaran pemesanan menjadi 'lunas'.
 */
export async function PATCH(
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

    const updatedBooking = await settlePayment(bookingId);

    return NextResponse.json({
      success: true,
      data: updatedBooking,
      message: 'Status pembayaran berhasil diperbarui menjadi Lunas.',
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
      error instanceof Error ? error.message : 'Gagal memperbarui status pembayaran';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
