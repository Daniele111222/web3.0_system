/**
 * NFT 铸造历史页面
 * 展示历史铸造记录和详情
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Tooltip,
  Select,
  Typography,
  Modal,
  Spin,
  message,
} from 'antd';
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
import type { NFTHistoryItem, NFTMintHistoryItem } from '../../../types/nft';
import { AssetMintStatus } from '../../../types/nft';
import { useContract } from '../../../hooks/useNFT';
import nftService from '../../../services/nft';
import styles from './style.module.less';

const { Option } = Select;
const { Text } = Typography;

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
  APPROVED: {
    color: 'processing',
    icon: <CheckCircleOutlined />,
    label: '审批通过',
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

const RECORD_STATUS_CONFIG: Record<
  'PENDING' | 'SUCCESS' | 'FAILED',
  { color: string; icon: React.ReactNode; label: string }
> = {
  PENDING: {
    color: 'processing',
    icon: <ClockCircleOutlined />,
    label: '处理中',
  },
  SUCCESS: {
    color: 'success',
    icon: <CheckCircleOutlined />,
    label: '成功',
  },
  FAILED: {
    color: 'error',
    icon: <CloseCircleOutlined />,
    label: '失败',
  },
};

const explorerMap: Record<number, string> = {
  1: 'https://etherscan.io',
  11155111: 'https://sepolia.etherscan.io',
  137: 'https://polygonscan.com',
  80002: 'https://amoy.polygonscan.com',
  56: 'https://bscscan.com',
  97: 'https://testnet.bscscan.com',
};

/**
 * 铸造历史页面
 */
const NFTHistoryPage: React.FC = () => {
  const { contractInfo, fetchContractInfo } = useContract();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<NFTMintHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'SUCCESS' | 'FAILED' | undefined>();
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyItems, setHistoryItems] = useState<NFTHistoryItem[]>([]);
  const chainId = Number(contractInfo?.chain_id || import.meta.env.VITE_CHAIN_ID || 0);
  const explorerBase = import.meta.env.VITE_BLOCK_EXPLORER_URL || explorerMap[chainId] || '';
  const enterpriseId = localStorage.getItem('current_enterprise_id') || '';

  const fetchMintHistory = useCallback(
    async (
      nextPage: number,
      nextPageSize: number,
      nextStatus?: 'PENDING' | 'SUCCESS' | 'FAILED'
    ) => {
      if (!enterpriseId) {
        setRecords([]);
        setTotal(0);
        return;
      }
      try {
        setLoading(true);
        const result = await nftService.getMintHistory(
          enterpriseId,
          nextPage,
          nextPageSize,
          nextStatus
        );
        setRecords(result.items);
        setTotal(result.total);
      } catch (error) {
        message.error('加载历史失败：' + (error instanceof Error ? error.message : '未知错误'));
      } finally {
        setLoading(false);
      }
    },
    [enterpriseId]
  );

  useEffect(() => {
    fetchContractInfo();
    fetchMintHistory(1, pageSize, statusFilter);
  }, [fetchContractInfo, fetchMintHistory, pageSize, statusFilter]);

  // 表格列定义
  const columns: ColumnsType<NFTMintHistoryItem> = [
    {
      title: '资产名称',
      dataIndex: 'asset_name',
      key: 'asset_name',
      render: (text: string, record: NFTMintHistoryItem) => (
        <div className={styles.assetNameCell}>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.asset_id}
          </Text>
        </div>
      ),
    },
    {
      title: 'Token ID',
      dataIndex: 'token_id',
      key: 'token_id',
      width: 100,
      render: (tokenId?: number | null) => (tokenId ? <Tag color="success">#{tokenId}</Tag> : '-'),
    },
    {
      title: '资产状态',
      dataIndex: 'asset_status',
      key: 'asset_status',
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
      title: '记录状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: 'PENDING' | 'SUCCESS' | 'FAILED') => {
        const config = RECORD_STATUS_CONFIG[status];
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 110,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date?: string | null) => (date ? new Date(date).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record: NFTMintHistoryItem) => (
        <Space size="small">
          {record.tx_hash && (
            <Tooltip title="查看交易">
              <Button
                type="text"
                icon={<LinkOutlined />}
                size="small"
                onClick={() => {
                  if (!explorerBase) {
                    return;
                  }
                  window.open(
                    `${explorerBase}/tx/${record.tx_hash}`,
                    '_blank',
                    'noopener,noreferrer'
                  );
                }}
              />
            </Tooltip>
          )}
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              disabled={!record.token_id}
              onClick={async () => {
                if (!record.token_id) {
                  return;
                }
                try {
                  setHistoryLoading(true);
                  const result = await nftService.getNFTHistory(record.token_id, 1, 50);
                  setHistoryItems(result.items);
                  setHistoryVisible(true);
                } catch (error) {
                  message.error(
                    '加载历史失败：' + (error instanceof Error ? error.message : '未知错误')
                  );
                } finally {
                  setHistoryLoading(false);
                }
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

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
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchMintHistory(page, pageSize, statusFilter);
            }}
          >
            刷新
          </Button>
        </Space>
      </div>

      {/* 筛选栏 */}
      <Card className={styles.filterCard} bordered={false} style={{ marginBottom: 24 }}>
        <Space wrap>
          <Select
            placeholder="记录状态"
            style={{ width: 140 }}
            allowClear
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
              fetchMintHistory(1, pageSize, value);
            }}
          >
            <Option value="PENDING">处理中</Option>
            <Option value="SUCCESS">成功</Option>
            <Option value="FAILED">失败</Option>
          </Select>
          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={() => fetchMintHistory(1, pageSize)}
          >
            筛选
          </Button>
        </Space>
      </Card>

      {/* 历史记录表格 */}
      <Card className={styles.historyTableCard} bordered={false}>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="mint_record_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
              fetchMintHistory(nextPage, nextPageSize, statusFilter);
            },
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>
      <Modal
        open={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
        title="NFT 铸造历史"
        width={900}
      >
        <Spin spinning={historyLoading}>
          <Table
            rowKey="id"
            dataSource={historyItems}
            columns={[
              { title: '类型', dataIndex: 'transfer_type', key: 'transfer_type' },
              { title: '来源地址', dataIndex: 'from_address', key: 'from_address' },
              { title: '目标地址', dataIndex: 'to_address', key: 'to_address' },
              { title: '状态', dataIndex: 'status', key: 'status' },
              {
                title: '时间',
                dataIndex: 'timestamp',
                key: 'timestamp',
                render: (value: string) => new Date(value).toLocaleString('zh-CN'),
              },
            ]}
            pagination={false}
          />
        </Spin>
      </Modal>
    </div>
  );
};

export default NFTHistoryPage;
