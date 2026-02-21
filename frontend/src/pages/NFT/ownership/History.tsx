/**
 * NFT 历史溯源页面
 * 展示 NFT 的完整流转历史记录
 */
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
import { ownershipService } from '../../../services/ownership';
import type { OwnershipAsset, TransferRecord } from '../../../types/ownership';
import { TransferType } from '../../../types/ownership';
import styles from './style.module.less';

const { Text } = Typography;

// 转移类型配置
const EVENT_CONFIG: Record<TransferType, { color: string; icon: React.ReactNode; label: string }> =
  {
    [TransferType.MINT]: {
      color: 'green',
      icon: <CheckCircleOutlined />,
      label: '铸造',
    },
    [TransferType.TRANSFER]: {
      color: 'blue',
      icon: <SendOutlined />,
      label: '转移',
    },
    [TransferType.LICENSE]: {
      color: 'purple',
      icon: <ClockCircleOutlined />,
      label: '许可',
    },
    [TransferType.STAKE]: {
      color: 'orange',
      icon: <LockOutlined />,
      label: '质押',
    },
    [TransferType.UNSTAKE]: {
      color: 'cyan',
      icon: <LockOutlined />,
      label: '解除质押',
    },
    [TransferType.BURN]: {
      color: 'red',
      icon: <FireOutlined />,
      label: '销毁',
    },
  };

const NFTHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { tokenId } = useParams<{ tokenId: string }>();

  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<OwnershipAsset | null>(null);
  const [history, setHistory] = useState<TransferRecord[]>([]);

  // 加载数据
  useEffect(() => {
    if (tokenId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 格式化交易哈希
  const formatTxHash = (hash: string | null) => {
    if (!hash) return '-';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  // 打开区块链浏览器
  const openExplorer = (txHash: string) => {
    const explorerUrl = import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://etherscan.io';
    window.open(`${explorerUrl}/tx/${txHash}`, '_blank');
  };

  return (
    <div className={styles.nftHistoryPage}>
      <div className={styles.pageHeader}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')}>
            返回权属看板
          </Button>
          <HistoryOutlined className={styles.headerIcon} />
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>历史溯源</h1>
            <p className={styles.pageSubtitle}>NFT 完整流转记录</p>
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
                    {new Date(asset.created_at).toLocaleString('zh-CN')}
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
                    const config =
                      EVENT_CONFIG[record.transfer_type] || EVENT_CONFIG[TransferType.TRANSFER];
                    return {
                      color: config.color,
                      label: new Date(record.timestamp).toLocaleString('zh-CN'),
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
                                {record.from_enterprise_name ||
                                  `${record.from_address.slice(
                                    0,
                                    6
                                  )}...${record.from_address.slice(-4)}`}
                              </Descriptions.Item>
                              <Descriptions.Item label="to">
                                {record.to_enterprise_name ||
                                  `${record.to_address.slice(
                                    0,
                                    6
                                  )}...${record.to_address.slice(-4)}`}
                              </Descriptions.Item>
                              {record.tx_hash && (
                                <Descriptions.Item label="交易哈希" span={2}>
                                  <Space>
                                    <Text
                                      copyable
                                      style={{
                                        fontFamily: 'monospace',
                                        fontSize: 12,
                                      }}
                                    >
                                      {formatTxHash(record.tx_hash)}
                                    </Text>
                                    <Button
                                      type="link"
                                      icon={<LinkOutlined />}
                                      size="small"
                                      onClick={() => openExplorer(record.tx_hash!)}
                                    >
                                      查看
                                    </Button>
                                  </Space>
                                </Descriptions.Item>
                              )}
                              {record.block_number && (
                                <Descriptions.Item label="区块">
                                  #{record.block_number}
                                </Descriptions.Item>
                              )}
                              <Descriptions.Item label="状态">
                                <Tag color={record.status === 'CONFIRMED' ? 'success' : 'warning'}>
                                  {record.status === 'CONFIRMED' ? '已确认' : record.status}
                                </Tag>
                              </Descriptions.Item>
                            </Descriptions>
                            {record.remarks && <Text type="secondary">备注：{record.remarks}</Text>}
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
