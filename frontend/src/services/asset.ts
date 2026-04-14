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
  ApiResponse,
} from '../types';

/**
 * 资产创建请求
 */
export interface AssetCreateRequest {
  name: string;
  type: AssetType;
  description: string;
  creator_name: string;
  inventors: string[];
  creation_date: string; // YYYY-MM-DD
  legal_status: LegalStatus;
  application_number?: string;
  rights_declaration?: string;
  asset_metadata?: Record<string, unknown>;
}

/**
 * 资产更新请求
 */
export interface AssetUpdateRequest {
  name?: string;
  description?: string;
  creator_name?: string;
  inventors?: string[];
  creation_date?: string;
  legal_status?: LegalStatus;
  application_number?: string;
  rights_declaration?: string;
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
  is_primary?: boolean;
}

/**
 * 资产列表响应
 */
export interface AssetListResponse extends PaginatedResponse<Asset> {
  total_pages: number;
}

/**
 * 资产提交审批请求
 */
export interface AssetSubmitRequest {
  remarks?: string;
}

/**
 * 资产提交审批响应
 */
export interface AssetSubmitResponse {
  asset_id: string;
  status: string;
  approval_id: string;
}

export interface AssetCreateWithAttachmentsResponse {
  asset: Asset;
  attachments: Attachment[];
  summary: {
    total_files: number;
    total_size: number;
    gateway_base_url: string;
  };
}

/**
 * 资产 API 服务类
 */
class AssetService {
  async createAssetWithAttachments(
    enterpriseId: string,
    data: AssetCreateRequest,
    files: File[] = []
  ): Promise<AssetCreateWithAttachmentsResponse> {
    const formData = new FormData();
    formData.append('asset_data', JSON.stringify(data));

    for (const file of files) {
      formData.append('files', file);
    }

    const response = await api.post<ApiResponse<AssetCreateWithAttachmentsResponse>>(
      '/assets/with-attachments',
      formData,
      {
        params: { enterprise_id: enterpriseId },
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.data;
  }

  /**
   * 创建资产草稿
   */
  async createAsset(
    enterpriseId: string,
    data: AssetCreateRequest,
    files: File[] = []
  ): Promise<Asset> {
    const result = await this.createAssetWithAttachments(enterpriseId, data, files);
    return result.asset;
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

  /**
   * 提交资产审批
   */
  async submitForApproval(assetId: string, data: AssetSubmitRequest): Promise<AssetSubmitResponse> {
    const response = await api.post<ApiResponse<AssetSubmitResponse>>(
      `/assets/${assetId}/submit`,
      data
    );
    return response.data.data;
  }
}

export default new AssetService();
