import apiClient from './api';
import type {
  EnterpriseDetail,
  EnterpriseListResponse,
  EnterpriseCreateRequest,
  EnterpriseUpdateRequest,
  EnterpriseMember,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
} from '../types';
import type { ApiResponse } from '../types';

/**
 * 处理 API 响应，检查业务状态码
 * 后端返回格式: { success, message, code, data }
 * 如果 code 不是 SUCCESS，抛出错误
 */
function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (response.code !== 'SUCCESS') {
    throw new Error(response.message || '操作失败');
  }
  return response.data;
}

export const enterpriseService = {
  // 获取当前用户的企业列表
  async getMyEnterprises(page = 1, pageSize = 20): Promise<EnterpriseListResponse> {
    const response = await apiClient.get<ApiResponse<EnterpriseListResponse>>('/enterprises', {
      params: { page, page_size: pageSize },
    });
    return handleApiResponse(response.data);
  },

  // 获取企业详情
  async getEnterprise(enterpriseId: string): Promise<EnterpriseDetail> {
    const response = await apiClient.get<ApiResponse<EnterpriseDetail>>(
      `/enterprises/${enterpriseId}`
    );
    return handleApiResponse(response.data);
  },

  // 创建企业
  async createEnterprise(data: EnterpriseCreateRequest): Promise<EnterpriseDetail> {
    const response = await apiClient.post<ApiResponse<EnterpriseDetail>>('/enterprises', data);
    return handleApiResponse(response.data);
  },

  // 更新企业
  async updateEnterprise(
    enterpriseId: string,
    data: EnterpriseUpdateRequest
  ): Promise<EnterpriseDetail> {
    const response = await apiClient.put<ApiResponse<EnterpriseDetail>>(
      `/enterprises/${enterpriseId}`,
      data
    );
    return handleApiResponse(response.data);
  },

  // 删除企业
  async deleteEnterprise(enterpriseId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<Record<string, unknown>>>(
      `/enterprises/${enterpriseId}`
    );
    handleApiResponse(response.data);
  },

  // 获取企业成员列表
  async getMembers(enterpriseId: string): Promise<EnterpriseMember[]> {
    const response = await apiClient.get<ApiResponse<EnterpriseMember[]>>(
      `/enterprises/${enterpriseId}/members`
    );
    return handleApiResponse(response.data);
  },

  // 邀请成员
  async inviteMember(enterpriseId: string, data: InviteMemberRequest): Promise<EnterpriseMember> {
    const response = await apiClient.post<ApiResponse<EnterpriseMember>>(
      `/enterprises/${enterpriseId}/members`,
      data
    );
    return handleApiResponse(response.data);
  },

  // 更新成员角色
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

  // 移除成员
  async removeMember(enterpriseId: string, userId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<Record<string, unknown>>>(
      `/enterprises/${enterpriseId}/members/${userId}`
    );
    handleApiResponse(response.data);
  },
};

export default enterpriseService;
