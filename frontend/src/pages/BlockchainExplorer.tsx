import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Card, Row, Col, Statistic, Table, Tag, Spin, Alert, Divider, Typography } from 'antd';
import { BlockOutlined, SwapOutlined, ClockCircleOutlined, DatabaseOutlined, LinkOutlined } from '@ant-design/icons';
import type { Block, TransactionResponse } from 'ethers';

const { Title, Text } = Typography;

interface BlockchainStats {
  blockNumber: number;
  gasPrice: string;
  chainId: number;
  networkName: string;
}

interface BlockInfo {
  number: number;
  hash: string;
  timestamp: number;
  transactions: number;
  gasUsed: string;
  gasLimit: string;
  miner: string;
}

export default function BlockchainExplorer() {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';

  useEffect(() => {
    initProvider();
    return () => {
      setPolling(false);
    };
  }, []);

  useEffect(() => {
    if (provider && polling) {
      fetchData();
      const interval = setInterval(fetchData, 5000); // 每5秒刷新一次
      return () => clearInterval(interval);
    }
  }, [provider, polling]);

  const initProvider = async () => {
    try {
      const newProvider = new ethers.JsonRpcProvider(RPC_URL);
      
      // 测试连接
      await newProvider.getBlockNumber();
      
      setProvider(newProvider);
      setError(null);
    } catch (err) {
      setError('无法连接到区块链节点，请确保 Hardhat 节点已启动 (npm run node)');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!provider) return;

    try {
      // 获取基础统计信息
      const blockNumber = await provider.getBlockNumber();
      const network = await provider.getNetwork();
      const gasPrice = await provider.getFeeData();

      setStats({
        blockNumber,
        gasPrice: gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') : '0',
        chainId: Number(network.chainId),
        networkName: network.name || 'Unknown',
      });

      // 获取最近10个区块
      const recentBlocks: BlockInfo[] = [];
      for (let i = 0; i < 10; i++) {
        const blockNum = blockNumber - i;
        if (blockNum < 0) break;

        const block = await provider.getBlock(blockNum);
        if (block) {
          recentBlocks.push({
            number: block.number,
            hash: block.hash,
            timestamp: Number(block.timestamp),
            transactions: block.transactions.length,
            gasUsed: block.gasUsed.toString(),
            gasLimit: block.gasLimit.toString(),
            miner: block.miner,
          });
        }
      }

      setBlocks(recentBlocks);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('获取数据失败:', err);
      setError('获取区块链数据失败');
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN');
  };

  const formatHash = (hash: string, length: number = 12) => {
    if (!hash) return '';
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  const blockColumns = [
    {
      title: '区块高度',
      dataIndex: 'number',
      key: 'number',
      render: (num: number) => <Tag color="blue">{num.toLocaleString()}</Tag>,
    },
    {
      title: '区块哈希',
      dataIndex: 'hash',
      key: 'hash',
      render: (hash: string) => (
        <Text copyable={{ text: hash }}>{formatHash(hash, 8)}</Text>
      ),
    },
    {
      title: '时间戳',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (ts: number) => (
        <span><ClockCircleOutlined /> {formatTimestamp(ts)}</span>
      ),
    },
    {
      title: '交易数',
      dataIndex: 'transactions',
      key: 'transactions',
      render: (count: number) => (
        <Tag color={count > 0 ? 'green' : 'default'}>
          <SwapOutlined /> {count}
        </Tag>
      ),
    },
    {
      title: 'Gas 使用量',
      dataIndex: 'gasUsed',
      key: 'gasUsed',
      render: (gas: string) => Number(gas).toLocaleString(),
    },
    {
      title: '矿工地址',
      dataIndex: 'miner',
      key: 'miner',
      render: (miner: string) => formatHash(miner, 6),
    },
  ];

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="连接错误"
          description={
            <div>
              <p>{error}</p>
              <p>请确保已启动 Hardhat 节点：</p>
              <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                cd contracts{'\n'}
                npm run node
              </pre>
            </div>
          }
          type="error"
          showIcon
          action={
            <button
              onClick={initProvider}
              style={{
                padding: '4px 12px',
                background: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              重新连接
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <LinkOutlined /> 区块链浏览器
        </Title>
        <Text type="secondary">
          实时监控本地 Hardhat 区块链网络状态 | RPC: {RPC_URL}
        </Text>
      </div>

      {loading && !stats ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px' }}>正在连接区块链节点...</p>
        </div>
      ) : (
        <>
          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="当前区块高度"
                  value={stats?.blockNumber || 0}
                  prefix={<BlockOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Gas 价格"
                  value={stats?.gasPrice || 0}
                  suffix="Gwei"
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="网络 ID"
                  value={stats?.chainId || 0}
                  prefix={<LinkOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="网络名称"
                  value={stats?.networkName || 'Unknown'}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 区块列表 */}
          <Card
            title={
              <span>
                <DatabaseOutlined /> 最新区块
                {polling && <Tag color="green" style={{ marginLeft: 8 }}>实时更新中</Tag>}
              </span>
            }
            extra={
              <div>
                <button
                  onClick={() => setPolling(!polling)}
                  style={{
                    padding: '4px 12px',
                    background: polling ? '#ff4d4f' : '#52c41a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '8px',
                  }}
                >
                  {polling ? '暂停更新' : '开始更新'}
                </button>
                <button
                  onClick={fetchData}
                  style={{
                    padding: '4px 12px',
                    background: '#1890ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  立即刷新
                </button>
              </div>
            }
          >
            <Table
              dataSource={blocks}
              columns={blockColumns}
              rowKey="number"
              pagination={false}
              loading={loading}
              scroll={{ x: 1200 }}
            />
          </Card>

          <Divider />

          {/* 连接信息 */}
          <Card title="连接信息" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Text strong>RPC URL:</Text>
                <br />
                <Text code>{RPC_URL}</Text>
              </Col>
              <Col span={8}>
                <Text strong>Chain ID:</Text>
                <br />
                <Text code>{stats?.chainId || 'N/A'}</Text>
              </Col>
              <Col span={8}>
                <Text strong>当前区块:</Text>
                <br />
                <Text code>{stats?.blockNumber || 'N/A'}</Text>
              </Col>
            </Row>
          </Card>
        </>
      )}
    </div>
  );
}
