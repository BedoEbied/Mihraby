import apiClient from './client';
import {
  LoginDTO,
  RegisterDTO,
  LoginResponse,
  ApiResponse,
  UserWithoutPassword,
} from '@/types';

/**
 * Auth API functions
 */
export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterDTO): Promise<ApiResponse<LoginResponse>> => {
    return apiClient.post<ApiResponse<LoginResponse>>('/api/auth/register', data);
  },

  /**
   * Login user
   */
  login: async (data: LoginDTO): Promise<ApiResponse<LoginResponse>> => {
    return apiClient.post<ApiResponse<LoginResponse>>('/api/auth/login', data);
  },

  /**
   * Get current user
   */
  me: async (): Promise<UserWithoutPassword> => {
    const response = await apiClient.get<ApiResponse<{ user: UserWithoutPassword }>>('/api/auth/me');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch user');
    }
    return response.data.user;
  },

  /**
   * Logout user (client-side)
   */
  logout: async () => {
    await apiClient.post('/api/auth/logout');
    if (globalThis.window !== undefined) {
      localStorage.removeItem('user');
      globalThis.window.location.href = '/login';
    }
  },
};
