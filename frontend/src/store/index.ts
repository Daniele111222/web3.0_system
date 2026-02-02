import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  wallet_address?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },
      updateUser: (user) => set({ user }),
      clearAuth: () => {
        localStorage.removeItem('access_token');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface Web3State {
  account: string | null;
  isConnected: boolean;
  chainId: number | null;
  setConnection: (account: string, chainId: number) => void;
  clearConnection: () => void;
}

export const useWeb3Store = create<Web3State>()((set) => ({
  account: null,
  isConnected: false,
  chainId: null,
  setConnection: (account, chainId) =>
    set({
      account,
      isConnected: true,
      chainId,
    }),
  clearConnection: () =>
    set({
      account: null,
      isConnected: false,
      chainId: null,
    }),
}));

// Enterprise Store
interface EnterpriseState {
  enterprises: import('../types').Enterprise[];
  currentEnterprise: import('../types').EnterpriseDetail | null;
  isLoading: boolean;
  error: string | null;
  setEnterprises: (enterprises: import('../types').Enterprise[]) => void;
  setCurrentEnterprise: (enterprise: import('../types').EnterpriseDetail | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearEnterprise: () => void;
}

export const useEnterpriseStore = create<EnterpriseState>()((set) => ({
  enterprises: [],
  currentEnterprise: null,
  isLoading: false,
  error: null,
  setEnterprises: (enterprises) => set({ enterprises }),
  setCurrentEnterprise: (enterprise) => set({ currentEnterprise: enterprise }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearEnterprise: () =>
    set({
      enterprises: [],
      currentEnterprise: null,
      error: null,
    }),
}));
