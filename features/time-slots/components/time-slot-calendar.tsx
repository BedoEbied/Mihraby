'use client';

import { ITimeSlot } from '@/lib/types';

type TimeSlotCalendarProps = {
  slots: ITimeSlot[];
  onSlotSelect?: (slot: ITimeSlot) => void;
  onEdit?: (slot: ITimeSlot) => void;
  onDelete?: (slot: ITimeSlot) => void;
  isDeletingId?: number | null;
};

function formatSlotTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function TimeSlotCalendar({
  slots,
  onSlotSelect,
  onEdit,
  onDelete,
  isDeletingId = null,
}: TimeSlotCalendarProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500">No time slots yet. Add one below.</p>
    );
  }

  return (
    <div className="rounded border border-gray-200 bg-white overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {slots.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-gray-50"
          >
            <div className="text-sm">
              <span className="font-medium text-gray-900">
                {formatSlotTime(s.start_time)} – {formatSlotTime(s.end_time)}
              </span>
              <span
                className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                  s.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {s.is_available ? 'Available' : 'Booked'}
              </span>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(s)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(s)}
                  disabled={isDeletingId === s.id}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {isDeletingId === s.id ? 'Deleting...' : 'Delete'}
                </button>
              )}
              {onSlotSelect && s.is_available && (
                <button
                  type="button"
                  onClick={() => onSlotSelect(s)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
