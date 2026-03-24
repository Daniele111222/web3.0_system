/**
 * NFT 资产管理页面
 * 展示和管理可铸造的资产列表
 */
import React, { useState, useMemo, useEffect } from 'react';
import { Card, Row, Col, Button, Empty, Alert, Tabs, message, Input, Select, Spin } from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons';
import { useMint, useMintStatistics, useNFTAssets } from '../../../hooks/useNFT';
import { MintCard } from '../../../components/nft/MintCard';
import { BatchMintModal } from '../../../components/nft/BatchMintModal';
import { MintConfirmModal } from '../../../components/nft/MintConfirmModal';
import type {
  BatchMintResultItem,
  MintGasEstimateResponse,
  MintNFTRequest,
} from '../../../types/nft';
import { AssetMintStatus } from '../../../types/nft';
import nftService from '../../../services/nft';
import styles from './style.module.less';

const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

/**
 * 资产管理页面
 */
const NFTAssetsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [mintModalVisible, setMintModalVisible] = useState(false);
  const [mintingAssetId, setMintingAssetId] = useState<string | null>(null);
  const [mintAddress, setMintAddress] = useState('');
  const [royaltyEnabled, setRoyaltyEnabled] = useState(false);
  const [royaltyReceiver, setRoyaltyReceiver] = useState('');
  const [royaltyFeeBps, setRoyaltyFeeBps] = useState(500);
  const [estimating, setEstimating] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<MintGasEstimateResponse | null>(null);

  const {
    loading: mintLoading,
    error: mintError,
    mint,
    batchMint,
    estimateMintGas,
    clearError,
  } = useMint();
  const {
    loading: assetsLoading,
    error: assetsError,
    assets,
    fetchAssets,
    clearError: clearAssetsError,
  } = useNFTAssets();
  const { fetchStatistics } = useMintStatistics();
  const [batchResults, setBatchResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    items: BatchMintResultItem[];
  } | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // 资产类型列表
  const assetTypes = useMemo(() => {
    const types = new Set(assets.map((asset) => asset.asset_type));
    return Array.from(types);
  }, [assets]);

  // 过滤资产
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // 状态筛选
      if (activeTab !== 'all') {
        const statusMap: Record<string, AssetMintStatus[]> = {
          mintable: [AssetMintStatus.APPROVED],
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
  }, [activeTab, searchText, typeFilter, assets]);

  // 处理单条铸造
  const mintingAsset = useMemo(
    () => assets.find((asset) => asset.asset_id === mintingAssetId) || null,
    [assets, mintingAssetId]
  );

  const handleMint = async (assetId: string) => {
    const targetAsset = assets.find((asset) => asset.asset_id === assetId);
    if (!targetAsset) {
      return;
    }
    const walletAddress = localStorage.getItem('wallet_address') || '';
    setMintingAssetId(targetAsset.asset_id);
    setMintAddress(walletAddress);
    setRoyaltyEnabled(false);
    setRoyaltyReceiver(walletAddress);
    setRoyaltyFeeBps(500);
    setGasEstimate(null);
    setMintModalVisible(true);
  };

  const handleMintConfirm = async (request: MintNFTRequest) => {
    if (!mintingAsset) {
      return;
    }
    try {
      await mint(mintingAsset.asset_id, request);
      message.success('铸造请求已提交');
      setMintModalVisible(false);
      fetchAssets();
      fetchStatistics();
    } catch (error) {
      message.error(`铸造失败：${nftService.mapNftErrorMessage(error, '未知错误')}`);
    }
  };

  const handleEstimate = async (request: MintNFTRequest) => {
    if (!mintingAsset) {
      return;
    }
    setEstimating(true);
    try {
      const estimate = await estimateMintGas(mintingAsset.asset_id, request);
      setGasEstimate(estimate);
    } catch (error) {
      message.error(`Gas 估算失败：${nftService.mapNftErrorMessage(error, '未知错误')}`);
    } finally {
      setEstimating(false);
    }
  };

  const handleBatchMint = async (selectedIds: string[], minterAddress?: string) => {
    try {
      const result = await batchMint(selectedIds, minterAddress);
      setBatchResults({
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        items: result.results,
      });
      fetchAssets();
      fetchStatistics();
      message.success('批量铸造任务已提交');
    } catch (error) {
      message.error(`批量铸造失败：${nftService.mapNftErrorMessage(error, '未知错误')}`);
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

      {assetsError && (
        <Alert
          message="错误"
          description={assetsError}
          type="error"
          closable
          onClose={clearAssetsError}
          className={styles.errorAlert}
          style={{ marginBottom: 24 }}
        />
      )}

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

      <Card className={styles.assetsCard} bordered={false}>
        <Spin spinning={assetsLoading || mintLoading}>
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
        </Spin>
      </Card>

      {/* 批量铸造模态框 */}
      <BatchMintModal
        visible={batchModalVisible}
        assets={filteredAssets}
        onCancel={() => {
          setBatchModalVisible(false);
          setBatchResults(null);
        }}
        onConfirm={handleBatchMint}
        loading={mintLoading}
        results={batchResults}
      />
      <MintConfirmModal
        open={mintModalVisible}
        asset={mintingAsset}
        mintAddress={mintAddress}
        royaltyEnabled={royaltyEnabled}
        royaltyReceiver={royaltyReceiver}
        royaltyFeeBps={royaltyFeeBps}
        gasEstimate={gasEstimate}
        estimating={estimating}
        confirming={mintLoading}
        onCancel={() => setMintModalVisible(false)}
        onConfirm={handleMintConfirm}
        onEstimate={handleEstimate}
        onMintAddressChange={setMintAddress}
        onRoyaltyEnabledChange={setRoyaltyEnabled}
        onRoyaltyReceiverChange={setRoyaltyReceiver}
        onRoyaltyFeeBpsChange={setRoyaltyFeeBps}
      />
    </div>
  );
};

export default NFTAssetsPage;
