import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '@/lib/api';
import { CreateCourseDTO, UpdateCourseDTO, ICourse } from '@/types';
import { useNotifications } from '@/lib/stores/notifications';

// Query keys
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...courseKeys.lists(), filters] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: number) => [...courseKeys.details(), id] as const,
  instructor: (instructorId: number) => [...courseKeys.all, 'instructor', instructorId] as const,
};

// Get all courses
export const useCourses = () => {
  return useQuery({
    queryKey: courseKeys.lists(),
    queryFn: async () => {
      const response = await courseApi.getAllCourses();
      return response;
    },
  });
};

// Get course by ID
export const useCourse = (id: number) => {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: async () => {
      const response = await courseApi.getCourseById(id);
      return response;
    },
    enabled: !!id,
  });
};

// Get instructor courses
export const useInstructorCourses = () => {
  return useQuery({
    queryKey: courseKeys.lists(),
    queryFn: async () => {
      const response = await courseApi.getInstructorCourses();
      return response;
    },
  });
};

// Create course
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<ICourse, Error, CreateCourseDTO>({
    mutationFn: async (data) => {
      const response = await courseApi.createInstructorCourse(data);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create course');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      addNotification({
        type: 'success',
        title: 'Course created',
        message: 'Course has been created successfully.',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Failed to create course',
        message: error.message,
      });
    },
  });
};

// Update course
export const useUpdateCourse = (courseId: number) => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<ICourse, Error, UpdateCourseDTO>({
    mutationFn: async (data) => {
      const response = await courseApi.updateInstructorCourse(courseId, data);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update course');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      addNotification({
        type: 'success',
        title: 'Course updated',
        message: 'Course has been updated successfully.',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Failed to update course',
        message: error.message,
      });
    },
  });
};

// Enroll in course (student)
export const useEnrollInCourse = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<void, Error, number>({
    mutationFn: async (courseId) => {
      const response = await courseApi.enrollInCourse(courseId);
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to enroll');
      }
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      addNotification({
        type: 'success',
        title: 'Enrolled',
        message: 'You have been enrolled in the course.',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Enrollment failed',
        message: error.message,
      });
    },
  });
};

// Delete course
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<void, Error, number>({
    mutationFn: async (courseId) => {
      const response = await courseApi.deleteInstructorCourse(courseId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete course');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      addNotification({
        type: 'success',
        title: 'Course deleted',
        message: 'Course has been deleted successfully.',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Failed to delete course',
        message: error.message,
      });
    },
  });
};
