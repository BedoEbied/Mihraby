/**
 * Centralized client-side authentication utilities
 * Client-side auth convenience helpers.
 * Token is stored in httpOnly cookies (server-issued); we only cache user info client-side.
 */

import { UserWithoutPassword } from '@/types';

export const AuthClient = {
  // Token management
  getToken(): string | null {
    // Token is kept in httpOnly cookies; no client storage
    return null;
  },

  setToken(token: string): void {
    // no-op for cookie-based auth
    void token;
  },

  removeToken(): void {
    // no-op for cookie-based auth
  },

  // User management
  getUser(): UserWithoutPassword | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as UserWithoutPassword;
    } catch {
      return null;
    }
  },

  setUser(user: UserWithoutPassword): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  },

  removeUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
  },

  // Combined auth actions
  login(token: string, user: UserWithoutPassword): void {
    void token; // cookie-based auth
    this.setUser(user);
  },

  logout(): void {
    this.removeUser();
  },

  // Auth state check
  isAuthenticated(): boolean {
    return !!this.getUser();
  },

  // Clear all auth data
  clearAll(): void {
    this.removeUser();
  }
};
