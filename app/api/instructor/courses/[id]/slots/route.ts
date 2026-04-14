import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { TimeSlotService } from '@/lib/services/timeSlotService';
import {
  createTimeSlotSchema,
  createTimeSlotsBulkSchema,
} from '@/lib/validators/time-slot';
import { courseIdSchema } from '@/lib/validators/course';
import { ApiResponse, UserRole, ITimeSlot, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

/**
 * GET /api/instructor/courses/[id]/slots — list ALL slots (available or not)
 * for the instructor's own course.
 */
async function listSlotsHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const { id } = await context.params;
    const { id: courseId } = courseIdSchema.parse({ id });

    const slots = await TimeSlotService.listByCourse(
      context.user.userId,
      context.user.role,
      courseId
    );

    return NextResponse.json<ApiResponse<{ slots: ITimeSlot[]; count: number }>>({
      success: true,
      data: { slots, count: slots.length },
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] List course slots error:`, error);
    return handleApiError(error, requestId);
  }
}

/**
 * POST /api/instructor/courses/[id]/slots — create one or more slots.
 * Body may be either a single `CreateTimeSlotDTO` or a bulk shape with
 * `{ slots: [...] }`.
 */
async function createSlotsHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const { id } = await context.params;
    const { id: courseId } = courseIdSchema.parse({ id });

    const body = (await req.json()) as Record<string, unknown>;
    const withCourseId = { ...body, course_id: courseId };

    if (Array.isArray((body as { slots?: unknown }).slots)) {
      const validated = createTimeSlotsBulkSchema.parse(withCourseId);
      const created = await TimeSlotService.createSlotsBulk(
        context.user.userId,
        context.user.role,
        validated
      );
      return NextResponse.json<ApiResponse<{ slots: ITimeSlot[]; count: number }>>(
        { success: true, message: 'Slots created', data: { slots: created, count: created.length } },
        { status: 201 }
      );
    }

    const validated = createTimeSlotSchema.parse(withCourseId);
    const slot = await TimeSlotService.createSlot(
      context.user.userId,
      context.user.role,
      validated
    );
    return NextResponse.json<ApiResponse<ITimeSlot>>(
      { success: true, message: 'Slot created', data: slot },
      { status: 201 }
    );
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Create course slots error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], listSlotsHandler);
export const POST = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], createSlotsHandler);
