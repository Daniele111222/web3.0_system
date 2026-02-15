import { notification } from 'antd';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface ErrorInfo {
  /** 错误消息 */
  message?: string;
  /** 错误描述 */
  description?: string;
}

const DEFAULT_ERROR_MESSAGE = '操作失败';
const DEFAULT_ERROR_DESCRIPTION = '系统繁忙，请稍后重试';

/**
 * 显示全局通知提示
 * 用于接口错误等全局提示场景
 */
export const showNotification = (type: NotificationType, info: ErrorInfo) => {
  notification[type]({
    message: info.message || DEFAULT_ERROR_MESSAGE,
    description: info.description || DEFAULT_ERROR_DESCRIPTION,
    placement: 'topRight',
    duration: 4,
  });
};

/**
 * 显示错误提示 - 主要用于接口错误
 */
export const showError = (info: ErrorInfo) => {
  showNotification('error', info);
};

/**
 * 显示成功提示
 */
export const showSuccess = (info: ErrorInfo) => {
  showNotification('success', info);
};

/**
 * 显示警告提示
 */
export const showWarning = (info: ErrorInfo) => {
  showNotification('warning', info);
};

/**
 * 显示信息提示
 */
export const showInfo = (info: ErrorInfo) => {
  showNotification('info', info);
};

/**
 * 从 axios 错误中提取错误信息并显示
 * 用于 API 请求错误的统一处理
 */
export const handleApiError = (error: unknown) => {
  let errorMessage = DEFAULT_ERROR_MESSAGE;
  let errorDescription = DEFAULT_ERROR_DESCRIPTION;

  if (error && typeof error === 'object') {
    const err = error as {
      response?: { data?: { detail?: string; message?: string } };
      message?: string;
    };

    // 优先使用后端返回的错误信息
    if (err.response?.data?.detail) {
      errorMessage = '请求失败';
      errorDescription = String(err.response.data.detail);
    } else if (err.response?.data?.message) {
      errorMessage = '请求失败';
      errorDescription = String(err.response.data.message);
    } else if (err.message) {
      errorMessage = '网络错误';
      errorDescription = String(err.message);
    }
  }

  showError({
    message: errorMessage,
    description: errorDescription,
  });

  // 返回错误信息，供调用方使用
  return { message: errorMessage, description: errorDescription };
};

/**
 * 手动触发错误提示
 * 用于非 axios 错误的场景
 */
export const triggerError = (message: string, description?: string) => {
  showError({ message, description });
};
