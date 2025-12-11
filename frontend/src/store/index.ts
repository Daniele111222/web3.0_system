import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  wallet_address?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
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
