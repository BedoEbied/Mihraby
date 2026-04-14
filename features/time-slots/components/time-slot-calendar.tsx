'use client';

import { ITimeSlot } from '@/lib/types';
import { formatInCairo } from '@/lib/time';

type TimeSlotCalendarProps = {
  slots: ITimeSlot[];
  onSlotSelect?: (slot: ITimeSlot) => void;
  onEdit?: (slot: ITimeSlot) => void;
  onDelete?: (slot: ITimeSlot) => void;
  isDeletingId?: number | null;
};

function formatSlotTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return formatInCairo(date);
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
      <p className="text-sm text-[var(--color-text-muted)]">No time slots added yet. Create one to let students book sessions.</p>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] overflow-hidden">
      <ul className="divide-y divide-[var(--color-border)]">
        {slots.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-[var(--color-surface)]"
          >
            <div className="text-sm">
              <span className="font-medium text-[var(--color-text)]">
                {formatSlotTime(s.start_time)} – {formatSlotTime(s.end_time)}
              </span>
              <span
                className={`ms-2 rounded px-1.5 py-0.5 text-xs ${
                  s.is_available ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
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
                  className="text-sm text-[var(--color-accent)] hover:text-[var(--color-primary)] px-2 py-1.5"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(s)}
                  disabled={isDeletingId === s.id}
                  className="text-sm text-[var(--color-error)] hover:opacity-80 disabled:opacity-50 px-2 py-1.5"
                >
                  {isDeletingId === s.id ? 'Deleting...' : 'Delete'}
                </button>
              )}
              {onSlotSelect && s.is_available && (
                <button
                  type="button"
                  onClick={() => onSlotSelect(s)}
                  className="text-sm text-[var(--color-accent)] hover:text-[var(--color-primary)] px-2 py-1.5"
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
