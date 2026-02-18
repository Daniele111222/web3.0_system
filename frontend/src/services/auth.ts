import apiClient from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserResponse {
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

export interface AuthResponse {
  user: UserResponse;
  tokens: TokenResponse;
}

export interface WalletBindRequest {
  wallet_address: string;
  signature: string;
  message: string;
}

/**
 * 忘记密码请求
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * 重置密码请求
 */
export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

/**
 * 通用API响应
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  bindWallet: async (data: WalletBindRequest): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>('/auth/bind-wallet', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refresh_token: refreshToken });
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/auth/me');
    return response.data;
  },

  /**
   * 请求密码重置
   * 发送密码重置邮件到指定邮箱
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/auth/forgot-password', data);
    return response.data;
  },

  /**
   * 验证重置令牌
   * 检查密码重置令牌是否有效
   */
  verifyResetToken: async (token: string): Promise<ApiResponse> => {
    const response = await apiClient.get<ApiResponse>(
      `/auth/verify-reset-token?token=${encodeURIComponent(token)}`
    );
    return response.data;
  },

  /**
   * 重置密码
   * 使用重置令牌设置新密码
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/auth/reset-password', data);
    return response.data;
  },

  /**
   * 获取邮箱验证状态
   */
  getVerificationStatus: async (): Promise<ApiResponse> => {
    const response = await apiClient.get<ApiResponse>('/auth/verification-status');
    return response.data;
  },

  /**
   * 发送验证邮件
   */
  sendVerificationEmail: async (): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/auth/send-verification-email');
    return response.data;
  },
};

export default authService;
