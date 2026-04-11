/**
 * Time Slots Feature - API Hooks
 * React Query hooks for time slot management
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import {
  ITimeSlot,
  CreateTimeSlotDTO,
  CreateTimeSlotsBulkDTO,
  UpdateTimeSlotDTO,
  ApiResponse,
} from '@/lib/types';
import { useNotifications } from '@/lib/stores/notifications';

type SlotListPayload = { slots: ITimeSlot[]; count: number };

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined || response.data === null) {
    throw new Error(response.error || response.message || 'Request failed');
  }
  return response.data;
}

const TIME_SLOTS_QUERY_KEYS = {
  all: ['time-slots'] as const,
  byCourse: (courseId: number) => ['time-slots', 'course', courseId] as const,
  available: (courseId: number) => ['time-slots', 'available', courseId] as const,
  detail: (id: number) => ['time-slots', id] as const,
};

/**
 * Instructor view — all slots for a course regardless of availability.
 */
export function useTimeSlots(courseId: number) {
  return useQuery({
    queryKey: TIME_SLOTS_QUERY_KEYS.byCourse(courseId),
    enabled: Number.isFinite(courseId) && courseId > 0,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SlotListPayload>>(
        `/api/instructor/courses/${courseId}/slots`
      );
      return unwrap(response).slots;
    },
  });
}

/**
 * Public student view — only available, future slots.
 */
export function useAvailableSlots(courseId: number) {
  return useQuery({
    queryKey: TIME_SLOTS_QUERY_KEYS.available(courseId),
    enabled: Number.isFinite(courseId) && courseId > 0,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SlotListPayload>>(
        `/api/courses/${courseId}/slots/available`
      );
      return unwrap(response).slots;
    },
  });
}

/**
 * Create a single slot on a course.
 */
export function useCreateTimeSlot(courseId: number) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<ITimeSlot, Error, Omit<CreateTimeSlotDTO, 'course_id'>>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<ITimeSlot>>(
        `/api/instructor/courses/${courseId}/slots`,
        data
      );
      return unwrap(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TIME_SLOTS_QUERY_KEYS.byCourse(courseId),
      });
      queryClient.invalidateQueries({
        queryKey: TIME_SLOTS_QUERY_KEYS.available(courseId),
      });
      addNotification({
        type: 'success',
        title: 'Time Slot Created',
        message: 'New time slot has been added',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error instanceof Error ? error.message : 'Unable to create time slot',
      });
    },
  });
}

/**
 * Bulk create slots on a course.
 */
export function useCreateTimeSlotsBulk(courseId: number) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<ITimeSlot[], Error, Omit<CreateTimeSlotsBulkDTO, 'course_id'>>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<SlotListPayload>>(
        `/api/instructor/courses/${courseId}/slots`,
        data
      );
      return unwrap(response).slots;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: TIME_SLOTS_QUERY_KEYS.byCourse(courseId),
      });
      queryClient.invalidateQueries({
        queryKey: TIME_SLOTS_QUERY_KEYS.available(courseId),
      });
      addNotification({
        type: 'success',
        title: 'Slots Created',
        message: `${created.length} time slots added`,
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error instanceof Error ? error.message : 'Unable to create time slots',
      });
    },
  });
}

/**
 * Update an existing slot.
 */
export function useUpdateTimeSlot(slotId: number) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<ITimeSlot, Error, UpdateTimeSlotDTO>({
    mutationFn: async (data) => {
      const response = await apiClient.put<ApiResponse<ITimeSlot>>(
        `/api/instructor/slots/${slotId}`,
        data
      );
      return unwrap(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_SLOTS_QUERY_KEYS.all });
      addNotification({
        type: 'success',
        title: 'Time Slot Updated',
        message: 'Time slot has been updated',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Unable to update time slot',
      });
    },
  });
}

/**
 * Delete a slot.
 */
export function useDeleteTimeSlot(slotId: number) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.delete<ApiResponse>(
        `/api/instructor/slots/${slotId}`
      );
      if (!response.success) {
        throw new Error(response.error || response.message || 'Failed to delete slot');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_SLOTS_QUERY_KEYS.all });
      addNotification({
        type: 'success',
        title: 'Time Slot Deleted',
        message: 'Time slot has been removed',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error instanceof Error ? error.message : 'Unable to delete time slot',
      });
    },
  });
}
