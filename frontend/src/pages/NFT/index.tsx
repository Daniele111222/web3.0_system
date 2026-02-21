/**
 * NFT 铸造主页面
 * 集成 NFT 铸造相关的所有功能和组件
 *
 * 页面功能：
 * - 展示可铸造资产列表
 * - 单条铸造和批量铸造
 * - 铸造状态实时监控
 * - 铸造统计展示
 * - 合约信息展示
 *
 * 设计风格：赛博朋克数字资产主题
 * - 深色背景配合霓虹发光效果
 * - 渐变色彩展示不同状态
 * - 科技感动画和交互反馈
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Empty,
  Spin,
  Alert,
  Tabs,
  Badge,
  Typography,
  Space,
  Tooltip,
  message,
  Tag,
} from 'antd';
import {
  ThunderboltOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  FileTextOutlined,
  AppstoreAddOutlined,
  ClusterOutlined,
} from '@ant-design/icons';
import { useMint, useContract, useMintStatistics } from '../../hooks/useNFT';
import { MintCard } from '../../components/nft/MintCard';
import { BatchMintModal } from '../../components/nft/BatchMintModal';
import type { NFTAssetCardData, ContractInfoResponse } from '../../types/nft';
import { AssetMintStatus, MintStage } from '../../types/nft';
import styles from './style.module.less';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// ============================================
// 模拟数据（实际项目中应从 API 获取）
// ============================================

const MOCK_ASSETS: NFTAssetCardData[] = [
  {
    asset_id: 'uuid-1',
    asset_name: '发明专利 - 区块链共识算法优化',
    asset_type: '专利',
    description: '一种基于权益证明的共识机制优化方案',
    status: AssetMintStatus.DRAFT,
    created_at: '2026-02-15T10:30:00Z',
    creator_name: '张三',
  },
  {
    asset_id: 'uuid-2',
    asset_name: '软件著作权 - NFT交易平台',
    asset_type: '软件著作权',
    description: '基于以太坊的NFT交易与管理平台',
    status: AssetMintStatus.PENDING,
    created_at: '2026-02-16T14:20:00Z',
    creator_name: '李四',
  },
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
    asset_id: 'uuid-4',
    asset_name: '版权作品 - 数字艺术创作',
    asset_type: '版权',
    description: 'AI辅助生成的数字艺术作品',
    status: AssetMintStatus.MINTED,
    token_id: 42,
    tx_hash: '0xabc123def456789012345678901234567890123456789012345678901234abcd',
    contract_address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    metadata_uri: 'ipfs://QmTest123...',
    created_at: '2026-02-18T16:45:00Z',
    creator_name: '赵六',
  },
  {
    asset_id: 'uuid-5',
    asset_name: '商业秘密 - 核心算法文档',
    asset_type: '商业秘密',
    description: '企业核心技术保护文档',
    status: AssetMintStatus.MINT_FAILED,
    mint_stage: MintStage.FAILED,
    mint_progress: 0,
    created_at: '2026-02-19T11:30:00Z',
    creator_name: '钱七',
  },
];

// ============================================
// 辅助组件
// ============================================

/**
 * 统计卡片组件
 */
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
}> = ({ title, value, icon, color, suffix }) => (
  <Card className={styles.statCard} bordered={false}>
    <div className={styles.statContent}>
      <div className={styles.statIcon} style={{ color, background: `${color}20` }}>
        {icon}
      </div>
      <div className={styles.statInfo}>
        <Text type="secondary" className={styles.statTitle}>
          {title}
        </Text>
        <div className={styles.statValue} style={{ color }}>
          <Statistic value={value} suffix={suffix} />
        </div>
      </div>
    </div>
  </Card>
);

/**
 * 合约信息卡片组件
 */
