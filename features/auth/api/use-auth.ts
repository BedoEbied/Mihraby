import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { LoginInput, RegisterInput, LoginResponse } from '@/types';
import { AuthClient } from '@/lib/auth/client';
import { useNotifications } from '@/lib/stores/notifications';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<LoginResponse, Error, LoginInput>({
    mutationFn: async (data) => {
      const response = await authApi.login(data);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Login failed');
      }
      return response.data;
    },
    onSuccess: (data) => {
      AuthClient.login('', data.user);
      queryClient.setQueryData(authKeys.me(), data.user);
      addNotification({
        type: 'success',
        title: 'Login successful',
        message: `Welcome back, ${data.user.name}!`,
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Login failed',
        message: error.message,
      });
    },
  });
};

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<LoginResponse, Error, RegisterInput>({
    mutationFn: async (data) => {
      const response = await authApi.register(data);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Registration failed');
      }
      return response.data;
    },
    onSuccess: (data) => {
      AuthClient.login('', data.user);
      queryClient.setQueryData(authKeys.me(), data.user);
      addNotification({
        type: 'success',
        title: 'Registration successful',
        message: `Welcome, ${data.user.name}!`,
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Registration failed',
        message: error.message,
      });
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation({
    mutationFn: async () => {
      await authApi.logout();
    },
    onSuccess: () => {
      AuthClient.logout();
      queryClient.clear();
      addNotification({
        type: 'info',
        title: 'Logged out',
        message: 'You have been logged out successfully.',
      });
    },
  });
};

// Get current user query
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};
