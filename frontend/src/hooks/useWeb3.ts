import { useState, useCallback, useEffect } from 'react';
import { useWeb3Store } from '../store';
import blockchainService from '../services/blockchain';

interface UseWeb3Return {
  isConnected: boolean;
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string | null>;
  clearError: () => void;
}

export const useWeb3 = (): UseWeb3Return => {
  const { account, isConnected, chainId, setConnection, clearConnection } = useWeb3Store();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 监听账户变化
  useEffect(() => {
    const ethereum = window.ethereum;
    if (typeof ethereum !== 'undefined') {
      const handleAccountsChanged = (...args: unknown[]) => {
        const accounts = args[0] as string[];
        if (accounts.length === 0) {
          clearConnection();
        } else if (accounts[0] !== account) {
          setConnection(accounts[0], chainId || 1);
        }
      };

      const handleChainChanged = (...args: unknown[]) => {
        const newChainId = args[0] as string;
        const chainIdNum = parseInt(newChainId, 16);
        if (account) {
          setConnection(account, chainIdNum);
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account, chainId, setConnection, clearConnection]);

  const connect = useCallback(async (): Promise<string | null> => {
    setIsConnecting(true);
    setError(null);
    try {
      const connectedAccount = await blockchainService.connect();

      // 获取链 ID
      let currentChainId = 1;
      const ethereum = window.ethereum;
      if (typeof ethereum !== 'undefined') {
        const chainIdHex = await ethereum.request({
          method: 'eth_chainId',
        });
        currentChainId = parseInt(chainIdHex as string, 16);
      }

      setConnection(connectedAccount, currentChainId);
      return connectedAccount;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '连接钱包失败';
      setError(errorMessage);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [setConnection]);

  const disconnect = useCallback(() => {
    blockchainService.disconnect();
    clearConnection();
  }, [clearConnection]);

  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    setError(null);
    try {
      const signature = await blockchainService.signMessage(message);
      return signature;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '签名失败';
      setError(errorMessage);
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected,
    account,
    chainId,
    isConnecting,
    error,
    connect,
    disconnect,
    signMessage,
    clearError,
  };
};
