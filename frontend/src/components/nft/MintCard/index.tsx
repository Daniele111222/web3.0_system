/**
 * NFT 铸造卡片组件
 * 展示单个资产的 NFT 铸造状态和操作
 *
 * 设计特点：
 * - 赛博朋克科技风格
 * - 动态发光边框效果
 * - 实时铸造进度展示
 * - 交互式操作按钮
 */

import React from 'react';
import { Card, Button, Tag, Space, Tooltip, Badge } from 'antd';
import {
  ThunderboltOutlined,
  ReloadOutlined,
  EyeOutlined,
  LinkOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
} from '@ant-design/icons';
import type { AssetMintStatus, MintStage, MintCardProps } from '../../../types/nft';
import './style.less';

// ============================================
// 状态配置映射
// ============================================

/** 资产状态配置 */
const STATUS_CONFIG: Record<
  AssetMintStatus,
  {
    label: string;
    color: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  DRAFT: {
    label: '草稿',
    color: 'default',
    icon: <FileTextOutlined />,
    description: '资产尚未提交铸造',
  },
  PENDING: {
    label: '待铸造',
    color: 'processing',
    icon: <ClockCircleOutlined />,
    description: '等待铸造开始',
  },
  MINTING: {
    label: '铸造中',
    color: 'warning',
    icon: <FireOutlined />,
    description: 'NFT 正在上链中',
  },
  MINTED: {
    label: '已铸造',
    color: 'success',
    icon: <CheckCircleOutlined />,
    description: 'NFT 铸造完成',
  },
  MINT_FAILED: {
    label: '铸造失败',
    color: 'error',
    icon: <ExclamationCircleOutlined />,
    description: '铸造过程出错，可重试',
  },
  REJECTED: {
    label: '已拒绝',
    color: 'default',
    icon: <ExclamationCircleOutlined />,
    description: '资产审批被拒绝',
  },
};

/** 铸造阶段配置 */
const STAGE_CONFIG: Record<
  MintStage,
  {
    label: string;
    progress: number;
    description: string;
  }
> = {
  PREPARING: {
    label: '准备中',
    progress: 10,
    description: '准备 NFT 元数据',
  },
  SUBMITTING: {
    label: '提交中',
    progress: 30,
    description: '提交区块链交易',
  },
  CONFIRMING: {
    label: '确认中',
    progress: 70,
    description: '等待链上确认',
  },
  COMPLETED: {
    label: '已完成',
    progress: 100,
    description: '铸造完成',
  },
  FAILED: {
    label: '失败',
    progress: 0,
    description: '铸造失败',
  },
};

// ============================================
// 组件实现
// ============================================

/**
 * 铸造进度条组件
 * 展示当前铸造阶段和进度
 */
const MintProgressBar: React.FC<{
  stage: MintStage;
  progress: number;
  status: AssetMintStatus;
}> = ({ stage, progress, status }) => {
  const stageConfig = STAGE_CONFIG[stage] || STAGE_CONFIG.PREPARING;

  // 如果铸造失败，显示错误状态
  const isFailed = status === 'MINT_FAILED' || stage === 'FAILED';

  // 计算实际显示进度
  const displayProgress = isFailed ? 0 : Math.max(stageConfig.progress, progress);

  return (
    <div className="mint-progress-bar">
      <div className="progress-header">
        <span className="stage-label">{stageConfig.label}</span>
        <span className={`progress-percentage ${isFailed ? 'error' : ''}`}>
          {isFailed ? '失败' : `${displayProgress}%`}
        </span>
      </div>

      <div className="progress-track">
        <div
          className={`progress-fill ${isFailed ? 'error' : ''}`}
          style={{ width: `${displayProgress}%` }}
        />
        {/* 阶段标记点 */}
        {['PREPARING', 'SUBMITTING', 'CONFIRMING', 'COMPLETED'].map((s, index) => {
          const isActive =
            stage === s ||
            stage === 'COMPLETED' ||
            (stage === 'CONFIRMING' && index < 3) ||
            (stage === 'SUBMITTING' && index < 2) ||
            (stage === 'PREPARING' && index < 1);

          return (
            <div
              key={s}
              className={`stage-dot ${isActive ? 'active' : ''}`}
              style={{ left: `${(index + 1) * 25}%` }}
            />
          );
        })}
      </div>

      <p className="stage-description">{stageConfig.description}</p>
    </div>
  );
};

/**
 * NFT 铸造卡片主组件
 * 展示资产信息和铸造操作
 */
