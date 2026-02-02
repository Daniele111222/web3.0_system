import { useState, useEffect } from 'react';
import { useAsset } from '../../hooks/useAsset';
import { AssetForm } from '../../components/asset/AssetForm';
import { AssetList } from '../../components/asset/AssetList';
import { useEnterpriseStore } from '../../store';
import type { Asset } from '../../types';
import type { AssetCreateRequest } from '../../services/asset';
import './index.css';

/**
 * 资产管理页面
 */
const Assets = () => {
  const { currentEnterprise } = useEnterpriseStore();
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { assets, isLoading, error, createAsset, getAssets, clearError } = useAsset();

  useEffect(() => {
    if (currentEnterprise) {
      getAssets({
        enterprise_id: currentEnterprise.id,
        page: 1,
        page_size: 20,
      });
    }
  }, [currentEnterprise, getAssets]);

  const handleCreateAsset = async (data: AssetCreateRequest) => {
    if (!currentEnterprise) return;

    const asset = await createAsset(currentEnterprise.id, data);
    if (asset) {
      setSuccessMessage('资产创建成功！');
      setShowForm(false);
      getAssets({
        enterprise_id: currentEnterprise.id,
        page: 1,
        page_size: 20,
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleAssetClick = (asset: Asset) => {
    console.log('Asset clicked:', asset);
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (!currentEnterprise) {
    return (
      <div className="asset-page">
        <div className="info-message">
          <h2>请先选择企业</h2>
          <p>您需要先在企业管理页面选择或创建一个企业，才能管理资产。</p>
        </div>
      </div>
    );
  }

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
};

export default Assets;