const ContractInfoCard: React.FC<{
  info: ContractInfoResponse | null;
  loading: boolean;
}> = ({ info, loading }) => {
  if (loading) {
    return (
      <Card className={styles.contractInfoCard} bordered={false}>
        <Spin spinning={true}>
          <div style={{ height: 100 }} />
        </Spin>
      </Card>
    );
  }

  if (!info) {
    return (
      <Card className={styles.contractInfoCard} bordered={false}>
        <Empty description="未获取到合约信息" />
      </Card>
    );
  }

  return (
    <Card
      className={styles.contractInfoCard}
      bordered={false}
      title={
        <div className={styles.contractHeader}>
          <ClusterOutlined />
          <span>合约信息</span>
          <Badge
            status={info.is_connected ? 'success' : 'error'}
            text={info.is_connected ? '已连接' : '未连接'}
          />
        </div>
      }
    >
      <div className={styles.contractDetails}>
        <div className={styles.detailRow}>
          <Text type="secondary">合约地址</Text>
          <Tooltip title={info.contract_address}>
            <Text code className={styles.addressText}>
              {info.contract_address.slice(0, 8)}...
              {info.contract_address.slice(-6)}
            </Text>
          </Tooltip>
        </div>
        <div className={styles.detailRow}>
          <Text type="secondary">部署者</Text>
          <Tooltip title={info.deployer_address}>
            <Text code className={styles.addressText}>
              {info.deployer_address.slice(0, 8)}...
              {info.deployer_address.slice(-6)}
            </Text>
          </Tooltip>
        </div>
        <div className={styles.detailRow}>
          <Text type="secondary">链 ID</Text>
          <Tag color="blue">{info.chain_id}</Tag>
        </div>
        <div className={styles.detailRow}>
          <Text type="secondary">ABI 状态</Text>
          <Tag color={info.has_abi ? 'success' : 'error'}>{info.has_abi ? '已加载' : '未加载'}</Tag>
        </div>
      </div>
    </Card>
  );
};

// ============================================
// 主页面组件
// ============================================

