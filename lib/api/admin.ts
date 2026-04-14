import apiClient from './client';
import {
  ApiResponse,
  UserWithoutPassword,
  UpdateUserRoleDTO,
  ICourse,
} from '@/types';

/**
 * Admin API functions
 */
export const adminApi = {
  /**
   * Get all users
   */
  getAllUsers: async (): Promise<ApiResponse<UserWithoutPassword[]>> => {
    return apiClient.get<ApiResponse<UserWithoutPassword[]>>('/api/admin/users');
  },

  /**
   * Update user role
   */
  updateUserRole: async (
    userId: number,
    data: UpdateUserRoleDTO
  ): Promise<ApiResponse> => {
    return apiClient.put<ApiResponse>(`/api/admin/users/${userId}/role`, data);
  },

  /**
   * Delete user
   */
  deleteUser: async (userId: number): Promise<ApiResponse> => {
    return apiClient.delete<ApiResponse>(`/api/admin/users/${userId}`);
  },

  /**
   * Get all courses (admin view)
   */
  getAllCourses: async (): Promise<ApiResponse<ICourse[]>> => {
    return apiClient.get<ApiResponse<ICourse[]>>('/api/admin/courses');
  },
};
