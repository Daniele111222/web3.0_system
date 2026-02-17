import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../../../services/auth';

/**
 * 邮箱验证状态响应
 */
export interface VerificationStatus {
  isVerified: boolean;
  email: string;
  hasPendingToken: boolean;
  pendingTokensCount: number;
}

/**
 * 邮箱验证Hook返回值
 */
export interface UseEmailVerificationReturn {
  status: VerificationStatus | null;
  loading: boolean;
  cooldown: number;
  fetchStatus: () => Promise<void>;
  sendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
}

/**
 * 邮箱验证Hook
 * 提供邮箱验证状态管理和操作功能
 */
export function useEmailVerification(): UseEmailVerificationReturn {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  /**
   * 获取验证状态
   */
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authService.getVerificationStatus();
      if (response.success && response.data) {
        setStatus({
          isVerified: response.data.is_verified,
          email: response.data.email,
          hasPendingToken: response.data.has_pending_token,
          pendingTokensCount: response.data.pending_tokens_count,
        });
      }
    } catch (error) {
      console.error('获取验证状态失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 发送验证邮件
   */
  const sendVerificationEmail = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (cooldown > 0) {
      return { success: false, error: `请等待 ${cooldown} 秒后重试` };
    }

    try {
      const response = await authService.sendVerificationEmail();
      if (response.success) {
        // 启动60秒冷却
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // 刷新状态
        await fetchStatus();

        return { success: true };
      } else {
        return { success: false, error: response.message || '发送失败' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '网络错误，请重试';
      return { success: false, error: errorMessage };
    }
  }, [cooldown, fetchStatus]);

  // 初始加载时获取状态
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    loading,
    cooldown,
    fetchStatus,
    sendVerificationEmail,
  };
}
