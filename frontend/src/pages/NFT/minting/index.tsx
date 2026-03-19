/**
 * NFT 铸造任务页面
 * 展示和管理正在进行的铸造任务
 */
import React, { useState, useMemo, useEffect } from 'react';
import { Card, Progress, Tag, Button, Empty, Spin, Badge, Space, Col, Row, message } from 'antd';
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
import { useMint, useNFTAssets } from '../../../hooks/useNFT';
import nftService from '../../../services/nft';
import styles from './style.module.less';

// const { Text, Title } = Typography;

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
    <Card className={styles.mintingTaskCard} bordered={false}>
      <div className={styles.taskHeader}>
        <div className={styles.taskInfo}>
          <h4 className={styles.assetName}>{asset.asset_name}</h4>
          <div className={styles.assetMeta}>
            <Tag>{asset.asset_type}</Tag>
            <span className={styles.creator}>创建者: {asset.creator_name}</span>
          </div>
        </div>
        <div className={styles.taskStatus}>
          <Badge status={stage === 'FAILED' ? 'error' : 'processing'} text={stageConfig.label} />
        </div>
      </div>

      <div className={styles.taskProgress}>
        <div className={styles.progressHeader}>
          <span className={styles.stageLabel}>
            {stageConfig.icon} {stageConfig.description}
          </span>
          <span className={styles.progressText}>{progress}%</span>
        </div>
        <Progress
          percent={progress}
          strokeColor={stageConfig.color}
          trailColor="rgba(255,255,255,0.1)"
          showInfo={false}
        />
      </div>

      <div className={styles.taskActions}>
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
  const [refreshing, setRefreshing] = useState(false);
  const { retryMint } = useMint();
  const { loading, assets, fetchAssets } = useNFTAssets();

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // 过滤正在铸造的资产
  const mintingAssets = useMemo(() => {
    return assets.filter(
      (asset) =>
        asset.status === AssetMintStatus.MINTING || asset.status === AssetMintStatus.MINT_FAILED
    );
  }, [assets]);

  // 处理重试
  const handleRetry = async (assetId: string) => {
    try {
      const minterAddress = localStorage.getItem('wallet_address') || undefined;
      await retryMint(assetId, minterAddress);
      message.success('重试任务已提交');
      fetchAssets();
    } catch (error) {
      message.error(`重试失败：${nftService.mapNftErrorMessage(error, '未知错误')}`);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssets();
    setRefreshing(false);
  };

  // 渲染任务列表
  const renderTaskList = () => {
    if (mintingAssets.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无正在铸造的任务"
          className={styles.emptyState}
        />
      );
    }

    return (
      <div className={styles.mintingTaskList}>
        {mintingAssets.map((asset) => (
          <MintingTaskItem key={asset.asset_id} asset={asset} onRetry={handleRetry} />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.nftMintingPage}>
      {/* 页面标题 */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <FireOutlined className={styles.headerIcon} />
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>铸造任务</h1>
            <p className={styles.pageSubtitle}>监控和管理正在进行的 NFT 铸造任务</p>
          </div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={refreshing}>
          刷新
        </Button>
      </div>

      {/* 任务统计 */}
      <Card className={styles.statsCard} bordered={false} style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={12} md={6}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>正在铸造</div>
              <div className={`${styles.statValue} ${styles.primary}`}>{mintingAssets.length}</div>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>等待确认</div>
              <div className={`${styles.statValue} ${styles.warning}`}>
                {mintingAssets.filter((a) => a.mint_stage === 'CONFIRMING').length}
              </div>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>提交中</div>
              <div className={`${styles.statValue} ${styles.info}`}>
                {mintingAssets.filter((a) => a.mint_stage === 'SUBMITTING').length}
              </div>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>今日完成</div>
              <div className={`${styles.statValue} ${styles.success}`}>0</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 任务列表 */}
      <Card
        className={styles.tasksCard}
        title={
          <div className={styles.cardTitle}>
            <ThunderboltOutlined />
            <span>铸造任务列表</span>
            <Badge count={mintingAssets.length} className={styles.taskBadge} />
          </div>
        }
        bordered={false}
      >
        <Spin spinning={loading || refreshing}>{renderTaskList()}</Spin>
      </Card>
    </div>
  );
};

export default NFTMintingPage;
