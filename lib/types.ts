// Frontend types are a re-export of the canonical backend types.
// The backend stores Date objects; the frontend receives ISO strings after JSON
// serialization. Components should accept `Date | string` when reading fields
// annotated below as `Date`, and parse with `new Date(value)` as needed.
//
// To add or modify a type, edit /types/index.ts — not this file.

export * from '@/types';

// Frontend-only types live below this line.

export interface AuthContextType {
  user: import('@/types').IUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role?: import('@/types').UserRole
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
