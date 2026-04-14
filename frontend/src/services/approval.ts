import apiClient from './api';
import type {
  ApprovalListParams,
  ApprovalListResponse,
  ApprovalDetail,
  Approval,
  ApprovalAttachment,
  ApprovalProcessRecord,
  ApprovalActionRequest,
  ApprovalActionResponse,
  ApprovalStatistics,
} from '../types/approval';

/**
 * 审批服务
 * 处理所有与审批相关的API请求
 */

function normalizeAttachments(
  attachments?: Array<Record<string, unknown>> | null
): ApprovalAttachment[] | null {
  if (!attachments) {
    return null;
  }

  return attachments.map((attachment) => ({
    fileId: String(attachment.fileId ?? attachment.file_id ?? ''),
    fileName: String(attachment.fileName ?? attachment.file_name ?? '附件'),
    fileUrl: String(attachment.fileUrl ?? attachment.file_url ?? ''),
    fileSize:
      typeof attachment.fileSize === 'number'
        ? attachment.fileSize
        : typeof attachment.file_size === 'number'
          ? attachment.file_size
          : undefined,
    fileType: String(attachment.fileType ?? attachment.file_type ?? ''),
  }));
}

function normalizeApproval(item: Record<string, unknown>): Approval {
  return {
    id: String(item.id ?? ''),
    type: String(item.type ?? ''),
    target_id: String(item.target_id ?? ''),
    target_type: String(item.target_type ?? ''),
    applicant_id: String(item.applicant_id ?? ''),
    status: String(item.status ?? ''),
    current_step: Number(item.current_step ?? 0),
    total_steps: Number(item.total_steps ?? 0),
    remarks: typeof item.remarks === 'string' ? item.remarks : '',
    attachments: normalizeAttachments(
      Array.isArray(item.attachments) ? (item.attachments as Array<Record<string, unknown>>) : null
    ),
    changes:
      item.changes && typeof item.changes === 'object'
        ? (item.changes as Record<string, unknown>)
        : null,
    created_at: String(item.created_at ?? ''),
    updated_at: String(item.updated_at ?? ''),
    completed_at: item.completed_at ? String(item.completed_at) : null,
    asset_id: item.asset_id ? String(item.asset_id) : undefined,
    asset_name: item.asset_name ? String(item.asset_name) : undefined,
    asset_type: item.asset_type ? String(item.asset_type) : undefined,
    enterprise_name: item.enterprise_name ? String(item.enterprise_name) : undefined,
  };
}

function normalizeApprovalDetail(item: Record<string, unknown>): ApprovalDetail {
  const processHistorySource = Array.isArray(item.processHistory)
    ? item.processHistory
    : Array.isArray(item.process_history)
      ? item.process_history
      : [];

  const processHistory: ApprovalProcessRecord[] = processHistorySource.map((record) => {
    const data = record as Record<string, unknown>;
    return {
      id: String(data.id ?? ''),
      step: Number(data.step ?? 0),
      action: String(data.action ?? ''),
      operator_id: String(data.operator_id ?? ''),
      operator_role: String(data.operator_role ?? ''),
      comment: typeof data.comment === 'string' ? data.comment : '',
      attachments: normalizeAttachments(
        Array.isArray(data.attachments) ? (data.attachments as Array<Record<string, unknown>>) : null
      ),
      created_at: String(data.created_at ?? ''),
    };
  });

  return {
    ...normalizeApproval(item),
    processHistory,
  };
}

function normalizeListResponse(data: Record<string, unknown>): ApprovalListResponse {
  const items = Array.isArray(data.items) ? data.items : [];
  return {
    total: Number(data.total ?? 0),
    page: Number(data.page ?? 1),
    pageSize: Number(data.page_size ?? data.pageSize ?? 20),
    items: items.map((item) => normalizeApproval(item as Record<string, unknown>)),
  };
}

function buildApprovalListParams(params?: ApprovalListParams) {
  if (!params) {
    return undefined;
  }

  return {
    page: params.page,
    page_size: params.pageSize,
    approval_type: params.type,
    status: params.status,
  };
}

/**
 * 获取待审批列表
 */
export async function getPendingApprovals(
  params?: ApprovalListParams
): Promise<ApprovalListResponse> {
  const response = await apiClient.get('/approvals/pending', {
    params: buildApprovalListParams(params),
  });
  return normalizeListResponse(response.data.data);
}

/**
 * 获取审批历史
 */
export async function getApprovalHistory(
  params?: ApprovalListParams
): Promise<ApprovalListResponse> {
  const response = await apiClient.get('/approvals/history', {
    params: buildApprovalListParams(params),
  });
  return normalizeListResponse(response.data.data);
}

/**
 * 获取审批详情
 */
export async function getApprovalDetail(approvalId: string): Promise<ApprovalDetail> {
  const response = await apiClient.get(`/approvals/${approvalId}`);
  return normalizeApprovalDetail(response.data.data);
}

/**
 * 审批操作
 */
export async function processApproval(
  approvalId: string,
  data: ApprovalActionRequest
): Promise<ApprovalActionResponse> {
  const response = await apiClient.post(`/approvals/${approvalId}/process`, data);
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
