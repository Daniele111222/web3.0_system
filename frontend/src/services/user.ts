import apiClient from './api';
import type { UserResponse } from './auth';

export interface UserProfileUpdateRequest {
  username?: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export const userService = {
  getCurrentProfile: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/users/me');
    return response.data;
  },

  updateCurrentProfile: async (data: UserProfileUpdateRequest): Promise<UserResponse> => {
    const response = await apiClient.put<UserResponse>('/users/me', data);
    return response.data;
  },
};

export default userService;
