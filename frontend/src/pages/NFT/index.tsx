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
import { useNavigate } from 'react-router-dom';
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
  Modal,
  Input,
  InputNumber,
  Descriptions,
  Divider,
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
  SafetyOutlined,
} from '@ant-design/icons';
import { useMint, useContract, useMintStatistics, useNFTAssets } from '../../hooks/useNFT';
import { MintCard } from '../../components/nft/MintCard';
import { BatchMintModal } from '../../components/nft/BatchMintModal';
import type {
  BatchMintResultItem,
  ContractInfoResponse,
  MintGasEstimateResponse,
  MintNFTRequest,
  NFTAssetCardData,
} from '../../types/nft';
import nftService from '../../services/nft';
import styles from './style.module.less';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

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
              {info.contract_address
                ? `${info.contract_address.slice(0, 8)}...${info.contract_address.slice(-6)}`
                : '未设置'}
            </Text>
          </Tooltip>
        </div>
        <div className={styles.detailRow}>
          <Text type="secondary">部署者</Text>
          <Tooltip title={info.deployer_address}>
            <Text code className={styles.addressText}>
              {info.deployer_address
                ? `${info.deployer_address.slice(0, 8)}...${info.deployer_address.slice(-6)}`
                : '未设置'}
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
  const navigate = useNavigate();
  const {
    loading: mintLoading,
    error: mintError,
    mint,
    batchMint,
    retryMint,
    estimateMintGas,
    clearError,
  } = useMint();
  const { assets, fetchAssets } = useNFTAssets();

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
  const [mintModalVisible, setMintModalVisible] = useState(false);
  const [mintingAsset, setMintingAsset] = useState<NFTAssetCardData | null>(null);
  const [mintAddress, setMintAddress] = useState('');
  const [royaltyEnabled, setRoyaltyEnabled] = useState(false);
  const [royaltyReceiver, setRoyaltyReceiver] = useState('');
  const [royaltyFeeBps, setRoyaltyFeeBps] = useState(500);
  const [gasEstimate, setGasEstimate] = useState<MintGasEstimateResponse | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [batchResults, setBatchResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    items: BatchMintResultItem[];
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
    return assets.filter((asset) => asset.status === 'APPROVED');
  }, [assets]);

  // 铸造中资产
  const mintingAssets = useMemo(() => {
    return assets.filter((asset) => asset.status === 'MINTING' || asset.status === 'MINT_FAILED');
  }, [assets]);

  // 已铸造资产
  const mintedAssets = useMemo(() => {
    return assets.filter((asset) => asset.status === 'MINTED');
  }, [assets]);

  // 初始加载数据
  useEffect(() => {
    fetchContractInfo();
    fetchStatistics();
    fetchAssets();
  }, [fetchContractInfo, fetchStatistics, fetchAssets]);

  // 处理单条铸造
  const handleMint = async (assetId: string) => {
    const targetAsset = assets.find((item) => item.asset_id === assetId);
    if (!targetAsset) {
      return;
    }
    setMintingAsset(targetAsset);
    setGasEstimate(null);
    setMintAddress(localStorage.getItem('wallet_address') || '');
    setRoyaltyEnabled(false);
    setRoyaltyReceiver(localStorage.getItem('wallet_address') || '');
    setRoyaltyFeeBps(500);
    setMintModalVisible(true);
  };

  const handleEstimate = async () => {
    if (!mintingAsset) return;
    setEstimating(true);
    try {
      const estimate = await estimateMintGas(mintingAsset.asset_id, {
        minter_address: mintAddress || undefined,
        royalty_receiver: royaltyEnabled ? royaltyReceiver : undefined,
        royalty_fee_bps: royaltyEnabled ? royaltyFeeBps : undefined,
      });
      setGasEstimate(estimate);
    } catch (error) {
      message.error(`Gas 估算失败：${nftService.mapNftErrorMessage(error, '未知错误')}`);
    } finally {
      setEstimating(false);
    }
  };

  const handleMintConfirm = async () => {
    if (!mintingAsset) {
      return;
    }
    try {
      const payload: MintNFTRequest = {
        minter_address: mintAddress || undefined,
        royalty_receiver: royaltyEnabled ? royaltyReceiver : undefined,
        royalty_fee_bps: royaltyEnabled ? royaltyFeeBps : undefined,
      };
      await mint(mintingAsset.asset_id, payload);
      message.success('铸造请求已提交');
      setMintModalVisible(false);
      fetchStatistics();
      fetchAssets();
    } catch (error) {
      message.error(`铸造失败：${nftService.mapNftErrorMessage(error, '未知错误')}`);
    }
  };

  const handleRetry = async (assetId: string) => {
    try {
      const minterAddress = localStorage.getItem('wallet_address') || undefined;
      await retryMint(assetId, minterAddress);
      message.success('重试任务已提交');
      fetchStatistics();
      fetchAssets();
    } catch (error) {
      message.error(`重试失败：${nftService.mapNftErrorMessage(error, '未知错误')}`);
    }
  };

  // 处理批量铸造
  const handleBatchMint = async (selectedIds: string[], minterAddress?: string) => {
    try {
      const result = await batchMint(selectedIds, minterAddress);

      // 设置批量铸造结果
      setBatchResults({
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        items: result.results,
      });

      fetchStatistics();
      fetchAssets();
    } catch (error) {
      message.error(`批量铸造失败：${nftService.mapNftErrorMessage(error, '未知错误')}`);
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
            value={statistics.pending_count}
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
            <MintCard
              asset={asset}
              onMint={handleMint}
              onRetry={handleRetry}
              onViewDetail={(assetId) => {
                const target = assets.find((item) => item.asset_id === assetId);
                if (!target?.tx_hash) {
                  message.warning('当前资产暂无链上交易哈希，无法打开区块链浏览器');
                  return;
                }
                const explorerMap: Record<number, string> = {
                  11155111: 'https://sepolia.etherscan.io',
                  80002: 'https://amoy.polygonscan.com',
                  97: 'https://testnet.bscscan.com',
                };
                const chainId = Number(contractInfo?.chain_id || 0);
                const explorerBase =
                  import.meta.env.VITE_BLOCK_EXPLORER_URL || explorerMap[chainId] || '';
                if (explorerBase) {
                  window.open(
                    `${explorerBase}/tx/${target.tx_hash}`,
                    '_blank',
                    'noopener,noreferrer'
                  );
                  return;
                }
                navigate(`/blockchain-explorer?txHash=${encodeURIComponent(target.tx_hash)}`);
                void navigator.clipboard.writeText(target.tx_hash).catch(() => undefined);
                message.info(
                  `当前链 ${chainId || '-'} 使用内置区块链浏览器，已为你打开对应交易`
                );
              }}
              loading={mintLoading}
            />
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
                      铸造中/失败
                      {mintingAssets.length > 0 && (
                        <Badge count={mintingAssets.length} className="tab-badge warning" />
                      )}
                    </span>
                  }
                  key="minting"
                >
                  {renderAssetList(mintingAssets, '暂无铸造中或失败的资产')}
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
                  <li>资产状态需为"审批通过"</li>
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
      <Modal
        open={mintModalVisible}
        title="确认铸造参数"
        onCancel={() => setMintModalVisible(false)}
        onOk={handleMintConfirm}
        okText="确认铸造"
        cancelText="取消"
        okButtonProps={{ loading: mintLoading }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="资产名称">{mintingAsset?.asset_name}</Descriptions.Item>
            <Descriptions.Item label="资产类型">{mintingAsset?.asset_type}</Descriptions.Item>
          </Descriptions>
          <Input
            placeholder="接收地址（可选，不填则由后端自动回填）"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
          />
          <Divider style={{ margin: '8px 0' }} />
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              icon={<SafetyOutlined />}
              onClick={() => setRoyaltyEnabled((prev) => !prev)}
              type={royaltyEnabled ? 'primary' : 'default'}
            >
              {royaltyEnabled ? '已启用版税设置' : '启用版税设置'}
            </Button>
            {royaltyEnabled && (
              <>
                <Input
                  placeholder="版税接收地址"
                  value={royaltyReceiver}
                  onChange={(e) => setRoyaltyReceiver(e.target.value)}
                />
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={1000}
                  value={royaltyFeeBps}
                  onChange={(value) => setRoyaltyFeeBps(Number(value || 0))}
                  addonAfter="BPS (0-1000)"
                />
              </>
            )}
          </Space>
          <Button onClick={handleEstimate} loading={estimating}>
            预估 Gas
          </Button>
          {gasEstimate && (
            <Alert
              type="info"
              message={`预计 Gas: ${gasEstimate.estimated.gas_limit}`}
              description={`预计费用: ${gasEstimate.estimated.estimated_fee_eth} ETH`}
              showIcon
            />
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default NFTPage;
