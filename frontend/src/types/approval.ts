/**
 * 审批类型定义
 * 包含审批流程、审批记录、审批历史等相关类型
 */

/**
 * 审批类型
 */
export type ApprovalType = 'enterprise' | 'member';

/**
 * 审批子类型
 */
export type ApprovalSubType = 'create' | 'update' | 'join';

/**
 * 审批状态
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'returned';

/**
 * 目标类型
 */
export type TargetType = 'enterprise' | 'member';

/**
 * 审批操作类型
 */
export type ApprovalAction = 'approve' | 'reject' | 'return';

/**
 * 审批优先级
 */
export type ApprovalPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * 申请人信息
 */
export interface ApplicantInfo {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
}

/**
 * 附件信息
 */
export interface ApprovalAttachment {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}

/**
 * 变更信息
 */
export interface ChangeInfo {
  old: string;
  new: string;
}

/**
 * 目标信息
 */
export interface TargetInfo {
  enterpriseId: string;
  enterpriseName: string;
  changes?: Record<string, ChangeInfo>;
  [key: string]: any;
}

/**
 * 操作人信息
 */
export interface OperatorInfo {
  userId: string;
  name: string;
  role: string;
}

/**
 * 审批记录
 */
export interface Approval {
  approvalId: string;
  type: ApprovalType;
  subType: ApprovalSubType;
  targetId: string;
  targetType: TargetType;
  applicant: ApplicantInfo;
  targetInfo: TargetInfo;
  status: ApprovalStatus;
  priority: ApprovalPriority;
  remarks: string;
  attachments: ApprovalAttachment[];
  applyTime: string;
  currentStep: number;
  totalSteps: number;
  updatedAt?: string;
  completedAt?: string;
}

/**
 * 审批流程记录
 */
export interface ApprovalProcessRecord {
  step: number;
  action: string;
  operator: OperatorInfo;
  time: string;
  comment: string;
  attachments?: ApprovalAttachment[];
}

/**
 * 审批详情
 */
export interface ApprovalDetail extends Approval {
  processHistory: ApprovalProcessRecord[];
}

/**
 * 审批列表请求参数
 */
export interface ApprovalListParams {
  page?: number;
  pageSize?: number;
  type?: ApprovalType;
  status?: ApprovalStatus;
  subType?: ApprovalSubType;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  priority?: ApprovalPriority;
}

/**
 * 审批列表响应
 */
export interface ApprovalListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: Approval[];
}

/**
 * 审批操作请求
 */
export interface ApprovalActionRequest {
  action: ApprovalAction;
  comment: string;
  attachments?: ApprovalAttachment[];
}

/**
 * 审批操作响应
 */
export interface ApprovalActionResponse {
  approvalId: string;
  action: ApprovalAction;
  operator: OperatorInfo;
  actionTime: string;
  comment: string;
  result: {
    targetId: string;
    targetType: TargetType;
    oldStatus: ApprovalStatus;
    newStatus: ApprovalStatus;
  };
}

/**
 * 审批统计
 */
export interface ApprovalStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  returned: number;
  todayPending: number;
  urgentPending: number;
}
