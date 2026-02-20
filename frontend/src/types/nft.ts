/**
 * NFT 模块类型定义
 * 定义 NFT 铸造、管理和状态相关的所有类型
 * 与后端 API 数据模型保持一致
 */

// ============================================
// 铸造状态枚举
// ============================================

/** 资产铸造状态值 */
export const AssetMintStatus = {
  DRAFT: 'DRAFT', // 草稿状态
  PENDING: 'PENDING', // 待审批
  MINTING: 'MINTING', // 铸造中
  MINTED: 'MINTED', // 铸造完成
  MINT_FAILED: 'MINT_FAILED', // 铸造失败
  REJECTED: 'REJECTED', // 已拒绝
} as const;

/** 资产铸造状态类型 */
export type AssetMintStatus = (typeof AssetMintStatus)[keyof typeof AssetMintStatus];

/** 铸造阶段值 */
export const MintStage = {
  PREPARING: 'PREPARING', // 准备阶段 (10%)
  SUBMITTING: 'SUBMITTING', // 提交交易 (30%)
  CONFIRMING: 'CONFIRMING', // 等待确认 (70%)
  COMPLETED: 'COMPLETED', // 铸造完成 (100%)
  FAILED: 'FAILED', // 铸造失败
} as const;

/** 铸造阶段类型 */
export type MintStage = (typeof MintStage)[keyof typeof MintStage];

/** 铸造记录操作类型值 */
export const MintOperation = {
  REQUEST: 'REQUEST', // 请求铸造
  SUBMIT: 'SUBMIT', // 提交交易
  CONFIRM: 'CONFIRM', // 确认交易
  RETRY: 'RETRY', // 重试
  FAIL: 'FAIL', // 失败
  SUCCESS: 'SUCCESS', // 成功
} as const;

/** 铸造记录操作类型 */
export type MintOperation = (typeof MintOperation)[keyof typeof MintOperation];

// ============================================
// 合约相关类型
// ============================================

/** 合约部署响应 */
export interface ContractDeployResponse {
  success: boolean;
  contract_address: string;
  transaction_hash: string;
  block_number: number;
  gas_used: number;
}

/** 合约信息响应 */
export interface ContractInfoResponse {
  contract_address: string;
  deployer_address: string;
  chain_id: number;
  is_connected: boolean;
  has_contract: boolean;
  has_abi: boolean;
}

/** 合约状态检查响应 */
export interface ContractStatusResponse {
  ready: boolean;
  issues: string[];
  warnings: string[];
  can_mint: boolean;
}

/** 合约地址更新请求 */
export interface ContractAddressUpdateRequest {
  contract_address: string;
}

// ============================================
// NFT 铸造相关类型
// ============================================

/** 铸造 NFT 请求 */
export interface MintNFTRequest {
  minter_address: string;
}

/** 批量铸造 NFT 请求 */
export interface BatchMintNFTRequest {
  asset_ids: string[];
  minter_address: string;
}

/** 铸造 NFT 响应 */
export interface MintNFTResponse {
  message: string;
  asset_id: string;
  token_id: number;
  tx_hash: string;
  metadata_uri: string;
  contract_address: string;
  status: string;
}

/** 批量铸造结果单项 */
export interface BatchMintResultItem {
  asset_id: string;
  status: 'success' | 'failed';
  token_id?: number;
  tx_hash?: string;
  error?: string;
}

/** 批量铸造 NFT 响应 */
export interface BatchMintNFTResponse {
  message: string;
  total: number;
  successful: number;
  failed: number;
  results: BatchMintResultItem[];
}

/** 重试铸造 NFT 请求 */
export interface RetryMintNFTRequest {
  minter_address: string;
}

// ============================================
// 铸造状态相关类型
// ============================================

/** 铸造记录 */
export interface MintRecord {
  id: string;
  asset_id: string;
  operation: MintOperation;
  stage: string;
  operator_id?: string;
  operator_address?: string;
  token_id?: number;
  tx_hash?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  error_code?: string;
  error_message?: string;
  metadata_uri?: string;
  created_at: string;
  completed_at?: string;
}

/** 铸造状态响应 */
export interface MintStatusResponse {
  asset_id: string;
  current_status: AssetMintStatus;
  mint_stage: MintStage;
  mint_progress: number;
  token_id: number | null;
  contract_address: string;
  tx_hash: string | null;
  metadata_uri: string | null;
  recipient_address: string | null;
  mint_requested_at: string | null;
  mint_submitted_at: string | null;
  mint_confirmed_at: string | null;
  mint_completed_at: string | null;
  mint_attempt_count: number;
  max_mint_attempts: number;
  can_retry: boolean;
  last_mint_error: string | null;
  last_mint_error_code: string | null;
  mint_record: MintRecord | null;
}

// ============================================
// NFT 资产视图类型
// ============================================

/** NFT 资产卡片展示数据 */
export interface NFTAssetCardData {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  description?: string;
  status: AssetMintStatus;
  mint_stage?: MintStage;
  mint_progress?: number;
  token_id?: number;
  contract_address?: string;
  tx_hash?: string;
  metadata_uri?: string;
  thumbnail_url?: string;
  created_at: string;
  creator_name?: string;
}

/** 铸造统计 */
export interface MintStatistics {
  total_assets: number;
  minted_count: number;
  minting_count: number;
  failed_count: number;
  pending_count: number;
  draft_count: number;
  recent_mints: NFTAssetCardData[];
}

// ============================================
// 组件 Props 类型
// ============================================

/** 铸造卡片组件 Props */
export interface MintCardProps {
  asset: NFTAssetCardData;
  onMint?: (assetId: string) => void;
  onRetry?: (assetId: string) => void;
  onViewDetail?: (assetId: string) => void;
  loading?: boolean;
}

/** 铸造进度条组件 Props */
export interface MintProgressBarProps {
  stage: MintStage;
  progress: number;
  status: AssetMintStatus;
  showLabel?: boolean;
  size?: 'small' | 'default' | 'large';
}

/** 批量铸造组件 Props */
export interface BatchMintProps {
  assets: NFTAssetCardData[];
  onBatchMint: (assetIds: string[], minterAddress: string) => void;
  loading?: boolean;
}

/** 铸造统计卡片 Props */
export interface MintStatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
}

// ============================================
// Hook 返回类型
// ============================================

/** useMint Hook 返回类型 */
export interface UseMintReturn {
  // 状态
  loading: boolean;
  error: string | null;
  mintStatus: MintStatusResponse | null;

  // 操作方法
  mint: (assetId: string, minterAddress: string) => Promise<void>;
  batchMint: (assetIds: string[], minterAddress: string) => Promise<BatchMintNFTResponse>;
  retryMint: (assetId: string, minterAddress: string) => Promise<void>;
  fetchMintStatus: (assetId: string) => Promise<void>;
  clearError: () => void;
}

/** useContract Hook 返回类型 */
export interface UseContractReturn {
  loading: boolean;
  error: string | null;
  contractInfo: ContractInfoResponse | null;
  contractStatus: ContractStatusResponse | null;

  fetchContractInfo: () => Promise<void>;
  fetchContractStatus: () => Promise<void>;
  deployContract: () => Promise<ContractDeployResponse>;
  updateContractAddress: (address: string) => Promise<void>;
  clearError: () => void;
}

/** useMintStatistics Hook 返回类型 */
export interface UseMintStatisticsReturn {
  loading: boolean;
  error: string | null;
  statistics: MintStatistics | null;

  fetchStatistics: () => Promise<void>;
  clearError: () => void;
}
