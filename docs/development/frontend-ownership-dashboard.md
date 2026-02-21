# 权属看板 - 前端开发方案

## 1. 功能概述

为企业提供一个仪表板，直观展示其名下所有的IP-NFT资产。支持按资产类型、权属状态进行筛选和查看，以及 NFT 转移和历史溯源。

---

## 2. 页面结构设计

### 2.1 路由设计

```
/nft/ownership (权属看板主页面)
/nft/ownership/assets (企业NFT资产列表)
/nft/ownership/transfer (NFT转移页面)
/nft/ownership/history/:tokenId (单个NFT的历史溯源)
```

### 2.2 页面组件结构

```
OwnershipDashboard (权属看板)
├── OwnershipStats (统计卡片区)
│   ├── TotalAssetsCard (总数)
│   ├── ActiveAssetsCard (有效资产)
│   ├── LicensedAssetsCard (许可中)
│   └── StakedAssetsCard (质押中)
├── OwnershipFilters (筛选栏)
│   ├── AssetTypeSelect (资产类型)
│   ├── OwnershipStatusSelect (权属状态筛选)
│   └── SearchInput (关键词搜索)
├── OwnershipTable (资产表格)
│   ├── NFTPreviewColumn (NFT预览列)
│   ├── AssetInfoColumn (资产信息列)
│   ├── OwnershipStatusColumn (权属状态列)
│   ├── OwnerColumn (归属企业列)
│   ├── ActionsColumn (操作列)
│   └── Pagination (分页)
└── TransferModal (转移模态框)
```

---

## 3. 类型定义

### 3.1 新增类型文件 `frontend/src/types/ownership.ts`

```typescript
/**
 * 权属看板类型定义
 */

export enum OwnershipStatus {
  ACTIVE = 'ACTIVE',
  LICENSED = 'LICENSED',
  STAKED = 'STAKED',
  TRANSFERRED = 'TRANSFERRED',
}

export enum TransferType {
  MINT = 'MINT',
  TRANSFER = 'TRANSFER',
  LICENSE = 'LICENSE',
  STAKE = 'STAKE',
  UNSTAKE = 'UNSTAKE',
  BURN = 'BURN',
}

export interface OwnershipAsset {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  token_id: number;
  contract_address: string;
  owner_address: string;
  owner_enterprise_id: string | null;
  owner_enterprise_name: string | null;
  ownership_status: OwnershipStatus;
  metadata_uri: string;
  created_at: string;
  updated_at: string;
}

export interface TransferRecord {
  id: string;
  token_id: number;
  contract_address: string;
  transfer_type: TransferType;
  from_address: string;
  from_enterprise_id: string | null;
  from_enterprise_name: string | null;
  to_address: string;
  to_enterprise_id: string | null;
  to_enterprise_name: string | null;
  tx_hash: string | null;
  block_number: number | null;
  timestamp: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  remarks: string | null;
}

export interface OwnershipStats {
  total_count: number;
  active_count: number;
  licensed_count: number;
  staked_count: number;
  transferred_count: number;
}

export interface OwnershipFilters {
  asset_type?: string;
  ownership_status?: OwnershipStatus;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface TransferRequest {
  token_id: number;
  to_address: string;
  to_enterprise_id?: string;
  remarks?: string;
}

export interface TransferResponse {
  success: boolean;
  tx_hash: string;
  transfer_record_id: string;
  token_id: number;
  from_address: string;
  to_address: string;
}
```

---

## 4. API 服务层

### 4.1 新增服务文件 `frontend/src/services/ownership.ts`