const NFTPage: React.FC = () => {
  // 使用自定义 Hooks
  const { loading: mintLoading, error: mintError, mint, batchMint, clearError } = useMint();

  const {
    loading: contractLoading,
    error: contractError,
    contractInfo,
    fetchContractInfo,
  } = useContract();

  const { loading: statsLoading, statistics: rawStats, fetchStatistics } = useMintStatistics();

  // 本地状态
  const [activeTab, setActiveTab] = useState('assets');
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [batchResults, setBatchResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    items: any[];
  } | null>(null);

  // 统计数据转换
  const statistics = useMemo(() => {
    if (!rawStats) return null;
    return {
      total_assets: rawStats.total_assets,
      minted_count: rawStats.minted_count,
      minting_count: rawStats.minting_count,
      failed_count: rawStats.failed_count,
      pending_count: rawStats.pending_count,
      draft_count: rawStats.draft_count,
      recent_mints: rawStats.recent_mints || [],
    };
  }, [rawStats]);

  // 可铸造资产
  const mintableAssets = useMemo(() => {
    return MOCK_ASSETS.filter((asset) => asset.status === 'DRAFT' || asset.status === 'PENDING');
  }, []);

  // 铸造中资产
  const mintingAssets = useMemo(() => {
    return MOCK_ASSETS.filter((asset) => asset.status === 'MINTING');
  }, []);

  // 已铸造资产
  const mintedAssets = useMemo(() => {
    return MOCK_ASSETS.filter((asset) => asset.status === 'MINTED');
  }, []);

  // 初始加载数据
  useEffect(() => {
    fetchContractInfo();
    fetchStatistics();
  }, [fetchContractInfo, fetchStatistics]);

  // 处理单条铸造
  const handleMint = async (assetId: string) => {
    try {
      // 这里应该从用户钱包获取地址，暂时使用示例地址
      const mockAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      await mint(assetId, { minter_address: mockAddress });
      message.success('铸造请求已提交');
      fetchStatistics();
    } catch (error) {
      message.error('铸造失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 处理批量铸造
  const handleBatchMint = async (selectedIds: string[], minterAddress: string) => {
    try {
      const result = await batchMint(selectedIds, minterAddress);

      // 设置批量铸造结果
      setBatchResults({
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        items: result.results.map((item) => ({
          asset_id: item.asset_id,
          status: item.status,
          token_id: item.token_id,
          tx_hash: item.tx_hash,
          error: item.error,
        })),
      });

      fetchStatistics();
    } catch (error) {
      message.error('批量铸造失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 渲染统计卡片
  const renderStatCards = () => {
    if (!statistics) return null;

    return (
      <Row gutter={[16, 16]} className={styles.statCardsRow}>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="可铸造"
            value={statistics.draft_count + statistics.pending_count}
            icon={<FileTextOutlined />}
            color="#00d4ff"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="铸造中"
            value={statistics.minting_count}
            icon={<FireOutlined />}
            color="#ffaa00"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="已铸造"
            value={statistics.minted_count}
            icon={<CheckCircleOutlined />}
            color="#00ff88"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="失败"
            value={statistics.failed_count}
            icon={<ExclamationCircleOutlined />}
            color="#ff4444"
          />
        </Col>
      </Row>
    );
  };

  // 渲染资产列表
  const renderAssetList = (assets: NFTAssetCardData[], emptyText: string) => {
    if (assets.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={emptyText}
          className={styles.emptyState}
        />
      );
    }

    return (
      <Row gutter={[16, 16]}>
        {assets.map((asset) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={asset.asset_id}>
            <MintCard asset={asset} onMint={handleMint} loading={mintLoading} />
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className={styles.nftPage}>
      {/* 页面标题区 */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerIconWrapper}>
            <ThunderboltOutlined className={styles.headerIcon} />
          </div>
          <div className={styles.headerText}>
            <Title level={2} className={styles.pageTitle}>
              NFT 铸造中心
            </Title>
            <Paragraph className={styles.pageSubtitle}>
              将您的知识产权资产铸造为 NFT，实现数字孪生上链
            </Paragraph>
          </div>
        </div>

        {/* 批量铸造按钮 */}
        <Button
          type="primary"
          size="large"
          icon={<AppstoreAddOutlined />}
          className={styles.batchMintBtn}
          onClick={() => setBatchModalVisible(true)}
          disabled={mintableAssets.length === 0}
        >
          批量铸造
          {mintableAssets.length > 0 && (
            <Badge count={mintableAssets.length} className="batch-badge" />
          )}
        </Button>
      </div>

      {/* 错误提示 */}
      {(mintError || contractError) && (
        <Alert
          message="错误"
          description={mintError || contractError}
          type="error"
          closable
          onClose={clearError}
          className={styles.errorAlert}
        />
      )}

      {/* 统计卡片区 */}
      <div className={styles.statsSection}>
        <Spin spinning={statsLoading}>{renderStatCards()}</Spin>
      </div>

      {/* 主内容区 */}
      <div className={styles.mainContent}>
        <Row gutter={[24, 24]}>
          {/* 左侧：资产列表 */}
          <Col xs={24} lg={18}>
            <Card className={styles.assetsCard} bordered={false}>
              <Tabs activeKey={activeTab} onChange={setActiveTab} className={styles.assetsTabs}>
                <TabPane
                  tab={
                    <span>
                      <FileTextOutlined />
                      可铸造
                      {mintableAssets.length > 0 && (
                        <Badge count={mintableAssets.length} className={styles.tabBadge} />
                      )}
                    </span>
                  }
                  key="assets"
                >
                  {renderAssetList(mintableAssets, '暂无可铸造的资产')}
                </TabPane>

                <TabPane
                  tab={
                    <span>
                      <FireOutlined />
                      铸造中
                      {mintingAssets.length > 0 && (
                        <Badge count={mintingAssets.length} className="tab-badge warning" />
                      )}
                    </span>
                  }
                  key="minting"
                >
                  {renderAssetList(mintingAssets, '暂无铸造中的资产')}
                </TabPane>

                <TabPane
                  tab={
                    <span>
                      <CheckCircleOutlined />
                      已铸造
                      {mintedAssets.length > 0 && (
                        <Badge count={mintedAssets.length} className="tab-badge success" />
                      )}
                    </span>
                  }
                  key="minted"
                >
                  {renderAssetList(mintedAssets, '暂无已铸造的资产')}
                </TabPane>
              </Tabs>
            </Card>
          </Col>

          {/* 右侧：合约信息和快捷操作 */}
          <Col xs={24} lg={6}>
            <div className={styles.sidebar}>
              {/* 合约信息 */}
              <ContractInfoCard info={contractInfo} loading={contractLoading} />

              {/* 快捷操作 */}
              <Card
                className={styles.quickActionsCard}
                title={
                  <span>
                    <ThunderboltOutlined />
                    快捷操作
                  </span>
                }
                bordered={false}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Button
                    type="primary"
                    block
                    icon={<AppstoreAddOutlined />}
                    onClick={() => setBatchModalVisible(true)}
                    disabled={mintableAssets.length === 0}
                  >
                    批量铸造
                  </Button>
                  <Button
                    block
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      fetchContractInfo();
                      fetchStatistics();
                      message.success('数据已刷新');
                    }}
                  >
                    刷新数据
                  </Button>
                </Space>
              </Card>

              {/* 帮助提示 */}
              <Card className={styles.helpCard} bordered={false}>
                <Title level={5}>铸造指南</Title>
                <ul className={styles.helpList}>
                  <li>确保资产已上传附件</li>
                  <li>资产状态需为"草稿"或"待审批"</li>
                  <li>铸造需要支付 Gas 费用</li>
                  <li>铸造完成后可在区块链浏览器查看</li>
                </ul>
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      {/* 批量铸造模态框 */}
      <BatchMintModal
        visible={batchModalVisible}
        assets={mintableAssets}
        onCancel={() => {
          setBatchModalVisible(false);
          setBatchResults(null);
        }}
        onConfirm={handleBatchMint}
        loading={mintLoading}
        results={batchResults}
      />
    </div>
  );
};

export default NFTPage;
