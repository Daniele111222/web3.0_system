/**
 * NFT 铸造任务页面
 * 展示和管理正在进行的铸造任务
 */
import React, { useState, useMemo } from 'react';
import { Card, Progress, Tag, Button, Empty, Spin, Badge, Space, Col, Row } from 'antd';
import {
  FireOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { NFTAssetCardData } from '../../../types/nft';
import { AssetMintStatus, MintStage } from '../../../types/nft';
import './style.less';

// const { Text, Title } = Typography;

// 模拟正在铸造的资产
const MOCK_MINTING_ASSETS: NFTAssetCardData[] = [
  {
    asset_id: 'uuid-3',
    asset_name: '商标权 - 元宇宙品牌Logo',
    asset_type: '商标',
    description: '虚拟世界品牌标识设计',
    status: AssetMintStatus.MINTING,
    mint_stage: MintStage.CONFIRMING,
    mint_progress: 75,
    created_at: '2026-02-17T09:15:00Z',
    creator_name: '王五',
  },
  {
    asset_id: 'uuid-6',
    asset_name: '发明专利 - 智能合约安全机制',
    asset_type: '专利',
    description: '一种智能合约安全防护方法',
    status: AssetMintStatus.MINTING,
    mint_stage: MintStage.SUBMITTING,
    mint_progress: 35,
    created_at: '2026-02-19T14:30:00Z',
    creator_name: '孙八',
  },
];

// 铸造阶段配置
const STAGE_CONFIG: Record<
  MintStage,
  {
    label: string;
    color: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  PREPARING: {
    label: '准备中',
    color: '#00d4ff',
    icon: <ClockCircleOutlined />,
    description: '准备 NFT 元数据',
  },
  SUBMITTING: {
    label: '提交中',
    color: '#ffaa00',
    icon: <ThunderboltOutlined />,
    description: '提交区块链交易',
  },
  CONFIRMING: {
    label: '确认中',
    color: '#00ff88',
    icon: <CheckCircleOutlined />,
    description: '等待链上确认',
  },
  COMPLETED: {
    label: '已完成',
    color: '#00ff88',
    icon: <CheckCircleOutlined />,
    description: '铸造完成',
  },
  FAILED: {
    label: '失败',
    color: '#ff4444',
    icon: <ExclamationCircleOutlined />,
    description: '铸造失败',
  },
};

/**
 * 铸造任务项组件
 */
interface MintingTaskItemProps {
  asset: NFTAssetCardData;
  onRetry?: (assetId: string) => void;
}

const MintingTaskItem: React.FC<MintingTaskItemProps> = ({ asset, onRetry }) => {
  const stage = asset.mint_stage || 'PREPARING';
  const progress = asset.mint_progress || 0;
  const stageConfig = STAGE_CONFIG[stage];

  return (
    <Card className="minting-task-card" bordered={false}>
      <div className="task-header">
        <div className="task-info">
          <h4 className="asset-name">{asset.asset_name}</h4>
          <div className="asset-meta">
            <Tag>{asset.asset_type}</Tag>
            <span className="creator">创建者: {asset.creator_name}</span>
          </div>
        </div>
        <div className="task-status">
          <Badge status={stage === 'FAILED' ? 'error' : 'processing'} text={stageConfig.label} />
        </div>
      </div>

      <div className="task-progress">
        <div className="progress-header">
          <span className="stage-label">
            {stageConfig.icon} {stageConfig.description}
          </span>
          <span className="progress-text">{progress}%</span>
        </div>
        <Progress
          percent={progress}
          strokeColor={stageConfig.color}
          trailColor="rgba(255,255,255,0.1)"
          showInfo={false}
        />
      </div>

      <div className="task-actions">
        <Space>
          <Button type="primary" icon={<LinkOutlined />} size="small" disabled={!asset.tx_hash}>
            查看交易
          </Button>
          {stage === 'FAILED' && (
            <Button
              danger
              icon={<ReloadOutlined />}
              size="small"
              onClick={() => onRetry?.(asset.asset_id)}
            >
              重试
            </Button>
          )}
        </Space>
      </div>
    </Card>
  );
};

/**
 * 铸造任务页面
 */
const NFTMintingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // 过滤正在铸造的资产
  const mintingAssets = useMemo(() => {
    return MOCK_MINTING_ASSETS.filter((asset) => asset.status === 'MINTING');
  }, []);

  // 处理重试
  const handleRetry = (assetId: string) => {
    console.log('Retry minting:', assetId);
  };

  // 渲染任务列表
  const renderTaskList = () => {
    if (mintingAssets.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无正在铸造的任务"
          className="empty-state"
        />
      );
    }

    return (
      <div className="minting-task-list">
        {mintingAssets.map((asset) => (
          <MintingTaskItem key={asset.asset_id} asset={asset} onRetry={handleRetry} />
        ))}
      </div>
    );
  };

  return (
    <div className="nft-minting-page">
      {/* 页面标题 */}
      <div className="page-header">
        <div className="header-content">
          <FireOutlined className="header-icon" />
          <div className="header-text">
            <h1 className="page-title">铸造任务</h1>
            <p className="page-subtitle">监控和管理正在进行的 NFT 铸造任务</p>
          </div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => setLoading(true)} loading={loading}>
          刷新
        </Button>
      </div>

      {/* 任务统计 */}
      <Card className="stats-card" bordered={false} style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={12} md={6}>
            <div className="stat-item">
              <div className="stat-label">正在铸造</div>
              <div className="stat-value primary">{mintingAssets.length}</div>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="stat-item">
              <div className="stat-label">等待确认</div>
              <div className="stat-value warning">
                {mintingAssets.filter((a) => a.mint_stage === 'CONFIRMING').length}
              </div>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="stat-item">
              <div className="stat-label">提交中</div>
              <div className="stat-value info">
                {mintingAssets.filter((a) => a.mint_stage === 'SUBMITTING').length}
              </div>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="stat-item">
              <div className="stat-label">今日完成</div>
              <div className="stat-value success">0</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 任务列表 */}
      <Card
        className="tasks-card"
        title={
          <div className="card-title">
            <ThunderboltOutlined />
            <span>铸造任务列表</span>
            <Badge count={mintingAssets.length} className="task-badge" />
          </div>
        }
        bordered={false}
      >
        <Spin spinning={loading}>{renderTaskList()}</Spin>
      </Card>
    </div>
  );
};

export default NFTMintingPage;
