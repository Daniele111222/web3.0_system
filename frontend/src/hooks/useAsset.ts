import { useState, useCallback } from 'react';
import assetService, {
  AssetCreateRequest,
  AssetUpdateRequest,
  AssetFilterParams,
  AttachmentUploadRequest,
} from '../services/asset';
import type { Asset, AssetListResponse, Attachment } from '../types';

interface UseAssetReturn {
  assets: Asset[];
  currentAsset: Asset | null;
  total: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  createAsset: (
    enterpriseId: string,
    data: AssetCreateRequest
  ) => Promise<Asset | null>;
  getAssets: (params: AssetFilterParams) => Promise<void>;
  getAsset: (assetId: string) => Promise<Asset | null>;
  updateAsset: (
    assetId: string,
    data: AssetUpdateRequest
  ) => Promise<Asset | null>;
  deleteAsset: (assetId: string) => Promise<boolean>;
  uploadAttachment: (
    assetId: string,
    data: AttachmentUploadRequest
  ) => Promise<Attachment | null>;
  clearError: () => void;
}

/**
 * 资产管理 Hook
 */
export function useAsset(): UseAssetReturn {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 提取错误消息
   */
  const extractErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'object' && err !== null && 'message' in err) {
      return String(err.message);
    }
    return '操作失败，请重试';
  };

  /**
   * 创建资产
   */
  const createAsset = useCallback(
    async (
      enterpriseId: string,
      data: AssetCreateRequest
    ): Promise<Asset | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const asset = await assetService.createAsset(enterpriseId, data);
        return asset;
      } catch (err: unknown) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 获取资产列表
   */
  const getAssets = useCallback(
    async (params: AssetFilterParams): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const response: AssetListResponse = await assetService.getAssets(
          params
        );
        setAssets(response.items);
        setTotal(response.total);
        setTotalPages(response.total_pages);
      } catch (err: unknown) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        setAssets([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 获取资产详情
   */
  const getAsset = useCallback(
    async (assetId: string): Promise<Asset | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const asset = await assetService.getAsset(assetId);
        setCurrentAsset(asset);
        return asset;
      } catch (err: unknown) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 更新资产
   */
  const updateAsset = useCallback(
    async (
      assetId: string,
      data: AssetUpdateRequest
    ): Promise<Asset | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const asset = await assetService.updateAsset(assetId, data);
        setCurrentAsset(asset);
        return asset;
      } catch (err: unknown) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 删除资产
   */
  const deleteAsset = useCallback(async (assetId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await assetService.deleteAsset(assetId);
      return true;
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 上传附件
   */
  const uploadAttachment = useCallback(
    async (
      assetId: string,
      data: AttachmentUploadRequest
    ): Promise<Attachment | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const attachment = await assetService.uploadAttachment(assetId, data);
        return attachment;
      } catch (err: unknown) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    assets,
    currentAsset,
    total,
    totalPages,
    isLoading,
    error,
    createAsset,
    getAssets,
    getAsset,
    updateAsset,
    deleteAsset,
    uploadAttachment,
    clearError,
  };
}

