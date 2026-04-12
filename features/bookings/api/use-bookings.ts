/**
 * Bookings Feature - API Hooks
 * React Query hooks for booking management
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type {
  IBooking,
  BookingWithDetails,
  InitiateBookingDTO,
  ApiResponse,
} from '@/lib/types';
import { useNotifications } from '@/lib/stores/notifications';

type BookingListPayload = { bookings: BookingWithDetails[]; count: number };

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined || response.data === null) {
    throw new Error(response.error || response.message || 'Request failed');
  }
  return response.data;
}

const BOOKINGS_QUERY_KEYS = {
  all: ['bookings'] as const,
  student: ['bookings', 'student'] as const,
  instructor: ['bookings', 'instructor'] as const,
  admin: ['bookings', 'admin'] as const,
  detail: (id: number) => ['bookings', id] as const,
};

export { BOOKINGS_QUERY_KEYS };

/**
 * Student's own bookings.
 */
export function useMyBookings(status?: 'upcoming' | 'past' | 'all') {
  return useQuery({
    queryKey: [...BOOKINGS_QUERY_KEYS.student, status || 'all'],
    queryFn: async () => {
      const params = status && status !== 'all' ? `?status=${status}` : '';
      const response = await apiClient.get<ApiResponse<BookingListPayload>>(
        `/api/student/bookings${params}`
      );
      return unwrap(response).bookings;
    },
  });
}

/**
 * Instructor's bookings across all their courses.
 */
export function useInstructorBookings() {
  return useQuery({
    queryKey: BOOKINGS_QUERY_KEYS.instructor,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<BookingListPayload>>(
        '/api/instructor/bookings'
      );
      return unwrap(response).bookings;
    },
  });
}

/**
 * Admin bookings list with filters.
 */
export function useAdminBookings(filters?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  return useQuery({
    queryKey: [...BOOKINGS_QUERY_KEYS.admin, filters],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<BookingListPayload>>(
        `/api/admin/bookings?${queryParams.toString()}`
      );
      return unwrap(response).bookings;
    },
  });
}

/**
 * Fetch a single booking by ID.
 */
export function useBookingDetail(bookingId: number) {
  return useQuery({
    queryKey: BOOKINGS_QUERY_KEYS.detail(bookingId),
    enabled: Number.isFinite(bookingId) && bookingId > 0,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<IBooking>>(
        `/api/bookings/${bookingId}`
      );
      return unwrap(response);
    },
  });
}

/**
 * Initiate a new booking (hold a slot).
 */
export function useInitiateBooking() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<IBooking, Error, InitiateBookingDTO>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<IBooking>>(
        '/api/bookings/initiate',
        data
      );
      return unwrap(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.student });
      // Also invalidate available slots so the picker reflects the hold
      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
      addNotification({
        type: 'success',
        title: 'Slot Reserved',
        message: 'Please complete your payment to confirm the booking',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Booking Failed',
        message: error instanceof Error ? error.message : 'Unable to book this slot',
      });
    },
  });
}

/**
 * Cancel a pending booking.
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<void, Error, number>({
    mutationFn: async (bookingId) => {
      const response = await apiClient.put<ApiResponse>(
        `/api/bookings/${bookingId}/cancel`,
        {}
      );
      if (!response.success) {
        throw new Error(response.error || response.message || 'Failed to cancel');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.student });
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.instructor });
      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
      addNotification({
        type: 'success',
        title: 'Booking Cancelled',
        message: 'Your booking has been cancelled and the slot released',
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
 * Update booking status (instructor/admin only).
 */
export function useUpdateBookingStatus(bookingId: number) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<void, Error, 'confirmed' | 'cancelled' | 'completed' | 'no_show'>({
    mutationFn: async (status) => {
      const response = await apiClient.put<ApiResponse>(
        `/api/bookings/${bookingId}/status`,
        { status }
      );
      if (!response.success) {
        throw new Error(response.error || response.message || 'Failed to update');
      }
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
