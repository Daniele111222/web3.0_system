/**
 * 批量铸造模态框组件
 * 支持选择多个资产进行批量 NFT 铸造
 *
 * 功能特点：
 * - 资产多选列表
 * - 批量铸造进度展示
 * - 铸造结果汇总
 * - 钱包地址输入验证
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  Button,
  List,
  Checkbox,
  Input,
  Tag,
  Progress,
  Alert,
  Empty,
  Typography,
} from 'antd';
import {
  ThunderboltOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { NFTAssetCardData, AssetMintStatus, BatchMintResultItem } from '../../../types/nft';
import './style.less';

const { Text, Title } = Typography;
const { Search } = Input;

// ============================================
// 类型定义
// ============================================

interface BatchMintModalProps {
  visible: boolean;
  assets: NFTAssetCardData[];
  onCancel: () => void;
  onConfirm: (selectedIds: string[], minterAddress: string) => void;
  loading?: boolean;
  results?: {
    total: number;
    successful: number;
    failed: number;
    items: BatchMintResultItem[];
  } | null;
}

// ============================================
// 辅助函数
// ============================================

/**
 * 验证以太坊地址格式
 * @param address 钱包地址
 * @returns 是否有效
 */
const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * 获取资产状态颜色
 * @param status 资产状态
 * @returns 颜色值
 */
const getStatusColor = (status: AssetMintStatus): string => {
  const colorMap: Record<AssetMintStatus, string> = {
    DRAFT: 'default',
    PENDING: 'processing',
    MINTING: 'warning',
    MINTED: 'success',
    MINT_FAILED: 'error',
    REJECTED: 'default',
  };
  return colorMap[status] || 'default';
};

/**
 * 获取资产状态标签
 * @param status 资产状态
 * @returns 中文标签
 */
const getStatusLabel = (status: AssetMintStatus): string => {
  const labelMap: Record<AssetMintStatus, string> = {
    DRAFT: '草稿',
    PENDING: '待铸造',
    MINTING: '铸造中',
    MINTED: '已铸造',
    MINT_FAILED: '失败',
    REJECTED: '已拒绝',
  };
  return labelMap[status] || status;
};

// ============================================
// 组件实现
// ============================================

