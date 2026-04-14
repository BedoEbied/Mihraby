'use client';

import { ITimeSlot } from '@/lib/types';
import { formatInCairo } from '@/lib/time';

type SlotPickerProps = {
  courseId: number;
  slots: ITimeSlot[];
  onSelect?: (slot: ITimeSlot) => void;
  selectedSlotId?: number | null;
};

function formatSlotTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return formatInCairo(date);
}

export default function SlotPicker({
  courseId,
  slots,
  onSelect,
  selectedSlotId = null,
}: SlotPickerProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        No available times for this course right now. The instructor may add more soon.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">
        Available times ({slots.length})
      </h3>
      <ul className="space-y-2">
        {slots.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect?.(s)}
              className={`w-full rounded-lg border px-3 py-2 text-start text-sm transition-colors ${
                selectedSlotId === s.id
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
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
