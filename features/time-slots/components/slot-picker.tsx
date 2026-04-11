'use client';

import { ITimeSlot } from '@/lib/types';

type SlotPickerProps = {
  courseId: number;
  slots: ITimeSlot[];
  onSelect?: (slot: ITimeSlot) => void;
  selectedSlotId?: number | null;
};

function formatSlotTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function SlotPicker({
  courseId,
  slots,
  onSelect,
  selectedSlotId = null,
}: SlotPickerProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No available slots for this course right now. Check back later.
      </p>
    );
  }

  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Available times ({slots.length})
      </h3>
      <ul className="space-y-2">
        {slots.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect?.(s)}
              className={`w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
                selectedSlotId === s.id
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              {formatSlotTime(s.start_time)} – {formatSlotTime(s.end_time)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
