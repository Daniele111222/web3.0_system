/**
 * 权属管理服务层
 * 封装与企业 NFT 资产、转移、历史相关的 API 调用
 */

import api from './api';
import type {
  OwnershipAsset,
  OwnershipStats,
  OwnershipFilters,
  TransferRecord,
  TransferRequest,
  TransferResponse,
} from '../types/ownership';
import type { PaginatedResponse } from '../types';

/**
 * 获取企业权属资产列表
 * @param enterpriseId 企业 ID
 * @param filters 筛选条件
 * @returns 资产列表和分页信息
 */
export const getOwnershipAssets = async (
  enterpriseId: string,
  filters: OwnershipFilters
): Promise<PaginatedResponse<OwnershipAsset>> => {
  const response = await api.get(`/api/v1/ownership/${enterpriseId}/assets`, {
    params: filters,
  });
  return response.data.data;
};

/**
 * 获取企业权属统计信息
 * @param enterpriseId 企业 ID
 * @returns 统计数据
 */
export const getOwnershipStats = async (enterpriseId: string): Promise<OwnershipStats> => {
  const response = await api.get(`/api/v1/ownership/${enterpriseId}/stats`);
  return response.data.data;
};

/**
 * 获取单个资产详情
 * @param tokenId Token ID
 * @returns 资产详情
 */
export const getOwnershipAssetDetail = async (tokenId: number): Promise<OwnershipAsset> => {
  const response = await api.get(`/api/v1/ownership/assets/${tokenId}`);
  return response.data.data;
};

/**
 * 获取转移历史记录
 * @param tokenId Token ID
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 转移历史列表
 */
export const getTransferHistory = async (
  tokenId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<TransferRecord>> => {
  const response = await api.get(`/api/v1/ownership/assets/${tokenId}/history`, {
    params: { page, page_size: pageSize },
  });
  return response.data.data;
};

/**
 * 转移 NFT
 * @param data 转移请求
 * @returns 转移结果
 */
export const transferNFT = async (data: TransferRequest): Promise<TransferResponse> => {
  const response = await api.post('/api/v1/ownership/transfer', data);
  return response.data.data;
};

/**
 * 更新资产权属状态
 * @param tokenId Token ID
 * @param newStatus 新状态
 * @param remarks 备注
 * @returns 更新结果
 */
export const updateOwnershipStatus = async (
  tokenId: number,
  newStatus: string,
  remarks?: string
): Promise<{ success: boolean; token_id: number; new_status: string }> => {
  const response = await api.patch(`/api/v1/ownership/assets/${tokenId}/status`, {
    new_status: newStatus,
    remarks,
  });
  return response.data.data;
};

export const ownershipService = {
  getOwnershipAssets,
  getOwnershipStats,
  getOwnershipAssetDetail,
  getTransferHistory,
  transferNFT,
  updateOwnershipStatus,
};

export default ownershipService;
