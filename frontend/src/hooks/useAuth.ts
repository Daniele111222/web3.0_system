import { useState, useCallback } from 'react';
import { useAuthStore } from '../store';
import authService from '../services/auth';
import type { LoginRequest, RegisterRequest, WalletBindRequest } from '../services/auth';

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  bindWallet: (data: WalletBindRequest) => Promise<boolean>;
}

export const useAuth = (): UseAuthReturn => {
  const { user, isAuthenticated, setAuth, updateUser, clearAuth, refreshToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (data: LoginRequest): Promise<boolean> => {
      setIsLoading(true);
      try {
        const response = await authService.login(data);
        setAuth(response.user, response.tokens.access_token, response.tokens.refresh_token);
        return true;
      } catch {
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setAuth]
  );

  const register = useCallback(
    async (data: RegisterRequest): Promise<boolean> => {
      setIsLoading(true);
      try {
        const response = await authService.register(data);
        setAuth(response.user, response.tokens.access_token, response.tokens.refresh_token);
        return true;
      } catch {
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setAuth]
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // 忽略登出错误
    } finally {
      clearAuth();
      setIsLoading(false);
    }
  }, [refreshToken, clearAuth]);

  const bindWallet = useCallback(
    async (data: WalletBindRequest): Promise<boolean> => {
      setIsLoading(true);
      try {
        const updatedUser = await authService.bindWallet(data);
        updateUser(updatedUser);
        return true;
      } catch {
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [updateUser]
  );

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    register,
    logout,
    bindWallet,
  };
};
