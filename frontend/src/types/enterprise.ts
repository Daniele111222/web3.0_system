// 企业相关类型定义

/**
 * 企业状态
 */
export type EnterpriseStatus = 'active' | 'pending' | 'inactive';

/**
 * 成员角色
 */
export type EnterpriseRole = 'owner' | 'admin' | 'member';

/**
 * 成员状态
 */
export type MemberStatus = 'active' | 'pending' | 'inactive';

/**
 * 企业信息
 */
export interface Enterprise {
  /** 企业ID */
  id: string;
  /** 企业名称 */
  name: string;
  /** 企业描述 */
  description: string;
  /** 企业地址 */
  address: string;
  /** 联系邮箱 */
  contactEmail: string;
  /** 联系电话 */
  contactPhone: string;
  /** 官方网站 */
  website?: string;
  /** 所属行业 */
  industry?: string;
  /** 企业规模 */
  scale?: string;
  /** 企业状态 */
  status: EnterpriseStatus;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

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
 */
export interface EnterpriseMember {
  /** 成员记录ID */
  id: string;
  /** 企业ID */
  enterpriseId: string;
  /** 用户ID */
  userId: string;
  /** 成员角色 */
  role: EnterpriseRole;
  /** 成员状态 */
  status: MemberStatus;
  /** 加入时间 */
  joinedAt: string;
  /** 用户信息 */
  user: MemberUser;
}

/**
 * 创建企业请求
 */
export interface CreateEnterpriseRequest {
  /** 企业名称 */
  name: string;
  /** 企业描述 */
  description: string;
  /** 企业地址 */
  address: string;
  /** 联系邮箱 */
  contactEmail: string;
  /** 联系电话 */
  contactPhone: string;
  /** 官方网站 */
  website?: string;
  /** 所属行业 */
  industry?: string;
  /** 企业规模 */
  scale?: string;
}

/**
 * 更新企业请求
 */
export interface UpdateEnterpriseRequest {
  /** 企业名称 */
  name?: string;
  /** 企业描述 */
  description?: string;
  /** 企业地址 */
  address?: string;
  /** 联系邮箱 */
  contactEmail?: string;
  /** 联系电话 */
  contactPhone?: string;
  /** 官方网站 */
  website?: string;
  /** 所属行业 */
  industry?: string;
  /** 企业规模 */
  scale?: string;
}

/**
 * 邀请成员请求
 */
export interface InviteMemberRequest {
  /** 被邀请人邮箱 */
  email: string;
  /** 角色 */
  role: Exclude<EnterpriseRole, 'owner'>;
}

/**
 * 更新成员角色请求
 */
export interface UpdateMemberRoleRequest {
  /** 成员记录ID */
  memberId: string;
  /** 新角色 */
  role: EnterpriseRole;
}
