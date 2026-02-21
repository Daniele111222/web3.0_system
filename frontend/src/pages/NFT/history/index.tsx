/**
 * NFT 铸造历史页面
 * 展示历史铸造记录和详情
 */
import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Tooltip, DatePicker, Select, Typography } from 'antd';
import {
  HistoryOutlined,
  ReloadOutlined,
  FilterOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { NFTAssetCardData } from '../../../types/nft';
import { AssetMintStatus, MintStage } from '../../../types/nft';
import styles from './style.module.less';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

// 模拟历史数据
const MOCK_HISTORY: NFTAssetCardData[] = [
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
    asset_id: 'uuid-7',
    asset_name: '发明专利 - 量子加密技术',
    asset_type: '专利',
    description: '基于量子力学原理的加密方法',
    status: AssetMintStatus.MINTED,
    token_id: 43,
    tx_hash: '0xdef456abc789012345678901234567890123456789012345678901234abcdef',
    contract_address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    metadata_uri: 'ipfs://QmTest456...',
    created_at: '2026-02-19T10:30:00Z',
    creator_name: '周九',
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

// 状态配置
const STATUS_CONFIG: Record<
  AssetMintStatus,
  {
    color: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  DRAFT: {
    color: 'default',
    icon: <ClockCircleOutlined />,
    label: '草稿',
  },
  PENDING: {
    color: 'processing',
    icon: <ClockCircleOutlined />,
    label: '待铸造',
  },
  MINTING: {
    color: 'warning',
    icon: <ThunderboltOutlined />,
    label: '铸造中',
  },
  MINTED: {
    color: 'success',
    icon: <CheckCircleOutlined />,
    label: '已铸造',
  },
  MINT_FAILED: {
    color: 'error',
    icon: <CloseCircleOutlined />,
    label: '失败',
  },
  REJECTED: {
    color: 'default',
    icon: <CloseCircleOutlined />,
    label: '已拒绝',
  },
};

/**
 * 铸造历史页面
 */
const NFTHistoryPage: React.FC = () => {
  const [loading] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 表格列定义
  const columns: ColumnsType<NFTAssetCardData> = [
    {
      title: '资产名称',
      dataIndex: 'asset_name',
      key: 'asset_name',
      render: (text: string, record: NFTAssetCardData) => (
        <div className={styles.assetNameCell}>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.asset_type}
          </Text>
        </div>
      ),
    },
    {
      title: 'Token ID',
      dataIndex: 'token_id',
      key: 'token_id',
      width: 100,
      render: (tokenId?: number) => (tokenId ? <Tag color="success">#{tokenId}</Tag> : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AssetMintStatus) => {
        const config = STATUS_CONFIG[status];
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '创建者',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record: NFTAssetCardData) => (
        <Space size="small">
          {record.tx_hash && (
            <Tooltip title="查看交易">
              <Button
                type="text"
                icon={<LinkOutlined />}
                size="small"
                onClick={() => {
                  window.open(`https://etherscan.io/tx/${record.tx_hash}`, '_blank');
                }}
              />
            </Tooltip>
          )}
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} size="small" />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <div className={styles.nftHistoryPage}>
      {/* 页面标题 */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <HistoryOutlined className={styles.headerIcon} />
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>铸造历史</h1>
            <p className={styles.pageSubtitle}>查看和管理历史铸造记录</p>
          </div>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />}>导出记录</Button>
          <Button icon={<ReloadOutlined />}>刷新</Button>
        </Space>
      </div>

      {/* 筛选栏 */}
      <Card className={styles.filterCard} bordered={false} style={{ marginBottom: 24 }}>
        <Space wrap>
          <RangePicker placeholder={['开始日期', '结束日期']} />
          <Select placeholder="状态筛选" style={{ width: 120 }} allowClear>
            <Option value="MINTED">已铸造</Option>
            <Option value="MINT_FAILED">失败</Option>
          </Select>
          <Select placeholder="资产类型" style={{ width: 120 }} allowClear>
            <Option value="专利">专利</Option>
            <Option value="版权">版权</Option>
            <Option value="商标">商标</Option>
          </Select>
          <Button type="primary" icon={<FilterOutlined />}>
            筛选
          </Button>
        </Space>
      </Card>

      {/* 历史记录表格 */}
      <Card className={styles.historyTableCard} bordered={false}>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={MOCK_HISTORY}
          rowKey="asset_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>
    </div>
  );
};

export default NFTHistoryPage;
