'use client';

import { useState, useCallback } from 'react';
import { ITimeSlot, CreateTimeSlotDTO } from '@/lib/types';
import { createTimeSlotSchema } from '@/lib/validators/time-slot';

type TimeSlotFormProps = {
  courseId: number;
  slot?: ITimeSlot | null;
  onSubmit: (data: CreateTimeSlotDTO) => void;
  onCancel?: () => void;
  isPending?: boolean;
};

/** Format Date for datetime-local input (YYYY-MM-DDTHH:mm) */
function toDateTimeLocal(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parse datetime-local value to ISO string */
function fromDateTimeLocal(value: string): string {
  return new Date(value).toISOString();
}

export default function TimeSlotForm({
  courseId,
  slot,
  onSubmit,
  onCancel,
  isPending = false,
}: TimeSlotFormProps) {
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000); // 2 hours from now

  const [startTime, setStartTime] = useState(() =>
    slot ? toDateTimeLocal(slot.start_time) : toDateTimeLocal(defaultStart)
  );
  const [endTime, setEndTime] = useState(() =>
    slot ? toDateTimeLocal(slot.end_time) : toDateTimeLocal(defaultEnd)
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const start = fromDateTimeLocal(startTime);
      const end = fromDateTimeLocal(endTime);
      const result = createTimeSlotSchema.safeParse({
        course_id: courseId,
        start_time: start,
        end_time: end,
      });
      if (!result.success) {
        setError(result.error.issues.map((i: { message: string }) => i.message).join('. '));
        return;
      }
      onSubmit({
        course_id: courseId,
        start_time: result.data.start_time,
        end_time: result.data.end_time,
      });
    },
    [courseId, startTime, endTime, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="rounded border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">
        {slot ? `Edit slot #${slot.id}` : 'Add time slot'}
      </h3>
      {error && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="start_time" className="block text-xs font-medium text-gray-600 mb-1">
            Start
          </label>
          <input
            id="start_time"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            min={slot ? undefined : toDateTimeLocal(now)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="end_time" className="block text-xs font-medium text-gray-600 mb-1">
            End
          </label>
          <input
            id="end_time"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            min={startTime}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : slot ? 'Update slot' : 'Add slot'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
