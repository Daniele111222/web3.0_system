import apiClient from './api';
import type {
  Enterprise,
  EnterpriseDetail,
  EnterpriseListResponse,
  EnterpriseCreateRequest,
  EnterpriseUpdateRequest,
  EnterpriseMember,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
} from '../types';

export const enterpriseService = {
  // 获取当前用户的企业列表
  async getMyEnterprises(page = 1, pageSize = 20): Promise<EnterpriseListResponse> {
    const response = await apiClient.get<EnterpriseListResponse>('/enterprises', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  // 获取企业详情
  async getEnterprise(enterpriseId: string): Promise<EnterpriseDetail> {
    const response = await apiClient.get<EnterpriseDetail>(`/enterprises/${enterpriseId}`);
    return response.data;
  },

  // 创建企业
  async createEnterprise(data: EnterpriseCreateRequest): Promise<EnterpriseDetail> {
    const response = await apiClient.post<EnterpriseDetail>('/enterprises', data);
    return response.data;
  },

  // 更新企业
  async updateEnterprise(
    enterpriseId: string,
    data: EnterpriseUpdateRequest
  ): Promise<EnterpriseDetail> {
    const response = await apiClient.put<EnterpriseDetail>(`/enterprises/${enterpriseId}`, data);
    return response.data;
  },

  // 删除企业
  async deleteEnterprise(enterpriseId: string): Promise<void> {
    await apiClient.delete(`/enterprises/${enterpriseId}`);
  },

  // 获取企业成员列表
  async getMembers(enterpriseId: string): Promise<EnterpriseMember[]> {
    const response = await apiClient.get<EnterpriseMember[]>(
      `/enterprises/${enterpriseId}/members`
    );
    return response.data;
  },

  // 邀请成员
  async inviteMember(
    enterpriseId: string,
    data: InviteMemberRequest
  ): Promise<EnterpriseMember> {
    const response = await apiClient.post<EnterpriseMember>(
      `/enterprises/${enterpriseId}/members`,
      data
    );
    return response.data;
  },

  // 更新成员角色
  async updateMemberRole(
    enterpriseId: string,
    userId: string,
    data: UpdateMemberRoleRequest
  ): Promise<EnterpriseMember> {
    const response = await apiClient.put<EnterpriseMember>(
      `/enterprises/${enterpriseId}/members/${userId}`,
      data
    );
    return response.data;
  },

  // 移除成员
  async removeMember(enterpriseId: string, userId: string): Promise<void> {
    await apiClient.delete(`/enterprises/${enterpriseId}/members/${userId}`);
  },
};

export default enterpriseService;
