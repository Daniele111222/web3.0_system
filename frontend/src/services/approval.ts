import apiClient from './api';
import type {
  ApprovalListParams,
  ApprovalListResponse,
  ApprovalDetail,
  ApprovalActionRequest,
  ApprovalActionResponse,
  ApprovalStatistics,
} from '../types/approval';

/**
 * 审批服务
 * 处理所有与审批相关的API请求
 */

/**
 * 获取待审批列表
 */
export async function getPendingApprovals(
  params?: ApprovalListParams
): Promise<ApprovalListResponse> {
  const response = await apiClient.get('/approvals/pending', { params });
  return response.data.data;
}

/**
 * 获取审批历史
 */
export async function getApprovalHistory(
  params?: ApprovalListParams
): Promise<ApprovalListResponse> {
  const response = await apiClient.get('/approvals/history', { params });
  return response.data.data;
}

/**
 * 获取审批详情
 */
export async function getApprovalDetail(approvalId: string): Promise<ApprovalDetail> {
  const response = await apiClient.get(`/approvals/${approvalId}`);
  return response.data.data;
}

/**
 * 审批操作
 */
export async function processApproval(
  approvalId: string,
  data: ApprovalActionRequest
): Promise<ApprovalActionResponse> {
  const response = await apiClient.post(`/approvals/${approvalId}/action`, data);
  return response.data.data;
}

/**
 * 批量审批
 */
export async function batchProcessApprovals(
  approvalIds: string[],
  action: 'approve' | 'reject',
  comment: string
): Promise<{ successCount: number; failedIds: string[] }> {
  const response = await apiClient.post('/approvals/batch-action', {
    approvalIds,
    action,
    comment,
  });
  return response.data.data;
}

/**
 * 获取审批统计
 */
export async function getApprovalStatistics(): Promise<ApprovalStatistics> {
  const response = await apiClient.get('/approvals/statistics');
  return response.data.data;
}

/**
 * 导出审批记录
 */
export async function exportApprovals(
  params?: Omit<ApprovalListParams, 'page' | 'pageSize'>
): Promise<Blob> {
  const response = await apiClient.get('/approvals/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
}
