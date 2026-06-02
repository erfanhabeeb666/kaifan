import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  fullName: string | null;
  role: string | null;
  employeeId: number | null;
  isAuthenticated: boolean;
  setAuth: (data: {
    accessToken: string;
    refreshToken: string;
    username: string;
    fullName: string;
    role: string;
    employeeId: number | null;
  }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      username: null,
      fullName: null,
      role: null,
      employeeId: null,
      isAuthenticated: false,
      setAuth: (data) =>
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          username: data.username,
          fullName: data.fullName,
          role: data.role,
          employeeId: data.employeeId,
          isAuthenticated: true,
        }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          username: null,
          fullName: null,
          role: null,
          employeeId: null,
          isAuthenticated: false,
        }),
      isAdmin: () => get().role === 'ROLE_ADMIN',
    }),
    {
      name: 'kaifan-auth',
    }
  )
);