export const MintCard: React.FC<MintCardProps> = ({
  asset,
  onMint,
  onRetry,
  onViewDetail,
  loading = false,
}) => {
  // 获取状态配置
  const statusConfig = STATUS_CONFIG[asset.status] || STATUS_CONFIG.DRAFT;

  // 判断是否可以铸造
  const canMint = asset.status === 'DRAFT' || asset.status === 'PENDING';

  // 判断是否可以重试
  const canRetry = asset.status === 'MINT_FAILED' && asset.mint_progress !== undefined;

  // 是否正在铸造中
  const isMinting = asset.status === 'MINTING';

  // 是否已铸造完成
  const isMinted = asset.status === 'MINTED';

  /**
   * 处理铸造按钮点击
   */
  const handleMint = () => {
    if (onMint && canMint) {
      onMint(asset.asset_id);
    }
  };

  /**
   * 处理重试按钮点击
   */
  const handleRetry = () => {
    if (onRetry && canRetry) {
      onRetry(asset.asset_id);
    }
  };

  /**
   * 处理查看详情点击
   */
  const handleViewDetail = () => {
    if (onViewDetail) {
      onViewDetail(asset.asset_id);
    }
  };

  return (
    <Card
      className={`mint-card ${isMinting ? 'minting' : ''} ${isMinted ? 'minted' : ''}`}
      bodyStyle={{ padding: 0 }}
      bordered={false}
    >
      {/* 卡片头部 - 缩略图和状态 */}
      <div className="card-header">
        <div className="asset-thumbnail">
          {asset.thumbnail_url ? (
            <img src={asset.thumbnail_url} alt={asset.asset_name} />
          ) : (
            <div className="thumbnail-placeholder">
              <FileTextOutlined />
            </div>
          )}

          {/* 状态徽章 */}
          <Badge
            className="status-badge"
            status={
              isMinting ? 'processing' : isMinted ? 'success' : canRetry ? 'error' : 'default'
            }
          />
        </div>

        <div className="asset-info">
          <h3 className="asset-name" title={asset.asset_name}>
            {asset.asset_name}
          </h3>
          <p className="asset-type">{asset.asset_type}</p>
          <div className="status-tag">
            <Tag icon={statusConfig.icon} color={statusConfig.color}>
              {statusConfig.label}
            </Tag>
          </div>
        </div>
      </div>

      {/* 铸造进度条 - 仅在铸造中或铸造失败时显示 */}
      {(isMinting || (asset.status === 'MINT_FAILED' && asset.mint_stage)) && (
        <div className="mint-progress-section">
          <MintProgressBar
            stage={asset.mint_stage || ('FAILED' as MintStage)}
            progress={asset.mint_progress || 0}
            status={asset.status}
          />
        </div>
      )}

      {/* 已铸造信息 */}
      {isMinted && (
        <div className="minted-info">
          <div className="info-row">
            <span className="label">Token ID:</span>
            <span className="value">#{asset.token_id}</span>
          </div>
          {asset.tx_hash && (
            <div className="info-row">
              <span className="label">交易哈希:</span>
              <Tooltip title={asset.tx_hash}>
                <span className="value hash">
                  {asset.tx_hash.slice(0, 10)}...{asset.tx_hash.slice(-8)}
                </span>
              </Tooltip>
            </div>
          )}
        </div>
      )}

      {/* 操作按钮区 */}
      <div className="card-actions">
        <Space wrap>
          {/* 铸造按钮 - 仅在可铸造时显示 */}
          {canMint && (
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleMint}
              loading={loading}
              className="mint-btn"
            >
              铸造 NFT
            </Button>
          )}

          {/* 重试按钮 - 仅在可重试时显示 */}
          {canRetry && (
            <Button
              type="primary"
              danger
              icon={<ReloadOutlined />}
              onClick={handleRetry}
              loading={loading}
              className="retry-btn"
            >
              重试铸造
            </Button>
          )}

          {/* 查看详情按钮 - 已铸造资产显示 */}
          {isMinted && (
            <Tooltip title="查看区块链浏览器">
              <Button icon={<LinkOutlined />} onClick={handleViewDetail} className="link-btn">
                查看链上信息
              </Button>
            </Tooltip>
          )}

          {/* 通用查看详情按钮 */}
          {!isMinted && onViewDetail && (
            <Button icon={<EyeOutlined />} onClick={handleViewDetail} className="detail-btn">
              查看详情
            </Button>
          )}
        </Space>
      </div>
    </Card>
  );
};

export default MintCard;
