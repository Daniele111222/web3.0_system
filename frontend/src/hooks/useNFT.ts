/**
 * NFT 相关 Hooks
 * 提供铸造、合约查询等功能的封装
 */
import { useState, useCallback } from 'react';
import type {
  AssetMintStatus,
  MintNFTRequest,
  BatchMintNFTResponse,
  MintStatusResponse,
  ContractInfoResponse,
  ContractStatusResponse,
  MintStatistics,
  NFTAssetCardData,
  MintGasEstimateResponse,
} from '../types/nft';
import assetService from '../services/asset';
import nftService from '../services/nft';
import type { Asset as AssetEntity } from '../types';
import { useEnterpriseStore } from '../store';

const getCurrentEnterpriseId = (): string =>
  useEnterpriseStore.getState().currentEnterprise?.id ||
  localStorage.getItem('current_enterprise_id') ||
  '';

const assetTypeLabelMap: Record<string, string> = {
  PATENT: '专利',
  TRADEMARK: '商标',
  COPYRIGHT: '版权',
  TRADE_SECRET: '商业秘密',
  DIGITAL_WORK: '数字作品',
};

type AssetWithMintFields = AssetEntity & {
  mint_stage?: NFTAssetCardData['mint_stage'];
  mint_progress?: number;
  creator?: string;
};

const mapAssetToCard = (asset: AssetEntity): NFTAssetCardData => {
  const source = asset as AssetWithMintFields;
  const tokenId = asset.nft_token_id ? Number(asset.nft_token_id) : undefined;
  const primaryAttachment = asset.attachments?.find((attachment) => attachment.is_primary);
  const imageFromMetadata =
    typeof asset.asset_metadata?.image === 'string' ? asset.asset_metadata.image : undefined;
  const previewImage =
    imageFromMetadata || (primaryAttachment ? `ipfs://${primaryAttachment.ipfs_cid}` : undefined);
  return {
    asset_id: asset.id,
    asset_name: asset.name,
    asset_type: assetTypeLabelMap[asset.type] ?? asset.type,
    description: asset.description,
    rights_declaration: asset.rights_declaration,
    status: asset.status as AssetMintStatus,
    mint_stage: source.mint_stage,
    mint_progress: source.mint_progress ?? undefined,
    token_id: Number.isFinite(tokenId) ? tokenId : undefined,
    contract_address: asset.nft_contract_address,
    tx_hash: asset.mint_tx_hash,
    metadata_uri: asset.metadata_uri,
    thumbnail_url: previewImage,
    preview_image: previewImage,
    creation_timestamp: asset.creation_date || asset.created_at,
    created_at: asset.created_at,
    creator_name: source.creator_name ?? source.creator ?? '',
  };
};

const fetchEnterpriseAssets = async (): Promise<NFTAssetCardData[]> => {
  const enterpriseId = getCurrentEnterpriseId();
  if (!enterpriseId) {
    return [];
  }
  const response = await assetService.getAssets({
    enterprise_id: enterpriseId,
    page: 1,
    page_size: 100,
  });
  return response.items.map(mapAssetToCard);
};

// ============================================
// useMint Hook - 铸造相关操作
// ============================================

interface UseMintReturn {
  loading: boolean;
  error: string | null;
  mint: (assetId: string, request: MintNFTRequest) => Promise<void>;
  batchMint: (assetIds: string[], minterAddress?: string) => Promise<BatchMintNFTResponse>;
  retryMint: (assetId: string, minterAddress?: string) => Promise<void>;
  fetchMintStatus: (assetId: string) => Promise<MintStatusResponse | null>;
  estimateMintGas: (
    assetId: string,
    request: MintNFTRequest
  ) => Promise<MintGasEstimateResponse | null>;
  clearError: () => void;
}

