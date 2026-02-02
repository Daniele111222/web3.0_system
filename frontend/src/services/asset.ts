/**
 * 资产管理 API 服务
 */
import api from './api';
import type {
  Asset,
  AssetType,
  AssetStatus,
  LegalStatus,
  Attachment,
  PaginatedResponse,
} from '../types';

/**
 * 资产创建请求
 */
export interface AssetCreateRequest {
  name: string;
  type: AssetType;
  description: string;
  creator_name: string;
  creation_date: string; // YYYY-MM-DD
  legal_status: LegalStatus;
  application_number?: string;
  asset_metadata?: Record<string, unknown>;
}

/**
 * 资产更新请求
 */
export interface AssetUpdateRequest {
  name?: string;
  description?: string;
  creator_name?: string;
  creation_date?: string;
  legal_status?: LegalStatus;
  application_number?: string;
  asset_metadata?: Record<string, unknown>;
}

/**
 * 资产筛选参数
 */
export interface AssetFilterParams {
  enterprise_id: string;
  asset_type?: AssetType;
  asset_status?: AssetStatus;
  legal_status?: LegalStatus;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

/**
 * 附件上传请求
 */
export interface AttachmentUploadRequest {
  file_name: string;
  file_type: string;
  file_size: number;
  ipfs_cid: string;
}

/**
 * 资产列表响应
 */
export interface AssetListResponse extends PaginatedResponse<Asset> {
  total_pages: number;
}

/**
 * 资产 API 服务类
 */
class AssetService {
  /**
   * 创建资产草稿
   */
  async createAsset(enterpriseId: string, data: AssetCreateRequest): Promise<Asset> {
    const response = await api.post<Asset>('/assets', data, {
      params: { enterprise_id: enterpriseId },
    });
    return response.data;
  }

  /**
   * 获取资产列表
   */
  async getAssets(params: AssetFilterParams): Promise<AssetListResponse> {
    const response = await api.get<AssetListResponse>('/assets', { params });
    return response.data;
  }

  /**
   * 获取资产详情
   */
  async getAsset(assetId: string): Promise<Asset> {
    const response = await api.get<Asset>(`/assets/${assetId}`);
    return response.data;
  }

  /**
   * 更新资产草稿
   */
  async updateAsset(assetId: string, data: AssetUpdateRequest): Promise<Asset> {
    const response = await api.put<Asset>(`/assets/${assetId}`, data);
    return response.data;
  }

  /**
   * 删除资产草稿
   */
  async deleteAsset(assetId: string): Promise<void> {
    await api.delete(`/assets/${assetId}`);
  }

  /**
   * 上传附件
   */
  async uploadAttachment(assetId: string, data: AttachmentUploadRequest): Promise<Attachment> {
    const response = await api.post<Attachment>(`/assets/${assetId}/attachments`, data);
    return response.data;
  }
}

export default new AssetService();
