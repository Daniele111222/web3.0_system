/**
 * 权属看板类型定义
 * 定义企业 IP-NFT 资产管理、转移和历史溯源相关的所有类型
 * 与后端 API 数据模型保持一致
 */

// ============================================
// 权属状态定义
// ============================================

/** 资产权属状态值 */
export const OwnershipStatus = {
  ACTIVE: 'ACTIVE', // 有效资产
  LICENSED: 'LICENSED', // 许可中
  STAKED: 'STAKED', // 质押中
  TRANSFERRED: 'TRANSFERRED', // 已转移
} as const;

/** 资产权属状态类型 */
export type OwnershipStatus = (typeof OwnershipStatus)[keyof typeof OwnershipStatus];

// ============================================
// 转移类型定义
// ============================================

/** 权属变更类型值 */
export const TransferType = {
  MINT: 'MINT', // 铸造
  TRANSFER: 'TRANSFER', // 转移
  LICENSE: 'LICENSE', // 许可
  STAKE: 'STAKE', // 质押
  UNSTAKE: 'UNSTAKE', // 解除质押
  BURN: 'BURN', // 销毁
} as const;

/** 权属变更类型类型 */
export type TransferType = (typeof TransferType)[keyof typeof TransferType];

// ============================================
// 核心业务类型
// ============================================

/** 权属资产信息 */
export interface OwnershipAsset {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  token_id: number;
  contract_address: string;
  owner_address: string;
  owner_enterprise_id: string | null;
  owner_enterprise_name: string | null;
  ownership_status: OwnershipStatus;
  metadata_uri: string;
  created_at: string;
  updated_at: string;
}

/** 转移记录 */
export interface TransferRecord {
  id: string;
  token_id: number;
  contract_address: string;
  transfer_type: TransferType;
  from_address: string;
  from_enterprise_id: string | null;
  from_enterprise_name: string | null;
  to_address: string;
  to_enterprise_id: string | null;
  to_enterprise_name: string | null;
  tx_hash: string | null;
  block_number: number | null;
  timestamp: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  remarks: string | null;
}

/** 权属统计信息 */
export interface OwnershipStats {
  total_count: number;
  active_count: number;
  licensed_count: number;
  staked_count: number;
  transferred_count: number;
}

// ============================================
// 请求和响应类型
// ============================================

/** 权属资产筛选条件 */
export interface OwnershipFilters {
  asset_type?: string;
  ownership_status?: OwnershipStatus;
  search?: string;
  page?: number;
  page_size?: number;
}

/** NFT 转移请求 */
export interface TransferRequest {
  token_id: number;
  to_address: string;
  to_enterprise_id?: string;
  remarks?: string;
}

/** NFT 转移响应 */
export interface TransferResponse {
  success: boolean;
  tx_hash: string;
  transfer_record_id: string;
  token_id: number;
  from_address: string;
  to_address: string;
}

// ============================================
// 组件 Props 类型
// ============================================

/** 转移模态框 Props */
export interface TransferModalProps {
  visible: boolean;
  asset: OwnershipAsset | null;
  onClose: () => void;
  onSuccess: () => void;
}

/** 历史溯源页面 Props */
export interface NFTHistoryPageProps {
  tokenId?: string;
}
