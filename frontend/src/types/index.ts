// 资产类型
export type AssetType = 'PATENT' | 'TRADEMARK' | 'COPYRIGHT' | 'TRADE_SECRET' | 'DIGITAL_WORK';
export type LegalStatus = 'PENDING' | 'GRANTED' | 'EXPIRED';
export type AssetStatus = 'DRAFT' | 'MINTED' | 'TRANSFERRED' | 'LICENSED' | 'STAKED';

export interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  ipfs_cid: string;
  file_size: number;
  uploaded_at: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  description: string;
  creator: string;
  creation_date: string;
  legal_status: LegalStatus;
  application_number?: string;
  attachments: Attachment[];
  metadata: Record<string, unknown>;
  nft_token_id?: string;
  nft_contract_address?: string;
  status: AssetStatus;
  created_at: string;
  updated_at: string;
}

// NFT 类型
export type NFTEventType = 'MINT' | 'TRANSFER' | 'LICENSE' | 'STAKE' | 'UNSTAKE';

export interface NFTEvent {
  event_type: NFTEventType;
  timestamp: string;
  transaction_hash: string;
  from_address?: string;
  to_address?: string;
  details: Record<string, unknown>;
}

// API 响应类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 通用 API 响应格式 (后端返回格式: code, message, data)
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  code: string;
  data: T;
}

// 用户类型
export interface User {
  id: string;
  email: string;
  name: string;
  wallet_address?: string;
  email_verified: boolean;
}

// ============================================
// 企业类型 - 统一使用 enterprise.ts 中的定义
// ============================================

// 从 enterprise.ts 重新导出所有企业相关类型
export type {
  EnterpriseStatus,
  EnterpriseRole,
  MemberStatus,
  MemberUser,
  EnterpriseMember,
  Enterprise,
  EnterpriseDetail,
  EnterpriseListResponse,
  EnterpriseCreateRequest,
  EnterpriseUpdateRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  EnterpriseSettings,
} from './enterprise';

// 为保持向后兼容，定义 MemberRole 类型
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

// 为保持向后兼容，定义简化的 EnterpriseMember 接口
export interface SimpleEnterpriseMember {
  id: string;
  user_id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: MemberRole;
  joined_at: string;
}

// 为保持向后兼容，定义简化的 Enterprise 接口
export interface SimpleEnterprise {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  wallet_address?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  member_count: number;
}

// 为保持向后兼容，定义简化的 EnterpriseDetail 接口
export interface SimpleEnterpriseDetail extends SimpleEnterprise {
  members: SimpleEnterpriseMember[];
}
