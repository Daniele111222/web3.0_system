import type { Asset } from '../../types';
import './Asset.less';
import { Button, message, Modal } from 'antd';
import assetService from '../../services/asset';
import { useCallback, useRef, useEffect } from 'react';

interface AssetListProps {
  assets: Asset[];
  isLoading: boolean;
  onAssetClick: (asset: Asset) => void;
  onRefresh?: () => void;
}

/**
 * 资产列表组件
 *
 * 以卡片网格形式展示资产列表
 *
 * @param assets - 资产数据数组
 * @param isLoading - 加载状态
 * @param onAssetClick - 点击资产卡片时的回调
 */
export function AssetList({ assets, isLoading, onAssetClick, onRefresh }: AssetListProps) {
  // 使用 ref 跟踪组件挂载状态，防止内存泄漏
  const isMountedRef = useRef(true);

  // 组件卸载时重置挂载状态
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
   * 获取资产类型图标
   */
  const getAssetTypeIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      PATENT: '⚡',
      TRADEMARK: '™️',
      COPYRIGHT: '©️',
      TRADE_SECRET: '🔒',
      DIGITAL_WORK: '🎨',
    };
    return iconMap[type] || '📄';
  };

  /**
   * 获取资产状态显示名称
   */
  const getAssetStatusName = (status: string): string => {
    const statusMap: Record<string, string> = {
      DRAFT: '草稿',
      PENDING: '待审批',
      MINTED: '已铸造',
      REJECTED: '已拒绝',
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
      PENDING: 'badge-pending',
      MINTED: 'badge-minted',
      REJECTED: 'badge-rejected',
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

  /**
   * 提交资产审批
   * 使用 useCallback 避免不必要的重渲染
   */
  const handleSubmitForApproval = useCallback(
    async (asset: Asset, e: React.MouseEvent) => {
      e.stopPropagation();

      // 检查是否有附件
      if (!asset.attachments || asset.attachments.length === 0) {
        Modal.warning({
          title: '无法提交审批',
          content: '资产必须至少有一个附件才能提交审批，请先上传附件。',
        });
        return;
      }

      Modal.confirm({
        title: '确认提交审批',
        content: `确定要提交"${asset.name}"进行审批吗？`,
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          const hideLoading = message.loading('正在提交审批...', 0);
          try {
            await assetService.submitForApproval(asset.id, {});

            if (isMountedRef.current) {
              message.success('提交审批成功');
              if (onRefresh) {
                onRefresh();
              }
            }
          } catch (error) {
            if (isMountedRef.current) {
              const errorMsg = error instanceof Error ? error.message : '提交审批失败';
              message.error(`提交审批失败: ${errorMsg}`);
            }
            console.error('提交资产审批失败:', error);
          } finally {
            hideLoading();
          }
        },
      });
    },
    [onRefresh]
  );

  // 加载状态
  if (isLoading) {
    return (
      <div className="loading">
        <span>正在加载资产数据...</span>
      </div>
    );
  }

  // 空状态
  if (assets.length === 0) {
    return (
      <div className="empty-state">
        <h3>暂无资产</h3>
        <p>点击"创建资产"按钮开始录入您的知识产权资产</p>
      </div>
    );
  }

  // 渲染资产列表
  return (
    <div className="asset-list">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="asset-card"
          onClick={() => onAssetClick(asset)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onAssetClick(asset);
            }
          }}
        >
          <div className="asset-card-header">
            <h3 className="asset-card-title">{asset.name}</h3>
            <span className={getStatusBadgeClass(asset.status)}>
              {getAssetStatusName(asset.status)}
            </span>
          </div>

          <p className="asset-card-description">
            {(asset.description?.length || 0) > 150
              ? `${asset.description!.substring(0, 150)}...`
              : asset.description || ''}
          </p>

          <div className="asset-card-meta">
            <span title={`类型：${getAssetTypeName(asset.type)}`}>
              <span>{getAssetTypeIcon(asset.type)}</span>
              {getAssetTypeName(asset.type)}
            </span>
            <span title={`创作人：${asset.creator_name}`}>
              <span>👤</span>
              {asset.creator_name}
            </span>
            <span title={`创建时间：${formatDate(asset.created_at)}`}>
              <span>📅</span>
              {formatDate(asset.created_at)}
            </span>
            {asset.attachments && asset.attachments.length > 0 && (
              <span title={`附件：${asset.attachments.length} 个`}>
                <span>📎</span>
                {asset.attachments.length} 个附件
              </span>
            )}
          </div>

          {asset.status === 'DRAFT' && (
            <div className="asset-card-actions">
              <Button
                type="primary"
                size="small"
                onClick={(e) => handleSubmitForApproval(asset, e)}
              >
                提交审批
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
