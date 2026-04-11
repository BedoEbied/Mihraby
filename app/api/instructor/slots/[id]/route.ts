import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/middleware/auth';
import { TimeSlotService } from '@/lib/services/timeSlotService';
import { updateTimeSlotSchema } from '@/lib/validators/time-slot';
import { ApiResponse, UserRole, ITimeSlot, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

const slotIdSchema = z.object({ id: z.coerce.number().int().min(1) });

/**
 * PUT /api/instructor/slots/[id] — update a slot the instructor owns.
 * Rejects held/booked slots.
 */
async function updateSlotHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const { id } = await context.params;
    const { id: slotId } = slotIdSchema.parse({ id });
    const body = await req.json();
    const validated = updateTimeSlotSchema.parse(body);

    const updated = await TimeSlotService.updateSlot(
      context.user.userId,
      context.user.role,
      slotId,
      validated
    );
    return NextResponse.json<ApiResponse<ITimeSlot>>({
      success: true,
      message: 'Slot updated',
      data: updated,
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Update slot error:`, error);
    return handleApiError(error, requestId);
  }
}

/**
 * DELETE /api/instructor/slots/[id] — delete a slot the instructor owns.
 * Rejects held/booked slots.
 */
async function deleteSlotHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const { id } = await context.params;
    const { id: slotId } = slotIdSchema.parse({ id });

    await TimeSlotService.deleteSlot(context.user.userId, context.user.role, slotId);
    return NextResponse.json<ApiResponse>({ success: true, message: 'Slot deleted' });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Delete slot error:`, error);
    return handleApiError(error, requestId);
  }
}

export const PUT = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], updateSlotHandler);
export const DELETE = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], deleteSlotHandler);
