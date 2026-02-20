/**
 * NFT 相关 Hooks
 * 提供铸造、合约查询等功能的封装
 */
import { useState, useCallback } from 'react';
import { message } from 'antd';
import type {
  MintNFTRequest,
  BatchMintNFTResponse,
  ContractInfoResponse,
  ContractStatusResponse,
  MintStatistics,
} from '../types/nft';

// ============================================
// useMint Hook - 铸造相关操作
// ============================================

interface UseMintReturn {
  loading: boolean;
  error: string | null;
  mint: (assetId: string, request: MintNFTRequest) => Promise<void>;
  batchMint: (assetIds: string[], minterAddress: string) => Promise<BatchMintNFTResponse>;
  retryMint: (assetId: string, minterAddress: string) => Promise<void>;
  fetchMintStatus: (assetId: string) => Promise<void>;
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
      // TODO: 调用实际的API
      console.log('Minting asset:', assetId, request);
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '铸造失败';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 批量铸造
  const batchMint = useCallback(
    async (assetIds: string[], minterAddress: string): Promise<BatchMintNFTResponse> => {
      setLoading(true);
      setError(null);
      try {
        // TODO: 调用实际的API
        console.log('Batch minting:', assetIds, minterAddress);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        return {
          message: '批量铸造成功',
          total: assetIds.length,
          successful: assetIds.length,
          failed: 0,
          results: assetIds.map((id) => ({
            asset_id: id,
            status: 'success' as const,
            token_id: Math.floor(Math.random() * 1000),
            tx_hash: '0x' + Math.random().toString(16).slice(2),
          })),
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '批量铸造失败';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 重试铸造
  const retryMint = useCallback(async (assetId: string, minterAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: 调用实际的API
      console.log('Retrying mint:', assetId, minterAddress);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重试失败';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 查询铸造状态
  const fetchMintStatus = useCallback(async (assetId: string) => {
    try {
      // TODO: 调用实际的API
      console.log('Fetching mint status:', assetId);
    } catch (err) {
      console.error('Failed to fetch mint status:', err);
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
      // TODO: 调用实际的API
      // 模拟数据
      const mockInfo: ContractInfoResponse = {
        contract_address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        deployer_address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        chain_id: 1337,
        is_connected: true,
        has_contract: true,
        has_abi: true,
      };
      setContractInfo(mockInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取合约信息失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取合约状态
  const fetchContractStatus = useCallback(async () => {
    try {
      // TODO: 调用实际的API
      const mockStatus: ContractStatusResponse = {
        ready: true,
        issues: [],
        warnings: [],
        can_mint: true,
      };
      setContractStatus(mockStatus);
    } catch (err) {
      console.error('Failed to fetch contract status:', err);
    }
  }, []);

  // 部署合约
  const deployContract = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: 调用实际的API
      console.log('Deploying contract...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      message.success('合约部署成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '部署失败';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新合约地址
  const updateContractAddress = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: 调用实际的API
      console.log('Updating contract address:', address);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success('合约地址更新成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新失败';
      setError(errorMessage);
      throw err;
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
      // TODO: 调用实际的API
      // 模拟数据
      const mockStats: MintStatistics = {
        total_assets: 5,
        minted_count: 1,
        minting_count: 1,
        failed_count: 1,
        pending_count: 1,
        draft_count: 1,
        recent_mints: [],
      };
      setStatistics(mockStats);
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

// 默认导出
export default {
  useMint,
  useContract,
  useMintStatistics,
};