```typescript
/**
 * 权属管理服务层
 * 封装与企业NFT资产、转移、历史相关的API调用
 */

import api from './api';
import type {
  OwnershipAsset,
  OwnershipStats,
  OwnershipFilters,
  TransferRecord,
  TransferRequest,
  TransferResponse,
} from '../types/ownership';
import type { PageResult } from '../types';

export const getOwnershipAssets = async (
  enterpriseId: string,
  filters: OwnershipFilters
): Promise<PageResult<OwnershipAsset>> => {
  const response = await api.get(`/api/v1/ownership/${enterpriseId}/assets`, {
    params: filters,
  });
  return response.data.data;
};

export const getOwnershipStats = async (
  enterpriseId: string
): Promise<OwnershipStats> => {
  const response = await api.get(`/api/v1/ownership/${enterpriseId}/stats`);
  return response.data.data;
};

export const getOwnershipAssetDetail = async (
  tokenId: number
): Promise<OwnershipAsset> => {
  const response = await api.get(`/api/v1/ownership/assets/${tokenId}`);
  return response.data.data;
};

export const getTransferHistory = async (
  tokenId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<PageResult<TransferRecord>> => {
  const response = await api.get(`/api/v1/ownership/assets/${tokenId}/history`, {
    params: { page, page_size: pageSize },
  });
  return response.data.data;
};

export const transferNFT = async (
  data: TransferRequest
): Promise<TransferResponse> => {
  const response = await api.post('/api/v1/ownership/transfer', data);
  return response.data.data;
};

export const updateOwnershipStatus = async (
  tokenId: number,
  newStatus: string,
  remarks?: string
): Promise<{ success: boolean; token_id: number; new_status: string }> => {
  const response = await api.patch(`/api/v1/ownership/assets/${tokenId}/status`, {
    new_status: newStatus,
    remarks,
  });
  return response.data.data;
};

export const ownershipService = {
  getOwnershipAssets,
  getOwnershipStats,
  getOwnershipAssetDetail,
  getTransferHistory,
  transferNFT,
  updateOwnershipStatus,
};

export default ownershipService;
```

---

## 5. 组件实现

### 5.1 权属看板主页面 `frontend/src/pages/NFT/ownership/index.tsx`

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Input,
  Typography,
  Spin,
  Tooltip,
  message,
} from 'antd';
import {
  DashboardOutlined,
  SendOutlined,
  HistoryOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LockOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ownershipService } from '../../../services/ownership';
import type { OwnershipAsset, OwnershipStats, OwnershipFilters, OwnershipStatus } from '../../../types/ownership';
import { OwnershipStatus as StatusEnum } from '../../../types/ownership';
import TransferModal from '../../../components/ownership/TransferModal';
import './style.less';

const { Search } = Input;
const { Text } = Typography;

const STATUS_CONFIG: Record<OwnershipStatus, { color: string; label: string; icon: React.ReactNode }> = {
  [StatusEnum.ACTIVE]: { color: 'success', label: '有效', icon: <CheckCircleOutlined /> },
  [StatusEnum.LICENSED]: { color: 'processing', label: '许可中', icon: <ClockCircleOutlined /> },
  [StatusEnum.STAKED]: { color: 'warning', label: '质押中', icon: <LockOutlined /> },
  [StatusEnum.TRANSFERRED]: { color: 'default', label: '已转移', icon: <SwapOutlined /> },
};

