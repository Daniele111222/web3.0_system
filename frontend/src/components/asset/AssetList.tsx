import type { Asset } from '../../types';
import './Asset.less';

interface AssetListProps {
  assets: Asset[];
  isLoading: boolean;
  onAssetClick: (asset: Asset) => void;
}

/**
 * 资产列表组件
 */
export function AssetList({ assets, isLoading, onAssetClick }: AssetListProps) {
  /**
   * 获取资产类型显示名称
   */
  const getAssetTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      PATENT: '专利',
      TRADEMARK: '商标',
      COPYRIGHT: '版权',
      TRADE_SECRET: '商业秘密',
      DIGITAL_WORK: '数字作品',
    };
    return typeMap[type] || type;
  };

  /**
   * 获取资产状态显示名称
   */
  const getAssetStatusName = (status: string): string => {
    const statusMap: Record<string, string> = {
      DRAFT: '草稿',
      MINTED: '已铸造',
      TRANSFERRED: '已转移',
      LICENSED: '已授权',
      STAKED: '已质押',
    };
    return statusMap[status] || status;
  };

  /**
   * 获取状态徽章类名
   */
  const getStatusBadgeClass = (status: string): string => {
    const classMap: Record<string, string> = {
      DRAFT: 'badge-draft',
      MINTED: 'badge-minted',
      TRANSFERRED: 'badge-minted',
      LICENSED: 'badge-minted',
      STAKED: 'badge-minted',
    };
    return `asset-card-badge ${classMap[status] || 'badge-draft'}`;
  };

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  if (assets.length === 0) {
    return (
      <div className="empty-state">
        <h3>暂无资产</h3>
        <p>点击"创建资产"按钮开始录入您的知识产权资产</p>
      </div>
    );
  }

  return (
    <div className="asset-list">
      {assets.map((asset) => (
        <div key={asset.id} className="asset-card" onClick={() => onAssetClick(asset)}>
          <div className="asset-card-header">
            <h3 className="asset-card-title">{asset.name}</h3>
            <span className={getStatusBadgeClass(asset.status)}>
              {getAssetStatusName(asset.status)}
            </span>
          </div>

          <p className="asset-card-description">
            {asset.description.length > 150
              ? `${asset.description.substring(0, 150)}...`
              : asset.description}
          </p>

          <div className="asset-card-meta">
            <span>类型：{getAssetTypeName(asset.type)}</span>
            <span>创作人：{asset.creator}</span>
            <span>创建时间：{formatDate(asset.created_at)}</span>
            {asset.attachments && asset.attachments.length > 0 && (
              <span>附件：{asset.attachments.length} 个</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
