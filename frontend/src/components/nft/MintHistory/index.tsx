/**
 * NFT 铸造历史记录组件
 * 展示资产的 NFT 铸造历史和时间线
 *
 * 功能特点：
 * - 铸造记录时间线展示
 * - 交易哈希链接跳转
 * - 错误信息友好展示
 * - 支持按状态筛选
 */

import React, { useState, useMemo } from 'react';
import {
  Timeline,
  Card,
  Tag,
  Button,
  Empty,
  Spin,
  Tabs,
  Tooltip,
  Badge,
  Typography,
  Space,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  LinkOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import type { MintRecord, MintOperation } from '../../../types/nft';
import './style.less';

const { Text } = Typography;
const { TabPane } = Tabs;

// ============================================
// 类型定义
// ============================================

interface MintHistoryProps {
  records: MintRecord[];
  loading?: boolean;
  assetName?: string;
  onRetry?: (recordId: string) => void;
  onViewTransaction?: (txHash: string) => void;
}

type FilterType = 'all' | 'success' | 'failed' | 'pending';

// ============================================
// 辅助函数和配置
// ============================================

/**
 * 操作类型配置
 */
const OPERATION_CONFIG: Record<
  MintOperation,
  {
    label: string;
    color: string;
    icon: React.ReactNode;
  }
> = {
  REQUEST: {
    label: '请求铸造',
    color: 'blue',
    icon: <ThunderboltOutlined />,
  },
  SUBMIT: {
    label: '提交交易',
    color: 'orange',
    icon: <FileTextOutlined />,
  },
  CONFIRM: {
    label: '确认交易',
    color: 'green',
    icon: <CheckCircleOutlined />,
  },
  RETRY: {
    label: '重试铸造',
    color: 'purple',
    icon: <ReloadOutlined />,
  },
  FAIL: {
    label: '铸造失败',
    color: 'red',
    icon: <CloseCircleOutlined />,
  },
  SUCCESS: {
    label: '铸造成功',
    color: 'success',
    icon: <CheckCircleOutlined />,
  },
};

/**
 * 记录状态配置
 */
const STATUS_CONFIG: Record<
  string,
  {
    color: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
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
  PENDING: {
    color: 'processing',
    icon: <ClockCircleOutlined />,
    label: '进行中',
  },
};

/**
 * 格式化时间戳
 * @param timestamp ISO 时间字符串
 * @returns 格式化后的时间
 */
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * 计算持续时间
 * @param start 开始时间
 * @param end 结束时间
 * @returns 持续时间字符串
 */
const calculateDuration = (start: string, end?: string): string => {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diff = endDate.getTime() - startDate.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`;
  }
  return `${seconds}秒`;
};

// ============================================
// 组件实现
// ============================================

export const MintHistory: React.FC<MintHistoryProps> = ({
  records,
  loading = false,
  assetName,
  onRetry,
  onViewTransaction,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // 根据筛选条件过滤记录
  const filteredRecords = useMemo(() => {
    if (activeFilter === 'all') return records;

    return records.filter((record) => {
      switch (activeFilter) {
        case 'success':
          return record.status === 'SUCCESS';
        case 'failed':
          return record.status === 'FAILED';
        case 'pending':
          return record.status === 'PENDING';
        default:
          return true;
      }
    });
  }, [records, activeFilter]);

  /**
   * 渲染时间线项目
   * @param record 铸造记录
   */
  const renderTimelineItem = (record: MintRecord) => {
    const operationConfig = OPERATION_CONFIG[record.operation];
    const statusConfig = STATUS_CONFIG[record.status];
    const isError = record.status === 'FAILED' || record.error_message;

    return (
      <Timeline.Item
        key={record.id}
        dot={
          <div
            className={`timeline-dot ${record.status.toLowerCase()}`}
            style={{ color: statusConfig?.color }}
          >
            {statusConfig?.icon || operationConfig.icon}
          </div>
        }
        color={statusConfig?.color}
      >
        <Card
          size="small"
          className={`timeline-card ${isError ? 'has-error' : ''}`}
          bodyStyle={{ padding: 12 }}
        >
          <div className="timeline-header">
            <Space align="center">
              <Tag icon={operationConfig.icon} color={operationConfig.color}>
                {operationConfig.label}
              </Tag>
              <Badge
                status={
                  record.status === 'SUCCESS'
                    ? 'success'
                    : record.status === 'FAILED'
                      ? 'error'
                      : 'processing'
                }
                text={statusConfig?.label}
              />
            </Space>
            <Text type="secondary" className="timeline-time">
              {formatTime(record.created_at)}
            </Text>
          </div>

          {/* 交易哈希 */}
          {record.tx_hash && (
            <div className="timeline-detail">
              <Text type="secondary">交易哈希: </Text>
              <Tooltip title="点击查看交易">
                <Button
                  type="link"
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={() => onViewTransaction?.(record.tx_hash!)}
                  className="tx-link"
                >
                  {record.tx_hash.slice(0, 10)}...{record.tx_hash.slice(-8)}
                </Button>
              </Tooltip>
            </div>
          )}

          {/* Token ID */}
          {record.token_id && (
            <div className="timeline-detail">
              <Text type="secondary">Token ID: </Text>
              <Tag color="success">#{record.token_id}</Tag>
            </div>
          )}

          {/* 错误信息 */}
          {record.error_message && (
            <div className="timeline-error">
              <ExclamationCircleOutlined />
              <Text type="danger">{record.error_message}</Text>
            </div>
          )}

          {/* 持续时间 */}
          {record.completed_at && (
            <div className="timeline-duration">
              <ClockCircleOutlined />
              <Text type="secondary">
                耗时: {calculateDuration(record.created_at, record.completed_at)}
              </Text>
            </div>
          )}

          {/* 重试按钮 */}
          {record.status === 'FAILED' && record.operation !== 'RETRY' && (
            <div className="timeline-actions">
              <Button
                type="primary"
                danger
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => onRetry?.(record.id)}
              >
                重试
              </Button>
            </div>
          )}
        </Card>
      </Timeline.Item>
    );
  };

  // ============================================
  // 渲染主组件
  // ============================================

  return (
    <Card
      className="mint-history-card"
      title={
        <div className="history-header">
          <HistoryOutlined />
          <span>铸造历史</span>
          {assetName && (
            <Tag color="blue" className="asset-tag">
              {assetName}
            </Tag>
          )}
        </div>
      }
      extra={
        <Tabs
          activeKey={activeFilter}
          onChange={(key) => setActiveFilter(key as FilterType)}
          size="small"
          className="filter-tabs"
        >
          <TabPane tab="全部" key="all" />
          <TabPane tab="成功" key="success" />
          <TabPane tab="失败" key="failed" />
          <TabPane tab="进行中" key="pending" />
        </Tabs>
      }
    >
      <Spin spinning={loading} tip="加载中...">
        {filteredRecords.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              activeFilter === 'all'
                ? '暂无铸造记录'
                : `暂无${
                    activeFilter === 'success'
                      ? '成功'
                      : activeFilter === 'failed'
                        ? '失败'
                        : '进行中'
                  }的铸造记录`
            }
          />
        ) : (
          <Timeline className="mint-timeline">{filteredRecords.map(renderTimelineItem)}</Timeline>
        )}
      </Spin>
    </Card>
  );
};

export default MintHistory;
