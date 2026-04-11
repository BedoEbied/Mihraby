/**
 * Bookings Feature - API Hooks
 * React Query hooks for booking management
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { IBooking, InitiateBookingDTO } from '@/lib/types';
import { useNotifications } from '@/lib/stores/notifications';

const BOOKINGS_QUERY_KEYS = {
  all: ['bookings'] as const,
  student: ['bookings', 'student'] as const,
  instructor: ['bookings', 'instructor'] as const,
  admin: ['bookings', 'admin'] as const,
  detail: (id: number) => ['bookings', id] as const,
};

/**
 * Hook to get current user's bookings
 */
export function useMyBookings(status?: 'upcoming' | 'past' | 'all') {
  return useQuery({
    queryKey: [...BOOKINGS_QUERY_KEYS.student, status || 'all'],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      const response = await apiClient.get<IBooking[]>(`/api/student/bookings${params}`);
      return response;
    },
  });
}

/**
 * Hook to get instructor's upcoming bookings
 */
export function useInstructorBookings() {
  return useQuery({
    queryKey: BOOKINGS_QUERY_KEYS.instructor,
    queryFn: async () => {
      const response = await apiClient.get<IBooking[]>('/api/instructor/bookings');
      return response;
    },
  });
}

/**
 * Hook to get all bookings (admin only)
 */
export function useAdminBookings(filters?: {
  user_id?: number;
  course_id?: number;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.user_id) queryParams.append('user_id', filters.user_id.toString());
  if (filters?.course_id) queryParams.append('course_id', filters.course_id.toString());
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  return useQuery({
    queryKey: [...BOOKINGS_QUERY_KEYS.admin, filters],
    queryFn: async () => {
      const response = await apiClient.get<IBooking[]>(
        `/api/admin/bookings?${queryParams.toString()}`
      );
      return response;
    },
  });
}

/**
 * Hook to initiate a new booking
 */
export function useInitiateBooking() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation({
    mutationFn: async (data: InitiateBookingDTO) => {
      return await apiClient.post<IBooking>('/api/bookings/initiate', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.student });
      addNotification({
        type: 'success',
        title: 'Booking Created',
        message: 'Please proceed to payment',
      });
      return data;
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Booking Failed',
        message: error instanceof Error ? error.message : 'Unable to create booking',
      });
    },
  });
}

/**
 * Hook to cancel a booking
 */
export function useCancelBooking(bookingId: number) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation({
    mutationFn: async () => {
      return await apiClient.put<IBooking>(`/api/bookings/${bookingId}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.student });
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.instructor });
      addNotification({
        type: 'success',
        title: 'Booking Cancelled',
        message: 'Your booking has been cancelled',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Cancel Failed',
        message: error instanceof Error ? error.message : 'Unable to cancel booking',
      });
    },
  });
}

/**
 * Hook to update booking status (instructor/admin only)
 */
export function useUpdateBookingStatus(bookingId: number) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation({
    mutationFn: async (status: 'confirmed' | 'cancelled' | 'completed' | 'no_show') => {
      return await apiClient.put<IBooking>(`/api/bookings/${bookingId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.instructor });
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.admin });
      addNotification({
        type: 'success',
        title: 'Booking Updated',
        message: 'Status has been updated',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Unable to update booking',
      });
    },
  });
}
