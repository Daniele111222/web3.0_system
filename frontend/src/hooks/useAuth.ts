import { useState, useCallback } from 'react';
import { useAuthStore } from '../store';
import authService from '../services/auth';
import type { LoginRequest, RegisterRequest, WalletBindRequest } from '../services/auth';

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  bindWallet: (data: WalletBindRequest) => Promise<boolean>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const { user, isAuthenticated, setAuth, updateUser, clearAuth, refreshToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (data: LoginRequest): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.login(data);
        setAuth(response.user, response.tokens.access_token, response.tokens.refresh_token);
        return true;
      } catch (err: unknown) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
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
      setError(null);
      try {
        const response = await authService.register(data);
        setAuth(response.user, response.tokens.access_token, response.tokens.refresh_token);
        return true;
      } catch (err: unknown) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
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
      // Ignore logout errors
    } finally {
      clearAuth();
      setIsLoading(false);
    }
  }, [refreshToken, clearAuth]);

  const bindWallet = useCallback(
    async (data: WalletBindRequest): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedUser = await authService.bindWallet(data);
        updateUser(updatedUser);
        return true;
      } catch (err: unknown) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [updateUser]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    bindWallet,
    clearError,
  };
};

function extractErrorMessage(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: unknown }).response === 'object' &&
    (err as { response?: { data?: unknown } }).response !== null
  ) {
    const response = (err as { response: { data?: unknown } }).response;
    if (typeof response.data === 'object' && response.data !== null && 'detail' in response.data) {
      const detail = (response.data as { detail: unknown }).detail;
      if (typeof detail === 'string') {
        return detail;
      }
      if (typeof detail === 'object' && detail !== null && 'message' in detail) {
        return (detail as { message: string }).message;
      }
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return '操作失败，请重试';
}