export const BatchMintModal: React.FC<BatchMintModalProps> = ({
  visible,
  assets,
  onCancel,
  onConfirm,
  loading = false,
  results = null,
}) => {
  // 状态管理
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [minterAddress, setMinterAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentStep, setCurrentStep] = useState<'select' | 'confirm' | 'result'>('select');

  // 可铸造资产列表（状态为 DRAFT 或 PENDING）
  const mintableAssets = useMemo(() => {
    return assets.filter((asset) => asset.status === 'DRAFT' || asset.status === 'PENDING');
  }, [assets]);

  // 根据搜索文本过滤资产
  const filteredAssets = useMemo(() => {
    if (!searchText) return mintableAssets;
    const lowerSearch = searchText.toLowerCase();
    return mintableAssets.filter(
      (asset) =>
        asset.asset_name.toLowerCase().includes(lowerSearch) ||
        asset.asset_type.toLowerCase().includes(lowerSearch)
    );
  }, [mintableAssets, searchText]);

  // 当模态框关闭时重置状态
  useEffect(() => {
    if (!visible) {
      setSelectedIds([]);
      setMinterAddress('');
      setAddressError('');
      setSearchText('');
      setCurrentStep('select');
    }
  }, [visible]);

  // 当有结果时切换到结果步骤
  useEffect(() => {
    if (results) {
      setCurrentStep('result');
    }
  }, [results]);

  /**
   * 处理资产选择
   * @param assetId 资产ID
   * @param checked 是否选中
   */
  const handleSelect = (assetId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, assetId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== assetId));
    }
  };

  /**
   * 处理全选/取消全选
   * @param checked 是否全选
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredAssets.map((asset) => asset.asset_id));
    } else {
      setSelectedIds([]);
    }
  };

  /**
   * 处理钱包地址变化
   * @param value 输入值
   */
  const handleAddressChange = (value: string) => {
    setMinterAddress(value);
    if (value && !isValidAddress(value)) {
      setAddressError('请输入有效的以太坊地址 (0x...)');
    } else {
      setAddressError('');
    }
  };

  /**
   * 进入确认步骤
   */
  const handleProceedToConfirm = () => {
    if (selectedIds.length === 0) return;
    setCurrentStep('confirm');
  };

  /**
   * 返回选择步骤
   */
  const handleBackToSelect = () => {
    setCurrentStep('select');
  };

  /**
   * 确认批量铸造
   */
  const handleConfirm = () => {
    if (selectedIds.length === 0 || !minterAddress || addressError) return;
    onConfirm(selectedIds, minterAddress);
  };

  /**
   * 渲染选择步骤内容
   */
  const renderSelectStep = () => (
    <>
      {/* 搜索栏 */}
      <div className="batch-mint-search">
        <Search
          placeholder="搜索资产名称或类型..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          prefix={<InfoCircleOutlined />}
        />
      </div>

      {/* 全选栏 */}
      <div className="batch-mint-select-all">
        <Checkbox
          checked={
            filteredAssets.length > 0 &&
            filteredAssets.every((asset) => selectedIds.includes(asset.asset_id))
          }
          indeterminate={selectedIds.length > 0 && selectedIds.length < filteredAssets.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          <Text type="secondary">
            全选 ({selectedIds.length}/{filteredAssets.length})
          </Text>
        </Checkbox>
      </div>

      {/* 资产列表 */}
      <div className="batch-mint-asset-list">
        {filteredAssets.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={searchText ? '未找到匹配的资产' : '暂无可铸造的资产'}
          />
        ) : (
          <List
            dataSource={filteredAssets}
            renderItem={(asset) => (
              <List.Item
                key={asset.asset_id}
                className={`asset-list-item ${
                  selectedIds.includes(asset.asset_id) ? 'selected' : ''
                }`}
                onClick={() => handleSelect(asset.asset_id, !selectedIds.includes(asset.asset_id))}
              >
                <Checkbox
                  checked={selectedIds.includes(asset.asset_id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleSelect(asset.asset_id, e.target.checked)}
                />

                <div className="asset-item-content">
                  <div className="asset-item-info">
                    <Text strong className="asset-item-name">
                      {asset.asset_name}
                    </Text>
                    <Text type="secondary" className="asset-item-type">
                      {asset.asset_type}
                    </Text>
                  </div>
                  <Tag color={getStatusColor(asset.status)}>{getStatusLabel(asset.status)}</Tag>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="batch-mint-footer">
        <Text type="secondary">
          已选择 <Text strong>{selectedIds.length}</Text> 个资产
        </Text>
        <Button
          type="primary"
          size="large"
          disabled={selectedIds.length === 0}
          onClick={handleProceedToConfirm}
        >
          下一步
        </Button>
      </div>
    </>
  );

  /**
   * 渲染确认步骤内容
   */
  const renderConfirmStep = () => (
    <div className="batch-mint-confirm">
      <div className="confirm-section">
        <Title level={5}>铸造概览</Title>
        <div className="confirm-stats">
          <div className="stat-item">
            <Text type="secondary">铸造资产数</Text>
            <Text strong className="stat-value">
              {selectedIds.length}
            </Text>
          </div>
          <div className="stat-item">
            <Text type="secondary">预估 Gas 费用</Text>
            <Text strong className="stat-value">
              ~0.001 ETH
            </Text>
          </div>
        </div>
      </div>

      <div className="confirm-section">
        <Title level={5}>接收钱包地址</Title>
        <Input
          size="large"
          placeholder="请输入以太坊钱包地址 (0x...)"
          value={minterAddress}
          onChange={(e) => handleAddressChange(e.target.value)}
          status={addressError ? 'error' : ''}
          prefix={<WalletOutlined />}
        />
        {addressError && (
          <Text type="danger" className="error-text">
            {addressError}
          </Text>
        )}
      </div>

      <div className="confirm-section">
        <Alert
          message="铸造提醒"
          description="铸造过程需要支付 Gas 费用，请确保钱包中有足够的 ETH。铸造成功后，NFT 将归属于填写的接收地址。"
          type="info"
          showIcon
        />
      </div>

      <div className="confirm-actions">
        <Button size="large" onClick={handleBackToSelect}>
          返回选择
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          loading={loading}
          disabled={!minterAddress || !!addressError}
          onClick={handleConfirm}
        >
          确认铸造
        </Button>
      </div>
    </div>
  );

  /**
   * 渲染结果步骤内容
   */
  const renderResultStep = () => {
    if (!results) return null;

    const successRate =
      results.total > 0 ? Math.round((results.successful / results.total) * 100) : 0;

    return (
      <div className="batch-mint-result">
        <div className="result-header">
          <div className={`result-icon ${results.failed === 0 ? 'success' : 'partial'}`}>
            {results.failed === 0 ? (
              <CheckCircleOutlined />
            ) : results.successful > 0 ? (
              <ExclamationCircleOutlined />
            ) : (
              <CloseCircleOutlined />
            )}
          </div>
          <Title level={4}>
            {results.failed === 0
              ? '批量铸造成功！'
              : results.successful > 0
                ? '批量铸造部分成功'
                : '批量铸造失败'}
          </Title>
          <Text type="secondary">
            成功 {results.successful} / 失败 {results.failed} / 总计 {results.total}
          </Text>
        </div>

        <div className="result-progress">
          <Progress
            percent={successRate}
            status={results.failed === 0 ? 'success' : 'active'}
            strokeWidth={12}
            showInfo={false}
          />
        </div>

        <div className="result-list">
          <List
            dataSource={results.items}
            renderItem={(item) => (
              <List.Item key={item.asset_id} className={`result-item ${item.status}`}>
                <div className="result-item-status">
                  {item.status === 'success' ? (
                    <CheckCircleOutlined className="success-icon" />
                  ) : (
                    <CloseCircleOutlined className="error-icon" />
                  )}
                </div>
                <div className="result-item-info">
                  <Text strong className="asset-name">
                    {assets.find((a) => a.asset_id === item.asset_id)?.asset_name || item.asset_id}
                  </Text>
                  {item.status === 'success' ? (
                    <div className="success-details">
                      <Tag color="success">Token #{item.token_id}</Tag>
                      <Text type="secondary" className="tx-hash">
                        {item.tx_hash?.slice(0, 10)}...{item.tx_hash?.slice(-8)}
                      </Text>
                    </div>
                  ) : (
                    <Text type="danger" className="error-message">
                      {item.error}
                    </Text>
                  )}
                </div>
              </List.Item>
            )}
          />
        </div>

        <div className="result-actions">
          <Button type="primary" size="large" onClick={onCancel}>
            完成
          </Button>
        </div>
      </div>
    );
  };

  // ============================================
  // 渲染主组件
  // ============================================

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
      className="batch-mint-modal"
      title={
        <div className="modal-header">
          <ThunderboltOutlined className="header-icon" />
          <span>批量铸造 NFT</span>
        </div>
      }
    >
      <div className="batch-mint-content">
        {currentStep === 'select' && renderSelectStep()}
        {currentStep === 'confirm' && renderConfirmStep()}
        {currentStep === 'result' && renderResultStep()}
      </div>
    </Modal>
  );
};

export default BatchMintModal;
