import { useState, useEffect } from 'react';
import { useAsset } from '../../hooks/useAsset';
import { AssetForm } from './AssetForm';
import { AssetList } from './AssetList';
import type { Asset } from '../../types';
import type { AssetCreateRequest } from '../../services/asset';
import './Asset.css';

interface AssetPageProps {
  enterpriseId: string;
}

/**
 * 资产管理页面
 */
export function AssetPage({ enterpriseId }: AssetPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { assets, isLoading, error, createAsset, getAssets, clearError } = useAsset();

  /**
   * 加载资产列表
   */
  useEffect(() => {
    if (enterpriseId) {
      getAssets({
        enterprise_id: enterpriseId,
        page: 1,
        page_size: 20,
      });
    }
  }, [enterpriseId, getAssets]);

  /**
   * 处理创建资产
   */
  const handleCreateAsset = async (data: AssetCreateRequest) => {
    const asset = await createAsset(enterpriseId, data);
    if (asset) {
      setSuccessMessage('资产创建成功！');
      setShowForm(false);
      // 刷新列表
      getAssets({
        enterprise_id: enterpriseId,
        page: 1,
        page_size: 20,
      });
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  /**
   * 处理资产点击
   */
  const handleAssetClick = (asset: Asset) => {
    // TODO: 导航到资产详情页面
    console.log('Asset clicked:', asset);
  };

  /**
   * 清除消息
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <div className="asset-page">
      <div className="asset-header">
        <h1>资产管理</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + 创建资产
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {showForm ? (
        <div className="asset-form-container">
          <h2>创建资产草稿</h2>
          <AssetForm
            onSubmit={handleCreateAsset}
            onCancel={() => setShowForm(false)}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <AssetList assets={assets} isLoading={isLoading} onAssetClick={handleAssetClick} />
      )}
    </div>
  );
}
