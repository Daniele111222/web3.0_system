/**
 * NFT 资产管理页面
 * 展示和管理可铸造的资产列表
 */
import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Button, Empty, Alert, Tabs, message, Input, Select } from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons';
import { useMint, useMintStatistics } from '../../../hooks/useNFT';
import { MintCard } from '../../../components/nft/MintCard';
import { BatchMintModal } from '../../../components/nft/BatchMintModal';
import type { NFTAssetCardData } from '../../../types/nft';
import { AssetMintStatus, MintStage } from '../../../types/nft';
import styles from './style.module.less';

const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

// 模拟数据
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

/**
 * 资产管理页面
 */
const NFTAssetsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [batchModalVisible, setBatchModalVisible] = useState(false);

  const { loading: mintLoading, error: mintError, mint, clearError } = useMint();
  const { fetchStatistics } = useMintStatistics();

  // 资产类型列表
  const assetTypes = useMemo(() => {
    const types = new Set(MOCK_ASSETS.map((asset) => asset.asset_type));
    return Array.from(types);
  }, []);

  // 过滤资产
  const filteredAssets = useMemo(() => {
    return MOCK_ASSETS.filter((asset) => {
      // 状态筛选
      if (activeTab !== 'all') {
        const statusMap: Record<string, AssetMintStatus[]> = {
          mintable: [AssetMintStatus.DRAFT, AssetMintStatus.PENDING],
          minting: [AssetMintStatus.MINTING],
          minted: [AssetMintStatus.MINTED],
          failed: [AssetMintStatus.MINT_FAILED],
        };
        const allowedStatuses = statusMap[activeTab];
        if (allowedStatuses && !allowedStatuses.includes(asset.status)) {
          return false;
        }
      }

      // 搜索筛选
      if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        const matchSearch =
          asset.asset_name.toLowerCase().includes(lowerSearch) ||
          asset.asset_type.toLowerCase().includes(lowerSearch) ||
          asset.creator_name?.toLowerCase().includes(lowerSearch);
        if (!matchSearch) return false;
      }

      // 类型筛选
      if (typeFilter !== 'all' && asset.asset_type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [activeTab, searchText, typeFilter]);

  // 处理单条铸造
  const handleMint = async (assetId: string) => {
    try {
      const mockAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      await mint(assetId, { minter_address: mockAddress });
      message.success('铸造请求已提交');
      fetchStatistics();
    } catch (error) {
      message.error('铸造失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 渲染资产列表
  const renderAssetList = () => {
    if (filteredAssets.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无符合条件的资产"
          className={styles.emptyState}
        />
      );
    }

    return (
      <Row gutter={[16, 16]}>
        {filteredAssets.map((asset) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={asset.asset_id}>
            <MintCard asset={asset} onMint={handleMint} loading={mintLoading} />
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className={styles.nftAssetsPage}>
      {/* 页面标题 */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <AppstoreOutlined className={styles.headerIcon} />
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>资产管理</h1>
            <p className={styles.pageSubtitle}>管理和铸造您的知识产权资产</p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<AppstoreAddOutlined />}
          onClick={() => setBatchModalVisible(true)}
          size="large"
        >
          批量铸造
        </Button>
      </div>

      {/* 错误提示 */}
      {mintError && (
        <Alert
          message="错误"
          description={mintError}
          type="error"
          closable
          onClose={clearError}
          className={styles.errorAlert}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 搜索和筛选 */}
      <Card className={styles.filterCard} bordered={false} style={{ marginBottom: 24 }}>
        <div className={styles.filterRow}>
          <Search
            placeholder="搜索资产名称、类型或创建者..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
          <Select
            placeholder="资产类型"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="all">全部类型</Option>
            {assetTypes.map((type) => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
          </Select>
        </div>
      </Card>

      {/* 资产列表 */}
      <Card className={styles.assetsCard} bordered={false}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} className={styles.assetsTabs}>
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                全部
              </span>
            }
            key="all"
          >
            {renderAssetList()}
          </TabPane>
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                可铸造
              </span>
            }
            key="mintable"
          >
            {renderAssetList()}
          </TabPane>
          <TabPane
            tab={
              <span>
                <FireOutlined />
                铸造中
              </span>
            }
            key="minting"
          >
            {renderAssetList()}
          </TabPane>
          <TabPane
            tab={
              <span>
                <CheckCircleOutlined />
                已铸造
              </span>
            }
            key="minted"
          >
            {renderAssetList()}
          </TabPane>
          <TabPane
            tab={
              <span>
                <ExclamationCircleOutlined />
                失败
              </span>
            }
            key="failed"
          >
            {renderAssetList()}
          </TabPane>
        </Tabs>
      </Card>

      {/* 批量铸造模态框 */}
      <BatchMintModal
        visible={batchModalVisible}
        assets={MOCK_ASSETS.filter((a) => a.status === 'DRAFT' || a.status === 'PENDING')}
        onCancel={() => setBatchModalVisible(false)}
        onConfirm={() => {
          message.info('批量铸造功能开发中...');
          setBatchModalVisible(false);
        }}
        loading={false}
      />
    </div>
  );
};

export default NFTAssetsPage;
