import { useState, useEffect, useMemo } from 'react';
import { Select } from 'antd';
import { useAsset } from '../../hooks/useAsset';
import { useEnterprise } from '../../hooks/useEnterprise';
import { AssetForm } from '../../components/asset/AssetForm';
import { AssetList } from '../../components/asset/AssetList';
import { useEnterpriseStore } from '../../store';
import type { Asset } from '../../types';
import type { AssetCreateRequest } from '../../services/asset';
import './index.less';

/**
 * 资产管理页面
 *
 * 功能：
 * - 展示企业资产列表
 * - 创建新资产
 * - 统计资产数据
 */
const Assets = () => {
  const { currentEnterprise, setCurrentEnterprise } = useEnterpriseStore();
  const { enterprises, fetchEnterprises } = useEnterprise();
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { assets, isLoading, error, createAsset, getAssets, clearError } = useAsset();

  /**
   * 页面加载时获取企业列表
   */
  useEffect(() => {
    fetchEnterprises();
  }, [fetchEnterprises]);

  /**
   * 处理企业选择变化
   */
  const handleEnterpriseChange = (enterpriseId: string | null) => {
    setSelectedEnterpriseId(enterpriseId);
    if (enterpriseId) {
      const enterprise = enterprises.find((e) => e.id === enterpriseId);
      if (enterprise) {
        setCurrentEnterprise({
          ...enterprise,
          members: [],
        });
      }
    } else {
      setCurrentEnterprise(null);
    }
  };

  /**
   * 计算资产统计数据
   */
  const stats = useMemo(() => {
    if (!assets.length) {
      return {
        total: 0,
        minted: 0,
        draft: 0,
      };
    }

    return {
      total: assets.length,
      minted: assets.filter((a) => a.status === 'MINTED').length,
      draft: assets.filter((a) => a.status === 'DRAFT').length,
    };
  }, [assets]);

  /**
   * 加载资产列表
   */
  useEffect(() => {
    if (currentEnterprise) {
      getAssets({
        enterprise_id: currentEnterprise.id,
        page: 1,
        page_size: 20,
      });
    }
  }, [currentEnterprise, getAssets]);

  /**
   * 刷新资产列表
   */
  const handleRefreshAssets = () => {
    if (currentEnterprise) {
      getAssets({
        enterprise_id: currentEnterprise.id,
        page: 1,
        page_size: 20,
      });
    }
  };

  /**
   * 处理创建资产
   */
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

  /**
   * 处理资产点击
   */
  const handleAssetClick = (asset: Asset) => {
    console.log('Asset clicked:', asset);
    // 可以在这里添加导航到详情页的逻辑
  };

  /**
   * 清除错误信息
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  /**
   * 渲染统计卡片
   */
  const renderStats = () => (
    <div className="asset-stats">
      <div className="asset-stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-value">{stats.total}</div>
        <div className="stat-label">资产总数</div>
      </div>
      <div className="asset-stat-card">
        <div className="stat-icon">✓</div>
        <div className="stat-value">{stats.minted}</div>
        <div className="stat-label">已铸造</div>
      </div>
      <div className="asset-stat-card">
        <div className="stat-icon">📝</div>
        <div className="stat-value">{stats.draft}</div>
        <div className="stat-label">草稿</div>
      </div>
    </div>
  );

  return (
    <div className="asset-page">
      <div className="asset-header">
        <h1>资产管理</h1>
        <div className="enterprise-select-wrapper">
          <Select
            placeholder="请选择企业"
            style={{ width: 240 }}
            value={selectedEnterpriseId}
            onChange={handleEnterpriseChange}
            allowClear
            options={enterprises.map((e) => ({
              value: e.id,
              label: e.name || '未命名企业',
            }))}
          />
        </div>
        {!showForm && currentEnterprise && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <span>+</span>
            创建资产
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {!currentEnterprise ? (
        <div className="info-message">
          <h2>请先选择企业</h2>
          <p>请在上方选择企业以查看和管理资产。</p>
        </div>
      ) : (
        <>
          {!showForm && renderStats()}

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
            <AssetList
              assets={assets}
              isLoading={isLoading}
              onAssetClick={handleAssetClick}
              onRefresh={handleRefreshAssets}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Assets;
