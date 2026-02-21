/**
 * 权属看板页面
 * 展示企业名下所有 IP-NFT 资产，支持筛选、转移和历史溯源
 */
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
  CheckCircleOutlined,
  ClockCircleOutlined,
  LockOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ownershipService } from '../../../services/ownership';
import type { OwnershipAsset, OwnershipStats, OwnershipFilters } from '../../../types/ownership';
import { OwnershipStatus } from '../../../types/ownership';
import TransferModal from '../../../components/ownership/TransferModal';
import './style.less';

const { Search } = Input;
const { Text } = Typography;

// 权属状态配置
const STATUS_CONFIG: Record<
  OwnershipStatus,
  { color: string; label: string; icon: React.ReactNode }
> = {
  [OwnershipStatus.ACTIVE]: {
    color: 'success',
    label: '有效',
    icon: <CheckCircleOutlined />,
  },
  [OwnershipStatus.LICENSED]: {
    color: 'processing',
    label: '许可中',
    icon: <ClockCircleOutlined />,
  },
  [OwnershipStatus.STAKED]: {
    color: 'warning',
    label: '质押中',
    icon: <LockOutlined />,
  },
  [OwnershipStatus.TRANSFERRED]: {
    color: 'default',
    label: '已转移',
    icon: <SwapOutlined />,
  },
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

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    if (!enterpriseId) return;
    try {
      const data = await ownershipService.getOwnershipStats(enterpriseId);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [enterpriseId]);

  // 获取资产列表
  const fetchAssets = useCallback(async () => {
    if (!enterpriseId) return;
    setLoading(true);
    try {
      const result = await ownershipService.getOwnershipAssets(enterpriseId, filters);
      setAssets(result.items);
      setTotal(result.total);
    } catch {
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

  // 处理筛选条件变化
  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    setCurrentPage(1);
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    handleFilterChange('search', value);
  };

  // 处理分页
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
    setFilters((prev) => ({ ...prev, page, page_size: size }));
  };

  // 处理转移按钮点击
  const handleTransferClick = (asset: OwnershipAsset) => {
    setSelectedAsset(asset);
    setTransferModalVisible(true);
  };

  // 处理转移成功
  const handleTransferSuccess = () => {
    setTransferModalVisible(false);
    setSelectedAsset(null);
    fetchStats();
    fetchAssets();
  };

  // 表格列定义
  const columns = [
    {
      title: '资产',
      key: 'asset',
      width: 200,
      render: (_: unknown, record: OwnershipAsset) => (
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
        const config = STATUS_CONFIG[status] || STATUS_CONFIG[OwnershipStatus.ACTIVE];
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
      render: (date: string) =>
        new Date(date).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: OwnershipAsset) => (
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
              disabled={record.ownership_status === OwnershipStatus.TRANSFERRED}
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
            <p className="page-subtitle">管理企业名下的 IP-NFT 资产</p>
          </div>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchStats();
              fetchAssets();
            }}
          >
            刷新
          </Button>
        </Space>
      </div>

      {/* 统计卡片区 */}
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

      {/* 筛选区域 */}
      <Card className="filter-card" bordered={false}>
        <Space wrap>
          <Select
            placeholder="资产类型"
            style={{ width: 150 }}
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
            <Select.Option value={OwnershipStatus.ACTIVE}>有效</Select.Option>
            <Select.Option value={OwnershipStatus.LICENSED}>许可中</Select.Option>
            <Select.Option value={OwnershipStatus.STAKED}>质押中</Select.Option>
            <Select.Option value={OwnershipStatus.TRANSFERRED}>已转移</Select.Option>
          </Select>
          <Search
            placeholder="搜索资产名称"
            onSearch={handleSearch}
            style={{ width: 240 }}
            allowClear
          />
        </Space>
      </Card>

      {/* 资产表格 */}
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

      {/* 转移模态框 */}
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