const OwnershipDashboard: React.FC = () => {
  const navigate = useNavigate();
  const enterpriseId = localStorage.getItem('current_enterprise_id') || '';

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<OwnershipStats | null>(null);
  const [assets, setAssets] = useState<OwnershipAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<OwnershipAsset | null>(null);

  const [filters, setFilters] = useState<OwnershipFilters>({
    page: 1,
    page_size: 10,
  });

  const fetchStats = useCallback(async () => {
    if (!enterpriseId) return;
    try {
      const data = await ownershipService.getOwnershipStats(enterpriseId);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [enterpriseId]);

  const fetchAssets = useCallback(async () => {
    if (!enterpriseId) return;
    setLoading(true);
    try {
      const result = await ownershipService.getOwnershipAssets(enterpriseId, filters);
      setAssets(result.items);
      setTotal(result.total);
    } catch (error) {
      message.error('加载资产列表失败');
    } finally {
      setLoading(false);
    }
  }, [enterpriseId, filters]);

  useEffect(() => {
    if (enterpriseId) {
      fetchStats();
      fetchAssets();
    }
  }, [enterpriseId, fetchStats, fetchAssets]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    handleFilterChange('search', value);
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
    setFilters(prev => ({ ...prev, page, page_size: size }));
  };

  const handleTransferClick = (asset: OwnershipAsset) => {
    setSelectedAsset(asset);
    setTransferModalVisible(true);
  };

  const handleTransferSuccess = () => {
    setTransferModalVisible(false);
    setSelectedAsset(null);
    fetchStats();
    fetchAssets();
  };

  const columns = [
    {
      title: '资产',
      key: 'asset',
      width: 200,
      render: (_: any, record: OwnershipAsset) => (
        <div>
          <Text strong>{record.asset_name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.asset_type} | Token #{record.token_id}
          </Text>
        </div>
      ),
    },
    {
      title: '权属状态',
      dataIndex: 'ownership_status',
      key: 'ownership_status',
      width: 120,
      render: (status: OwnershipStatus) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG[StatusEnum.ACTIVE];
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '持有者地址',
      dataIndex: 'owner_address',
      key: 'owner_address',
      width: 180,
      render: (addr: string) => (
        <Text code style={{ fontSize: 11 }}>
          {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-'}
        </Text>
      ),
    },
    {
      title: '归属企业',
      dataIndex: 'owner_enterprise_name',
      key: 'owner_enterprise_name',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: OwnershipAsset) => (
        <Space size="small">
          <Tooltip title="历史溯源">
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={() => navigate(`/nft/ownership/history/${record.token_id}`)}
            />
          </Tooltip>
          <Tooltip title="转移">
            <Button
              type="text"
              icon={<SendOutlined />}
              onClick={() => handleTransferClick(record)}
              disabled={record.ownership_status === StatusEnum.TRANSFERRED}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="ownership-dashboard-page">
      <div className="page-header">
        <div className="header-content">
          <DashboardOutlined className="header-icon" />
          <div className="header-text">
            <h1 className="page-title">权属看板</h1>
            <p className="page-subtitle">管理企业名下的IP-NFT资产</p>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); fetchAssets(); }}>
            刷新
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} className="stats-section">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="资产总数"
              value={stats?.total_count || 0}
              prefix={<DashboardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="有效资产"
              value={stats?.active_count || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="许可中"
              value={stats?.licensed_count || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="质押中"
              value={stats?.staked_count || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<LockOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="filter-card" bordered={false}>
        <Space wrap>
          <Select
            placeholder="资产类型"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => handleFilterChange('asset_type', value)}
          >
            <Select.Option value="PATENT">专利</Select.Option>
            <Select.Option value="TRADEMARK">商标</Select.Option>
            <Select.Option value="COPYRIGHT">版权</Select.Option>
            <Select.Option value="TRADE_SECRET">商业秘密</Select.Option>
            <Select.Option value="DIGITAL_WORK">数字作品</Select.Option>
          </Select>
          <Select
            placeholder="权属状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => handleFilterChange('ownership_status', value)}
          >
            <Select.Option value={StatusEnum.ACTIVE}>有效</Select.Option>
            <Select.Option value={StatusEnum.LICENSED}>许可中</Select.Option>
            <Select.Option value={StatusEnum.STAKED}>质押中</Select.Option>
            <Select.Option value={StatusEnum.TRANSFERRED}>已转移</Select.Option>
          </Select>
          <Search
            placeholder="搜索资产名称"
            onSearch={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
        </Space>
      </Card>

      <Card className="assets-table-card" bordered={false}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={assets}
            rowKey="asset_id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              onChange: handlePageChange,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Spin>
      </Card>

      <TransferModal
        visible={transferModalVisible}
        asset={selectedAsset}
        onClose={() => setTransferModalVisible(false)}
        onSuccess={handleTransferSuccess}
      />
    </div>
  );
};

export default OwnershipDashboard;
```

### 5.2 转移模态框 `frontend/src/components/ownership/TransferModal.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Alert,
  Typography,
  Divider,
  message,
} from 'antd';
import { SendOutlined, WalletOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ownershipService } from '../../services/ownership';
import type { OwnershipAsset, TransferResponse } from '../../types/ownership';

const { Text } = Typography;
const { TextArea } = Input;

interface TransferModalProps {
  visible: boolean;
  asset: OwnershipAsset | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({
  visible,
  asset,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResponse | null>(null);

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setResult(null);
    }
  }, [visible, form]);

  const handleSubmit = async (values: { to_address: string; remarks: string }) => {
    if (!asset) return;

    setLoading(true);
    try {
      const res = await ownershipService.transferNFT({
        token_id: asset.token_id,
        to_address: values.to_address,
        remarks: values.remarks,
      });
      setResult(res);
      message.success('NFT 转移成功');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      Modal.error({
        title: '转移失败',
        content: error.response?.data?.detail || error.message || '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SendOutlined />
          <span>NFT转移</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      destroyOnClose
    >
      {asset && !result && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Alert
            message="转移须知"
            description="NFT转移一旦确认将不可撤销。请确保接收方地址正确。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item label="当前资产">
            <Text strong>{asset.asset_name}</Text>
            <br />
            <Text type="secondary">Token ID: #{asset.token_id}</Text>
          </Form.Item>

          <Form.Item
            name="to_address"
            label="接收方钱包地址"
            rules={[
              { required: true, message: '请输入接收方钱包地址' },
              { pattern: /^0x[a-fA-F0-9]{40}$/, message: '请输入有效的以太坊地址' },
            ]}
          >
            <Input prefix={<WalletOutlined />} placeholder="0x..." />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="备注"
          >
            <TextArea rows={3} placeholder="可选填写转移备注" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={onClose}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认转移
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}

      {result && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          <p style={{ marginTop: 16, fontSize: 16 }}>转移成功</p>
          <Text type="secondary">交易哈希:</Text>
          <br />
          <Text copyable style={{ fontFamily: 'monospace' }}>
            {result.tx_hash}
          </Text>
          <Divider />
          <Button type="primary" onClick={onClose}>
            完成
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default TransferModal;
```

### 5.3 历史溯源页面 `frontend/src/pages/NFT/ownership/History.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Timeline,
  Tag,
  Button,
  Space,
  Spin,
  Typography,
  Descriptions,
  Row,
  Col,
  Empty,
} from 'antd';
import {
  HistoryOutlined,
  ArrowLeftOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  LockOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ownershipService } from '../../../services/ownership';
import type { OwnershipAsset, TransferRecord, TransferType } from '../../../types/ownership';
import { TransferType as TransferTypeEnum } from '../../../types/ownership';
import './style.less';

const { Text } = Typography;

const EVENT_CONFIG: Record<TransferType, { color: string; icon: React.ReactNode; label: string }> = {
  [TransferTypeEnum.MINT]: { color: 'green', icon: <CheckCircleOutlined />, label: '铸造' },
  [TransferTypeEnum.TRANSFER]: { color: 'blue', icon: <SendOutlined />, label: '转移' },
  [TransferTypeEnum.LICENSE]: { color: 'purple', icon: <ClockCircleOutlined />, label: '许可' },
  [TransferTypeEnum.STAKE]: { color: 'orange', icon: <LockOutlined />, label: '质押' },
  [TransferTypeEnum.UNSTAKE]: { color: 'cyan', icon: <LockOutlined />, label: '解除质押' },
  [TransferTypeEnum.BURN]: { color: 'red', icon: <FireOutlined />, label: '销毁' },
};

const NFTHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { tokenId } = useParams<{ tokenId: string }>();

  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<OwnershipAsset | null>(null);
  const [history, setHistory] = useState<TransferRecord[]>([]);

  useEffect(() => {
    if (tokenId) {
      loadData();
    }
  }, [tokenId]);

  const loadData = async () => {
    if (!tokenId) return;
    setLoading(true);
    try {
      const [assetData, historyData] = await Promise.all([
        ownershipService.getOwnershipAssetDetail(parseInt(tokenId)),
        ownershipService.getTransferHistory(parseInt(tokenId)),
      ]);
      setAsset(assetData);
      setHistory(historyData.items);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTxHash = (hash: string | null) => {
    if (!hash) return '-';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const openExplorer = (txHash: string) => {
    const explorerUrl = import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://etherscan.io';
    window.open(`${explorerUrl}/tx/${txHash}`, '_blank');
  };

  return (
    <div className="nft-history-page">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <HistoryOutlined className="header-icon" />
          <div className="header-text">
            <h1 className="page-title">历史溯源</h1>
            <p className="page-subtitle">NFT 完整流转记录</p>
          </div>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card title="资产信息">
              {asset && (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="资产名称">{asset.asset_name}</Descriptions.Item>
                  <Descriptions.Item label="资产类型">{asset.asset_type}</Descriptions.Item>
                  <Descriptions.Item label="Token ID">#{asset.token_id}</Descriptions.Item>
                  <Descriptions.Item label="合约地址">
                    <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {asset.contract_address}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="当前归属">
                    {asset.owner_enterprise_name || asset.owner_address}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {dayjs(asset.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                </Descriptions>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <HistoryOutlined />
                  <span>流转历史</span>
                  <Tag>{history.length} 条记录</Tag>
                </Space>
              }
            >
              {history.length > 0 ? (
                <Timeline
                  mode="left"
                  items={history.map((record) => {
                    const config = EVENT_CONFIG[record.transfer_type] || EVENT_CONFIG[TransferTypeEnum.TRANSFER];
                    return {
                      color: config.color,
                      label: dayjs(record.timestamp).format('YYYY-MM-DD HH:mm'),
                      children: (
                        <Card size="small" style={{ marginBottom: 8 }}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                              {config.icon}
                              <Text strong>{config.label}</Text>
                              <Tag color={config.color}>{record.transfer_type}</Tag>
                            </Space>
                            <Descriptions column={2} size="small">
                              <Descriptions.Item label="from">
                                {record.from_enterprise_name || `${record.from_address.slice(0, 6)}...${record.from_address.slice(-4)}`}
                              </Descriptions.Item>
                              <Descriptions.Item label="to">
                                {record.to_enterprise_name || `${record.to_address.slice(0, 6)}...${record.to_address.slice(-4)}`}
                              </Descriptions.Item>
                              {record.tx_hash && (
                                <Descriptions.Item label="交易哈希" span={2}>
                                  <Space>
                                    <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                      {formatTxHash(record.tx_hash)}
                                    </Text>
                                    <Button type="link" icon={<LinkOutlined />} size="small" onClick={() => openExplorer(record.tx_hash!)}>
                                      查看
                                    </Button>
                                  </Space>
                                </Descriptions.Item>
                              )}
                              {record.block_number && (
                                <Descriptions.Item label="区块">#{record.block_number}</Descriptions.Item>
                              )}
                              <Descriptions.Item label="状态">
                                <Tag color={record.status === 'CONFIRMED' ? 'success' : 'warning'}>
                                  {record.status === 'CONFIRMED' ? '已确认' : record.status}
                                </Tag>
                              </Descriptions.Item>
                            </Descriptions>
                            {record.remarks && (
                              <Text type="secondary">备注: {record.remarks}</Text>
                            )}
                          </Space>
                        </Card>
                      ),
                    };
                  })}
                />
              ) : (
                <Empty description="暂无流转记录" />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default NFTHistoryPage;
```

---

## 6. 路由配置

### 6.1 更新 `frontend/src/router.tsx`

```tsx
{
  path: 'ownership',
  element: <NFTLayout />,
  children: [
    {
      path: '',
      element: <Navigate to="assets" replace />,
    },
    {
      path: 'assets',
      element: <OwnershipDashboard />,
    },
    {
      path: 'history/:tokenId',
      element: <NFTHistoryPage />,
    },
  ],
},
```

---

## 7. 样式文件

### 7.1 新增样式文件 `frontend/src/pages/NFT/ownership/style.less`

```less
.ownership-dashboard-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        font-size: 28px;
        color: @primary-color;
      }

      .page-title {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }

      .page-subtitle {
        margin: 0;
        color: @text-color-secondary;
      }
    }
  }

  .stats-section {
    margin-bottom: 24px;
  }

  .filter-card {
    margin-bottom: 16px;
  }
}

.nft-history-page {
  .page-header {
    margin-bottom: 24px;

    .header-content {
      .header-icon {
        font-size: 28px;
        color: @primary-color;
      }

      .page-title {
        margin: 0;
        font-size: 24px;
      }

      .page-subtitle {
        margin: 0;
        color: @text-color-secondary;
      }
    }
  }
}
```

---

## 8. 开发清单

### Phase 1: 基础看板
- [x] 创建类型定义文件 `types/ownership.ts`
- [x] 创建服务层 `services/ownership.ts`
- [x] 实现权属看板页面 `pages/NFT/ownership/index.tsx`
- [x] 添加统计卡片组件
- [x] 实现筛选功能

### Phase 2: 转移功能
- [x] 创建转移模态框组件
- [x] 实现转移API调用（单次调用完成链上转移）

### Phase 3: 历史溯源
- [x] 创建历史溯源页面
- [x] 实现时间线展示组件
- [x] 集成区块链浏览器链接（支持配置 VITE_BLOCK_EXPLORER_URL）

### 环境变量配置

前端 `.env` 文件需要配置：

```
VITE_API_BASE_URL=http://localhost:8000
VITE_BLOCK_EXPLORER_URL=http://localhost:8545  # 本地 Hardhat 节点
```
