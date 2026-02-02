import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWeb3 } from '../../hooks/useWeb3';

interface WalletBindProps {
  onSuccess?: () => void;
}

export const WalletBind = ({ onSuccess }: WalletBindProps) => {
  const { user, bindWallet, isLoading: isAuthLoading, error: authError, clearError } = useAuth();
  const {
    isConnected,
    account,
    isConnecting,
    error: web3Error,
    connect,
    disconnect,
    signMessage,
    clearError: clearWeb3Error,
  } = useWeb3();

  const [isBinding, setIsBinding] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);

  const handleConnect = async () => {
    clearError();
    clearWeb3Error();
    setBindError(null);
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
    setBindError(null);
  };

  const handleBind = async () => {
    if (!account) {
      setBindError('请先连接钱包');
      return;
    }

    setIsBinding(true);
    setBindError(null);
    clearError();

    try {
      // 生成待签名消息
      const timestamp = Date.now();
      const message = `IP-NFT 平台钱包绑定验证\n\n钱包地址: ${account}\n时间戳: ${timestamp}\n\n请签名以验证您对此钱包的所有权。`;

      // 签名消息
      const signature = await signMessage(message);
      if (!signature) {
        setBindError('签名失败，请重试');
        setIsBinding(false);
        return;
      }

      // 绑定钱包
      const success = await bindWallet({
        wallet_address: account,
        signature,
        message,
      });

      if (success && onSuccess) {
        onSuccess();
      }
    } catch {
      setBindError('绑定失败，请重试');
    } finally {
      setIsBinding(false);
    }
  };

  const displayError = bindError || authError || web3Error;
  const isLoading = isConnecting || isAuthLoading || isBinding;
  const hasWalletBound = !!user?.wallet_address;

  // 格式化地址用于显示
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="wallet-bind-container">
      <h3>钱包绑定</h3>

      {displayError && <div className="error-message">{displayError}</div>}

      {hasWalletBound ? (
        <div className="wallet-bound">
          <div className="wallet-info">
            <span className="label">已绑定钱包：</span>
            <span className="address">{formatAddress(user.wallet_address!)}</span>
          </div>
          <p className="hint">如需更换钱包，请联系管理员</p>
        </div>
      ) : (
        <div className="wallet-connect">
          {!isConnected ? (
            <div className="connect-section">
              <p className="description">绑定区块链钱包后，您可以铸造和管理 IP-NFT 资产。</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConnect}
                disabled={isLoading}
              >
                {isConnecting ? '连接中...' : '连接钱包'}
              </button>
              <p className="hint">支持 MetaMask 等以太坊兼容钱包</p>
            </div>
          ) : (
            <div className="bind-section">
              <div className="wallet-info">
                <span className="label">当前钱包：</span>
                <span className="address">{formatAddress(account!)}</span>
              </div>

              <div className="action-buttons">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleBind}
                  disabled={isLoading}
                >
                  {isBinding ? '绑定中...' : '确认绑定'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                >
                  断开连接
                </button>
              </div>

              <p className="hint">点击"确认绑定"后，需要在钱包中签名以验证所有权</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletBind;
