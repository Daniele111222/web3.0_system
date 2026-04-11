import axios from 'axios';
import { handleApiError } from '@/components/common/ErrorNotification';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isAuthPageRequest = (url?: string) =>
  typeof url === 'string' && (url.includes('/auth/login') || url.includes('/auth/register'));

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuthPageRequest(error.config?.url)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('auth-storage');
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    } else if (!isAuthPageRequest(error.config?.url)) {
      handleApiError(error);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
