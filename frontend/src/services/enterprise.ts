import apiClient from './api';
import type {
  EnterpriseCreateRequest,
  EnterpriseDetail,
  EnterpriseListResponse,
  EnterpriseMember,
  EnterpriseUpdateRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
} from '../types';
import type { ApiResponse } from '../types';

export interface BindEnterpriseWalletRequest {
  wallet_address: string;
  signature: string;
  challenge_token: string;
}

export interface WalletBindChallengeRequest {
  wallet_address: string;
}

export interface WalletBindChallengeResponse {
  challenge_token: string;
  wallet_address: string;
  message: string;
  expires_at: string;
}

function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (response.code !== 'SUCCESS') {
    throw new Error(response.message || 'Operation failed');
  }
  return response.data;
}

function normalizeEnterprisePayload<T extends { contactEmail?: string; contact_email?: string }>(
  data: T
): T & { contact_email?: string } {
  return {
    ...data,
    contact_email: data.contact_email ?? data.contactEmail,
  };
}

export const enterpriseService = {
  async getMyEnterprises(page = 1, pageSize = 20): Promise<EnterpriseListResponse> {
    const response = await apiClient.get<ApiResponse<EnterpriseListResponse>>('/enterprises', {
      params: { page, page_size: pageSize },
    });
    return handleApiResponse(response.data);
  },

  async getEnterprise(enterpriseId: string): Promise<EnterpriseDetail> {
    const response = await apiClient.get<ApiResponse<EnterpriseDetail>>(
      `/enterprises/${enterpriseId}`
    );
    return handleApiResponse(response.data);
  },

  async createEnterprise(data: EnterpriseCreateRequest): Promise<EnterpriseDetail> {
    const response = await apiClient.post<ApiResponse<EnterpriseDetail>>(
      '/enterprises',
      normalizeEnterprisePayload(data)
    );
    return handleApiResponse(response.data);
  },

  async updateEnterprise(
    enterpriseId: string,
    data: EnterpriseUpdateRequest
  ): Promise<EnterpriseDetail> {
    const response = await apiClient.put<ApiResponse<EnterpriseDetail>>(
      `/enterprises/${enterpriseId}`,
      normalizeEnterprisePayload(data)
    );
    return handleApiResponse(response.data);
  },

  async bindWallet(
    enterpriseId: string,
    data: BindEnterpriseWalletRequest
  ): Promise<EnterpriseDetail> {
    const response = await apiClient.post<ApiResponse<EnterpriseDetail>>(
      `/enterprises/${enterpriseId}/wallet`,
      data
    );
    return handleApiResponse(response.data);
  },

  async createWalletBindChallenge(
    enterpriseId: string,
    data: WalletBindChallengeRequest
  ): Promise<WalletBindChallengeResponse> {
    const response = await apiClient.post<ApiResponse<WalletBindChallengeResponse>>(
      `/enterprises/${enterpriseId}/wallet/challenge`,
      data
    );
    return handleApiResponse(response.data);
  },

  async deleteEnterprise(enterpriseId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<Record<string, unknown>>>(
      `/enterprises/${enterpriseId}`
    );
    handleApiResponse(response.data);
  },

  async getMembers(enterpriseId: string): Promise<EnterpriseMember[]> {
    const response = await apiClient.get<ApiResponse<EnterpriseMember[]>>(
      `/enterprises/${enterpriseId}/members`
    );
    return handleApiResponse(response.data);
  },

  async inviteMember(enterpriseId: string, data: InviteMemberRequest): Promise<EnterpriseMember> {
    const response = await apiClient.post<ApiResponse<EnterpriseMember>>(
      `/enterprises/${enterpriseId}/members`,
      data
    );
    return handleApiResponse(response.data);
  },

  async updateMemberRole(
    enterpriseId: string,
    userId: string,
    data: UpdateMemberRoleRequest
  ): Promise<EnterpriseMember> {
    const response = await apiClient.put<ApiResponse<EnterpriseMember>>(
      `/enterprises/${enterpriseId}/members/${userId}`,
      data
    );
    return handleApiResponse(response.data);
  },

  async removeMember(enterpriseId: string, userId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<Record<string, unknown>>>(
      `/enterprises/${enterpriseId}/members/${userId}`
    );
    handleApiResponse(response.data);
  },
};

export default enterpriseService;
