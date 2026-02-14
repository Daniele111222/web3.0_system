// 企业相关类型定义

/**
 * 企业状态
 */
export type EnterpriseStatus = 'active' | 'pending' | 'inactive';

/**
 * 成员角色
 */
export type EnterpriseRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * 成员状态
 */
export type MemberStatus = 'active' | 'pending' | 'inactive';

/**
 * 企业成员用户信息
 */
export interface MemberUser {
  /** 用户ID */
  id: string;
  /** 用户邮箱 */
  email: string;
  /** 用户姓名 */
  name: string;
  /** 用户头像 */
  avatar?: string | null;
}

/**
 * 企业成员
 * 与 types/index.ts 中的 EnterpriseMember 保持兼容
 */
export interface EnterpriseMember {
  /** 成员记录ID */
  id: string;
  /** 企业ID - 两种命名风格兼容 */
  enterpriseId?: string;
  enterprise_id?: string;
  /** 用户ID - 两种命名风格兼容 */
  userId?: string;
  user_id?: string;
  /** 成员角色 */
  role: EnterpriseRole;
  /** 成员状态 - 可选 */
  status?: MemberStatus;
  /** 加入时间 - 两种命名风格兼容 */
  joinedAt?: string;
  joined_at?: string;
  /** 用户信息 - 可选 */
  user?: MemberUser;
  /** 兼容 index.ts 的字段 */
  username?: string;
  email?: string;
  userEmail?: string;
  full_name?: string;
  avatar_url?: string;
}

/**
 * 企业设置
 */
export interface EnterpriseSettings {
  /** 成员加入需要审批 */
  requireApproval?: boolean;
  /** 允许公开查看 */
  allowPublicView?: boolean;
  /** 默认成员角色 */
  defaultMemberRole?: EnterpriseRole;
  /** 通知设置 */
  notificationSettings?: {
    emailEnabled?: boolean;
    newMemberAlert?: boolean;
    roleChangeAlert?: boolean;
  };
}

/**
 * 企业信息
 * 统一的 Enterprise 类型，合并了 enterprise.ts 和 index.ts 的定义
 */
export interface Enterprise {
  /** 企业ID */
  id: string;
  /** 企业名称 */
  name: string;
  /** 企业描述 - 可选 */
  description?: string;
  /** 企业地址 - 可选 */
  address?: string;
  /** 联系邮箱 - 两种命名风格兼容 */
  contactEmail?: string;
  contact_email?: string;
  /** 联系电话 - 可选 */
  contactPhone?: string;
  /** 官方网站 - 可选 */
  website?: string;
  /** 所属行业 - 可选 */
  industry?: string;
  /** 企业规模 - 可选 */
  scale?: string;
  /** 企业状态 - 两种表示方式兼容 */
  status?: EnterpriseStatus;
  is_active?: boolean;
  /** 兼容 isActive 属性 */
  isActive?: boolean;
  /** Logo URL - 可选 */
  logo_url?: string;
  /** 钱包地址 - 可选 */
  wallet_address?: string;
  /** 是否已验证 - 可选 */
  is_verified?: boolean;
  /** 成员数量 - 可选 */
  member_count?: number;
  /** 创建时间 - 两种命名风格兼容 */
  createdAt?: string;
  created_at?: string;
  /** 更新时间 - 两种命名风格兼容 */
  updatedAt?: string;
  updated_at?: string;
  /** 成员列表 - 仅在企业详情中包含 */
  members?: EnterpriseMember[];
  /** 企业设置 - 仅在企业详情中包含 */
  settings?: EnterpriseSettings;
}

/**
 * 企业详情 - 包含成员列表
 * 与 Enterprise 类型兼容，确保 members 字段存在
 */
export interface EnterpriseDetail extends Enterprise {
  members: EnterpriseMember[];
}

/**
 * 企业列表响应
 */
export interface EnterpriseListResponse {
  items: Enterprise[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

/**
 * 创建企业请求
 * 合并了两种命名风格的字段
 */
export interface EnterpriseCreateRequest {
  /** 企业名称 - 必填 */
  name: string;
  /** 企业描述 - 可选 */
  description?: string;
  /** 企业地址 - 可选 */
  address?: string;
  /** 联系邮箱 - 两种命名风格兼容 */
  contactEmail?: string;
  contact_email?: string;
  /** 联系电话 - 可选 */
  contactPhone?: string;
  /** 官方网站 - 可选 */
  website?: string;
  /** 所属行业 - 可选 */
  industry?: string;
  /** 企业规模 - 可选 */
  scale?: string;
  /** Logo URL - 可选 */
  logo_url?: string;
}

/**
 * 更新企业请求
 * 所有字段都是可选的
 */
export interface EnterpriseUpdateRequest {
  name?: string;
  description?: string;
  address?: string;
  contactEmail?: string;
  contact_email?: string;
  contactPhone?: string;
  website?: string;
  industry?: string;
  scale?: string;
  logo_url?: string;
}

/**
 * 邀请成员请求
 * 支持两种命名风格
 */
export interface InviteMemberRequest {
  /** 被邀请人邮箱 - 用于通过邮箱邀请 */
  email?: string;
  /** 被邀请人用户ID - 用于直接邀请已知用户 */
  user_id?: string;
  /** 角色 */
  role: EnterpriseRole | MemberRole;
}

/**
 * 更新成员角色请求
 */
export interface UpdateMemberRoleRequest {
  role: EnterpriseRole | MemberRole;
}

// 重新导出 index.ts 中的 MemberRole 类型以保持兼容
export type MemberRole = import('./index').MemberRole;
