'use client';

import { useState } from 'react';
import {
  TimeSlotForm,
  TimeSlotCalendar,
} from '@/features/time-slots/components';
import {
  useTimeSlots,
  useCreateTimeSlot,
  useUpdateTimeSlot,
  useDeleteTimeSlot,
} from '@/features/time-slots/api';
import type { ITimeSlot, CreateTimeSlotDTO } from '@/lib/types';

type CourseTimeSlotsManagerProps = {
  courseId: number;
};

export default function CourseTimeSlotsManager({ courseId }: CourseTimeSlotsManagerProps) {
  const { data: slots = [], isLoading, error } = useTimeSlots(courseId);
  const createSlot = useCreateTimeSlot(courseId);
  const updateSlot = useUpdateTimeSlot();
  const deleteSlot = useDeleteTimeSlot();

  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ITimeSlot | null>(null);
  const [deletingSlotId, setDeletingSlotId] = useState<number | null>(null);

  const handleCreateSubmit = (data: CreateTimeSlotDTO) => {
    createSlot.mutate(data, {
      onSuccess: () => {
        setShowForm(false);
      },
    });
  };

  const handleEdit = (slot: ITimeSlot) => {
    setEditingSlot(slot);
  };

  const handleEditSubmit = (data: CreateTimeSlotDTO) => {
    if (!editingSlot) return;
    updateSlot.mutate(
      {
        slotId: editingSlot.id,
        start_time: data.start_time,
        end_time: data.end_time,
      },
      {
        onSuccess: () => {
          setEditingSlot(null);
        },
      }
    );
  };

  const handleDelete = (slot: ITimeSlot) => {
    if (!confirm('Remove this time slot?')) return;
    setDeletingSlotId(slot.id);
    deleteSlot.mutate(slot.id, {
      onSettled: () => setDeletingSlotId(null),
    });
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading slots...</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-red-600">
        Failed to load slots: {error.message}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Time slots</h3>
        {!showForm && !editingSlot && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add slot
          </button>
        )}
      </div>

      {showForm && (
        <TimeSlotForm
          courseId={courseId}
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowForm(false)}
          isPending={createSlot.isPending}
        />
      )}

      {editingSlot && (
        <TimeSlotForm
          courseId={courseId}
          slot={editingSlot}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingSlot(null)}
          isPending={updateSlot.isPending}
        />
      )}

      <TimeSlotCalendar
        slots={slots}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeletingId={deletingSlotId}
      />
    </div>
  );
}
