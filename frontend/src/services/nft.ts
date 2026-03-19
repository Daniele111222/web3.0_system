/**
 * NFT 铸造服务层
 * 封装与 NFT 铸造相关的所有 API 调用
 * 与后端 NFT API 文档保持一致
 *
 * 功能包括：
 * - 合约部署与管理
 * - NFT 铸造（单条/批量）
 * - 铸造状态查询与重试
 */

import api from './api';
import type {
  ContractDeployResponse,
  ContractInfoResponse,
  ContractInfoApiResponse,
  ContractStatusResponse,
  ContractAddressUpdateRequest,
  MintNFTRequest,
  MintNFTResponse,
  BatchMintNFTRequest,
  BatchMintNFTResponse,
  RetryMintNFTRequest,
  MintStatusResponse,
  NFTHistoryResponse,
  NFTMintHistoryResponse,
  MintGasEstimateResponse,
} from '../types/nft';

const NFT_ERROR_CODE_MAP: Record<string, string> = {
  MINTER_ADDRESS_NOT_CONFIGURED:
    '未配置可用接收地址，请先配置企业钱包地址或联系管理员设置系统默认地址',
  INSUFFICIENT_ATTACHMENTS: '资产缺少附件，请先上传至少一个附件后再铸造',
  CONTRACT_CALL_FAILED: '链上铸造调用失败，请稍后重试',
  PINATA_UPLOAD_FAILED: '元数据上传失败，请检查 IPFS 服务后重试',
  SIGNATURE_VERIFICATION_FAILED: '签名校验失败，当前流程已关闭钱包签名，请联系管理员',
};

const extractErrorDetail = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return '';
  }
  const err = error as {
    response?: { data?: { detail?: string; message?: string } };
    message?: string;
  };
  return String(err.response?.data?.detail || err.response?.data?.message || err.message || '');
};

export const mapNftErrorMessage = (error: unknown, fallback = '操作失败'): string => {
  const detail = extractErrorDetail(error);
  if (!detail) {
    return fallback;
  }
  const matchedCode = Object.keys(NFT_ERROR_CODE_MAP).find((code) => detail.includes(code));
  if (!matchedCode) {
    return detail;
  }
  return NFT_ERROR_CODE_MAP[matchedCode];
};

// ============================================
// 合约管理 API
// ============================================

/**
 * 部署 IP-NFT 智能合约
 * 需要管理员权限
 * @returns 合约部署结果，包含合约地址和交易哈希
 */
export const deployContract = async (): Promise<ContractDeployResponse> => {
  const response = await api.post('/contracts/deploy');
  return response.data;
};

/**
 * 获取当前合约信息
 * @returns 合约地址、部署者、链ID等信息
 */
export const getContractInfo = async (): Promise<ContractInfoResponse> => {
  const response = await api.get<ContractInfoApiResponse>('/contracts/info');
  return response.data.data;
};

/**
 * 更新合约地址
 * 需要管理员权限，用于切换到新部署的合约
 * @param data 包含新合约地址的请求体
 */
export const updateContractAddress = async (data: ContractAddressUpdateRequest): Promise<void> => {
  await api.post('/contracts/update-address', data);
};

/**
 * 检查合约部署状态
 * 检查合约是否可以进行铸造操作
 * @returns 状态检查结果，包括是否可以铸造
 */
export const checkContractStatus = async (): Promise<ContractStatusResponse> => {
  const response = await api.get('/contracts/status');
  return response.data;
};

// ============================================
// NFT 铸造 API
// ============================================

/**
 * 铸造单个 NFT
 * 将资产铸造为 NFT 上链
 * @param assetId 资产ID（UUID）
 * @param data 铸造请求，包含接收者钱包地址
 * @returns 铸造结果，包含 Token ID 和交易哈希
 */
export const mintNFT = async (assetId: string, data: MintNFTRequest): Promise<MintNFTResponse> => {
  const response = await api.post(`/nft/mint?asset_id=${assetId}`, data);
  return response.data;
};

/**
 * 批量铸造 NFT
 * 一次性铸造多个资产的 NFT
 * @param data 批量铸造请求，包含资产ID列表和接收者地址
 * @returns 批量铸造结果，包含每个资产的铸造状态
 */
export const batchMintNFT = async (data: BatchMintNFTRequest): Promise<BatchMintNFTResponse> => {
  const response = await api.post('/nft/batch-mint', data);
  return response.data;
};

/**
 * 获取铸造状态
 * 查询资产的 NFT 铸造状态和进度
 * @param assetId 资产ID（UUID）
 * @returns 详细的铸造状态信息
 */
export const getMintStatus = async (assetId: string): Promise<MintStatusResponse> => {
  const response = await api.get(`/nft/${assetId}/mint/status`);
  return response.data;
};

/**
 * 重试铸造
 * 对铸造失败的 NFT 进行重试
 * @param assetId 资产ID（UUID）
 * @param data 重试请求，包含接收者钱包地址
 * @returns 铸造结果
 */
export const retryMint = async (
  assetId: string,
  data: RetryMintNFTRequest
): Promise<MintNFTResponse> => {
  const response = await api.post(`/nft/${assetId}/mint/retry`, data);
  return response.data;
};

export const estimateMintGas = async (
  assetId: string,
  data: MintNFTRequest
): Promise<MintGasEstimateResponse> => {
  const response = await api.post(`/nft/mint/estimate?asset_id=${assetId}`, data);
  return response.data;
};

export const getNFTHistory = async (
  tokenId: number,
  page = 1,
  pageSize = 20
): Promise<NFTHistoryResponse> => {
  const response = await api.get(`/nft/${tokenId}/history`, {
    params: { page, page_size: pageSize },
  });
  return response.data;
};

export const getMintHistory = async (
  enterpriseId: string,
  page = 1,
  pageSize = 20,
  recordStatus?: 'PENDING' | 'SUCCESS' | 'FAILED'
): Promise<NFTMintHistoryResponse> => {
  const response = await api.get('/nft/mint/history', {
    params: {
      enterprise_id: enterpriseId,
      page,
      page_size: pageSize,
      record_status: recordStatus,
    },
  });
  return response.data;
};

// ============================================
// 导出服务对象
// ============================================

export const nftService = {
  // 合约管理
  deployContract,
  getContractInfo,
  updateContractAddress,
  checkContractStatus,

  // NFT 铸造
  mintNFT,
  batchMintNFT,
  getMintStatus,
  retryMint,
  estimateMintGas,
  getNFTHistory,
  getMintHistory,
  mapNftErrorMessage,
};

export default nftService;
