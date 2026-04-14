import apiClient from './client';
import {
  ApiResponse,
  ICourse,
  CreateCourseDTO,
  UpdateCourseDTO,
  CourseWithInstructor,
  EnrollmentWithDetails,
} from '@/types';

/**
 * Course API functions
 */
export const courseApi = {
  /**
   * Get all published courses (student view)
   */
  getAllCourses: async (): Promise<ApiResponse<CourseWithInstructor[]>> => {
    return apiClient.get<ApiResponse<CourseWithInstructor[]>>('/api/student/courses');
  },

  /**
   * Get course by ID
   */
  getCourseById: async (id: number): Promise<ApiResponse<CourseWithInstructor>> => {
    return apiClient.get<ApiResponse<CourseWithInstructor>>(`/api/student/courses/${id}`);
  },

  /**
   * Enroll in a course (student)
   */
  enrollInCourse: async (courseId: number): Promise<ApiResponse> => {
    return apiClient.post<ApiResponse>(`/api/student/enroll/${courseId}`);
  },

  /**
   * Get enrolled courses (student)
   */
  getEnrolledCourses: async (): Promise<ApiResponse<CourseWithInstructor[]>> => {
    return apiClient.get<ApiResponse<CourseWithInstructor[]>>('/api/student/my-courses');
  },

  /**
   * Create new course (instructor)
   */
  createInstructorCourse: async (data: CreateCourseDTO): Promise<ApiResponse<ICourse>> => {
    return apiClient.post<ApiResponse<ICourse>>('/api/instructor/courses', data);
  },

  /**
   * Update course (instructor)
   */
  updateInstructorCourse: async (
    id: number,
    data: UpdateCourseDTO
  ): Promise<ApiResponse<ICourse>> => {
    return apiClient.put<ApiResponse<ICourse>>(`/api/instructor/courses/${id}`, data);
  },

  /**
   * Delete course (instructor)
   */
  deleteInstructorCourse: async (id: number): Promise<ApiResponse> => {
    return apiClient.delete<ApiResponse>(`/api/instructor/courses/${id}`);
  },

  /**
   * Get instructor's courses
   */
  getInstructorCourses: async (): Promise<ApiResponse<ICourse[]>> => {
    return apiClient.get<ApiResponse<ICourse[]>>('/api/instructor/courses');
  },

  /**
   * Get course enrollments (instructor)
   */
  getCourseEnrollments: async (
    courseId: number
  ): Promise<ApiResponse<EnrollmentWithDetails[]>> => {
    return apiClient.get<ApiResponse<EnrollmentWithDetails[]>>(
      `/api/instructor/courses/${courseId}/enrollments`
    );
  },
};
