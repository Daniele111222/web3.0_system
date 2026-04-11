import { notification } from 'antd';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface ErrorInfo {
  message?: string;
  description?: string;
}

const DEFAULT_ERROR_MESSAGE = '操作失败';
const DEFAULT_ERROR_DESCRIPTION = '系统繁忙，请稍后重试';

export const extractApiErrorInfo = (error: unknown): Required<ErrorInfo> => {
  let message = DEFAULT_ERROR_MESSAGE;
  let description = DEFAULT_ERROR_DESCRIPTION;

  if (error && typeof error === 'object') {
    const err = error as {
      response?: { data?: { detail?: string; message?: string } };
      message?: string;
    };

    if (err.response?.data?.detail) {
      message = '请求失败';
      description = String(err.response.data.detail);
    } else if (err.response?.data?.message) {
      message = '请求失败';
      description = String(err.response.data.message);
    } else if (err.message) {
      message = '网络错误';
      description = String(err.message);
    }
  }

  return { message, description };
};

export const showNotification = (type: NotificationType, info: ErrorInfo) => {
  notification[type]({
    message: info.message || DEFAULT_ERROR_MESSAGE,
    description: info.description || DEFAULT_ERROR_DESCRIPTION,
    placement: 'topRight',
    duration: 4,
  });
};

export const showError = (info: ErrorInfo) => {
  showNotification('error', info);
};

export const showSuccess = (info: ErrorInfo) => {
  showNotification('success', info);
};

export const showWarning = (info: ErrorInfo) => {
  showNotification('warning', info);
};

export const showInfo = (info: ErrorInfo) => {
  showNotification('info', info);
};

export const handleApiError = (error: unknown) => {
  const info = extractApiErrorInfo(error);

  showError(info);

  return info;
};

export const triggerError = (message: string, description?: string) => {
  showError({ message, description });
};
