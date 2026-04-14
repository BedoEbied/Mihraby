import { NextRequest, NextResponse } from 'next/server';
import { TimeSlotService } from '@/lib/services/timeSlotService';
import { courseIdSchema } from '@/lib/validators/course';
import { ApiResponse, ITimeSlot } from '@/types';
import { handleApiError } from '@/lib/api/errors';

/**
 * GET /api/courses/[id]/slots/available — public read. Returns only
 * slots that are still `is_available = 1` AND start in the future.
 * Used by the student slot picker.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const { id } = await context.params;
    const { id: courseId } = courseIdSchema.parse({ id });

    const slots = await TimeSlotService.listAvailableByCourse(courseId);
    return NextResponse.json<ApiResponse<{ slots: ITimeSlot[]; count: number }>>({
      success: true,
      data: { slots, count: slots.length },
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] List available slots error:`, error);
    return handleApiError(error, requestId);
  }
}
