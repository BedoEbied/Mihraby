import { z } from 'zod';

/**
 * Time slots are stored in UTC and validated as ISO datetime strings.
 * `start_time` must be strictly before `end_time`. The service layer is
 * responsible for checking that slots are in the future and that duration
 * matches the owning course's `slot_duration`.
 */

const timeRange = z
  .object({
    start_time: z.string().datetime({ offset: true }),
    end_time: z.string().datetime({ offset: true }),
  })
  .refine((v) => new Date(v.start_time).getTime() < new Date(v.end_time).getTime(), {
    message: 'start_time must be before end_time',
    path: ['end_time'],
  });

export const createTimeSlotSchema = z
  .object({
    course_id: z.number().int().positive(),
    start_time: z.string().datetime({ offset: true }),
    end_time: z.string().datetime({ offset: true }),
  })
  .refine((v) => new Date(v.start_time).getTime() < new Date(v.end_time).getTime(), {
    message: 'start_time must be before end_time',
    path: ['end_time'],
  });

export const createTimeSlotsBulkSchema = z.object({
  course_id: z.number().int().positive(),
  slots: z.array(timeRange).min(1).max(50),
});

export const updateTimeSlotSchema = z
  .object({
    start_time: z.string().datetime({ offset: true }).optional(),
    end_time: z.string().datetime({ offset: true }).optional(),
  })
  .refine(
    (v) => {
      if (v.start_time && v.end_time) {
        return new Date(v.start_time).getTime() < new Date(v.end_time).getTime();
      }
      return true;
    },
    { message: 'start_time must be before end_time', path: ['end_time'] }
  );

export type CreateTimeSlotInput = z.infer<typeof createTimeSlotSchema>;
export type CreateTimeSlotsBulkInput = z.infer<typeof createTimeSlotsBulkSchema>;
export type UpdateTimeSlotInput = z.infer<typeof updateTimeSlotSchema>;
