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
  ContractStatusResponse,
  ContractAddressUpdateRequest,
  MintNFTRequest,
  MintNFTResponse,
  BatchMintNFTRequest,
  BatchMintNFTResponse,
  RetryMintNFTRequest,
  MintStatusResponse,
} from '../types/nft';

// ============================================
// 合约管理 API
// ============================================

/**
 * 部署 IP-NFT 智能合约
 * 需要管理员权限
 * @returns 合约部署结果，包含合约地址和交易哈希
 */
export const deployContract = async (): Promise<ContractDeployResponse> => {
  const response = await api.post('/api/v1/contracts/deploy');
  return response.data;
};

/**
 * 获取当前合约信息
 * @returns 合约地址、部署者、链ID等信息
 */
export const getContractInfo = async (): Promise<ContractInfoResponse> => {
  const response = await api.get('/api/v1/contracts/info');
  return response.data;
};

/**
 * 更新合约地址
 * 需要管理员权限，用于切换到新部署的合约
 * @param data 包含新合约地址的请求体
 */
export const updateContractAddress = async (data: ContractAddressUpdateRequest): Promise<void> => {
  await api.post('/api/v1/contracts/update-address', data);
};

/**
 * 检查合约部署状态
 * 检查合约是否可以进行铸造操作
 * @returns 状态检查结果，包括是否可以铸造
 */
export const checkContractStatus = async (): Promise<ContractStatusResponse> => {
  const response = await api.get('/api/v1/contracts/status');
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
  const response = await api.post(`/api/v1/nft/mint?asset_id=${assetId}`, data);
  return response.data;
};

/**
 * 批量铸造 NFT
 * 一次性铸造多个资产的 NFT
 * @param data 批量铸造请求，包含资产ID列表和接收者地址
 * @returns 批量铸造结果，包含每个资产的铸造状态
 */
export const batchMintNFT = async (data: BatchMintNFTRequest): Promise<BatchMintNFTResponse> => {
  const response = await api.post('/api/v1/nft/batch-mint', data);
  return response.data;
};

/**
 * 获取铸造状态
 * 查询资产的 NFT 铸造状态和进度
 * @param assetId 资产ID（UUID）
 * @returns 详细的铸造状态信息
 */
export const getMintStatus = async (assetId: string): Promise<MintStatusResponse> => {
  const response = await api.get(`/api/v1/nft/${assetId}/mint/status`);
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
  const response = await api.post(`/api/v1/nft/${assetId}/mint/retry`, data);
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
};

export default nftService;
