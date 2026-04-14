'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserWithoutPassword, UserRole } from '@/types';
import { AuthClient } from '@/lib/auth/client';

interface AuthContextType {
  user: UserWithoutPassword | null;
  token: string | null;
  login: (user: UserWithoutPassword, token?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<{ user: UserWithoutPassword | null; token: string | null }>(() => ({
    user: AuthClient.getUser(),
    token: null,
  }));
  const [isLoading] = useState(false);

  // Listen for auth changes (both cross-tab and same-tab)
  useEffect(() => {
    const handleAuthChange = () => {
      setAuthState({
        user: AuthClient.getUser(),
        token: null,
      });
    };

    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const login = (newUser: UserWithoutPassword, newToken?: string) => {
    AuthClient.login(newToken ?? '', newUser);
    setAuthState({ token: null, user: newUser });
  };

  const logout = () => {
    AuthClient.logout();
    setAuthState({ token: null, user: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const isAuthenticated = !!authState.user;

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        token: authState.token,
        login,
        logout,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Role-based hooks
export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      globalThis.window.location.href = '/login';
    }

    if (!isLoading && isAuthenticated && allowedRoles && user) {
      if (!allowedRoles.includes(user.role)) {
        globalThis.window.location.href = '/unauthorized';
      }
    }
  }, [isLoading, isAuthenticated, allowedRoles, user]);

  return { user, isLoading };
}
