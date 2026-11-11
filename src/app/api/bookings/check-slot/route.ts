import { checkSlotConflict } from '@/repositories/booking.repository';
import { calculateEndTime } from '@/services/booking.service';
import { ISO_DATE_REGEX, TIME_HH_MM_REGEX } from '@/validations/booking.schema';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/check-slot
 * Memeriksa ketersediaan slot jadwal secara real-time untuk pencegahan bentrok ganda (KF-09).
 *
 * Query Parameters:
 * - studioId: 1 | 2
 * - date: YYYY-MM-DD
 * - startTime: HH:mm
 * - durationMinutes?: number (default 45)
 * - excludeId?: number (opsional untuk rescheduling)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const studioIdParam = searchParams.get('studioId');
    const dateParam = searchParams.get('date');
    const startTimeParam = searchParams.get('startTime');
    const durationParam = searchParams.get('durationMinutes');
    const excludeIdParam = searchParams.get('excludeId');

    const studioId = Number(studioIdParam);
    if (!studioId || (studioId !== 1 && studioId !== 2)) {
      return NextResponse.json(
        { success: false, error: 'Ruangan studio harus bernilai 1 atau 2' },
        { status: 400 }
      );
    }

    if (!dateParam || !ISO_DATE_REGEX.test(dateParam)) {
      return NextResponse.json(
        { success: false, error: 'Format tanggal tidak valid (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (!startTimeParam || !TIME_HH_MM_REGEX.test(startTimeParam)) {
      return NextResponse.json(
        { success: false, error: 'Format jam mulai tidak valid (HH:mm)' },
        { status: 400 }
      );
    }

    const durationMinutes = durationParam ? parseInt(durationParam, 10) : 45;
    const excludeId = excludeIdParam ? parseInt(excludeIdParam, 10) : undefined;

    const startTimeFormatted =
      startTimeParam.length === 5 ? `${startTimeParam}:00` : startTimeParam;
    const endTimeFormatted = calculateEndTime(startTimeFormatted, durationMinutes);

    const hasConflict = await checkSlotConflict(
      studioId,
      dateParam,
      startTimeFormatted,
      endTimeFormatted,
      excludeId
    );

    return NextResponse.json({
      success: true,
      data: {
        studioId,
        date: dateParam,
        startTime: startTimeParam,
        endTime: endTimeFormatted.slice(0, 5),
        durationMinutes,
        available: !hasConflict,
        conflict: hasConflict,
      },
      message: hasConflict
        ? 'Slot jadwal pada tanggal dan jam tersebut sudah terisi untuk Studio yang dipilih. Silakan pilih ruangan lain atau sesuaikan jam sesi foto.'
        : 'Slot jadwal tersedia untuk dipilih.',
    });
  } catch (error) {
    console.error('[API Check Slot Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kendala saat memeriksa ketersediaan slot jadwal.',
      },
      { status: 500 }
    );
  }
}