export const useMint = (): UseMintReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 单条铸造
  const mint = useCallback(async (assetId: string, request: MintNFTRequest) => {
    setLoading(true);
    setError(null);
    try {
      await nftService.mintNFT(assetId, request);
    } catch (err) {
      const errorMessage = nftService.mapNftErrorMessage(err, '铸造失败');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 批量铸造
  const batchMint = useCallback(
    async (assetIds: string[], minterAddress?: string): Promise<BatchMintNFTResponse> => {
      setLoading(true);
      setError(null);
      try {
        return await nftService.batchMintNFT({
          asset_ids: assetIds,
          minter_address: minterAddress,
        });
      } catch (err) {
        const errorMessage = nftService.mapNftErrorMessage(err, '批量铸造失败');
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 重试铸造
  const retryMint = useCallback(async (assetId: string, minterAddress?: string) => {
    setLoading(true);
    setError(null);
    try {
      await nftService.retryMint(assetId, { minter_address: minterAddress });
    } catch (err) {
      const errorMessage = nftService.mapNftErrorMessage(err, '重试失败');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 查询铸造状态
  const fetchMintStatus = useCallback(async (assetId: string) => {
    try {
      return await nftService.getMintStatus(assetId);
    } catch (err) {
      const errorMessage = nftService.mapNftErrorMessage(err, '获取铸造状态失败');
      setError(errorMessage);
      return null;
    }
  }, []);

  const estimateMintGas = useCallback(async (assetId: string, request: MintNFTRequest) => {
    try {
      return await nftService.estimateMintGas(assetId, request);
    } catch (err) {
      const errorMessage = nftService.mapNftErrorMessage(err, '预估 Gas 失败');
      setError(errorMessage);
      return null;
    }
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    mint,
    batchMint,
    retryMint,
    fetchMintStatus,
    estimateMintGas,
    clearError,
  };
};

// ============================================
// useContract Hook - 合约相关操作
// ============================================

interface UseContractReturn {
  loading: boolean;
  error: string | null;
  contractInfo: ContractInfoResponse | null;
  contractStatus: ContractStatusResponse | null;
  fetchContractInfo: () => Promise<void>;
  fetchContractStatus: () => Promise<void>;
  deployContract: () => Promise<void>;
  updateContractAddress: (address: string) => Promise<void>;
  clearError: () => void;
}

export const useContract = (): UseContractReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractInfo, setContractInfo] = useState<ContractInfoResponse | null>(null);
  const [contractStatus, setContractStatus] = useState<ContractStatusResponse | null>(null);

  // 获取合约信息
  const fetchContractInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await nftService.getContractInfo();
      setContractInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取合约信息失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取合约状态
  const fetchContractStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await nftService.checkContractStatus();
      setContractStatus(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取合约状态失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 部署合约
  const deployContract = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await nftService.deployContract();
      await fetchContractInfo();
      await fetchContractStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '部署失败';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchContractInfo, fetchContractStatus]);

  // 更新合约地址
  const updateContractAddress = useCallback(
    async (address: string) => {
      setLoading(true);
      setError(null);
      try {
        await nftService.updateContractAddress({ contract_address: address });
        await fetchContractInfo();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '更新失败';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchContractInfo]
  );

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    contractInfo,
    contractStatus,
    fetchContractInfo,
    fetchContractStatus,
    deployContract,
    updateContractAddress,
    clearError,
  };
};

// ============================================
// useMintStatistics Hook - 铸造统计
// ============================================

interface UseMintStatisticsReturn {
  loading: boolean;
  error: string | null;
  statistics: MintStatistics | null;
  fetchStatistics: () => Promise<void>;
  clearError: () => void;
}

export const useMintStatistics = (): UseMintStatisticsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<MintStatistics | null>(null);

  // 获取统计数据
  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const assets = await fetchEnterpriseAssets();
      const mintedAssets = assets.filter((item) => item.status === 'MINTED');
      const statisticsData: MintStatistics = {
        total_assets: assets.length,
        minted_count: mintedAssets.length,
        minting_count: assets.filter((item) => item.status === 'MINTING').length,
        failed_count: assets.filter((item) => item.status === 'MINT_FAILED').length,
        pending_count: assets.filter((item) => item.status === 'APPROVED').length,
        draft_count: assets.filter((item) => item.status === 'DRAFT').length,
        recent_mints: mintedAssets
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5),
      };
      setStatistics(statisticsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取统计数据失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    statistics,
    fetchStatistics,
    clearError,
  };
};

interface UseNFTAssetsReturn {
  loading: boolean;
  error: string | null;
  assets: NFTAssetCardData[];
  fetchAssets: () => Promise<void>;
  clearError: () => void;
}

export const useNFTAssets = (): UseNFTAssetsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<NFTAssetCardData[]>([]);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchEnterpriseAssets();
      setAssets(list);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取资产列表失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    assets,
    fetchAssets,
    clearError,
  };
};

// 默认导出
export default {
  useMint,
  useContract,
  useMintStatistics,
  useNFTAssets,
};
