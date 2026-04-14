import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ethers } from 'ethers';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Input,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { BlockOutlined, LinkOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { IPNFT_ABI } from '../utils/abis/IPNFT';

const { Title, Text, Paragraph } = Typography;

const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = import.meta.env.VITE_IPNFT_CONTRACT_ADDRESS || '';
const EXPLORER_URL = import.meta.env.VITE_BLOCK_EXPLORER_URL || '';

const CHAIN_NAME_MAP: Record<number, string> = {
  31337: 'Hardhat Local',
  11155111: 'Sepolia',
  80002: 'Polygon Amoy',
  97: 'BSC Testnet',
};

const CHAIN_EXPLORER_MAP: Record<number, string> = {
  31337: '',
  11155111: 'https://sepolia.etherscan.io',
  80002: 'https://amoy.polygonscan.com',
  97: 'https://testnet.bscscan.com',
};

interface NetworkStatus {
  chainId: number;
  networkName: string;
  blockNumber: number;
}

interface ContractInfo {
  name: string;
  symbol: string;
  totalSupply: number;
  contractAddress: string;
}

interface MintRecord {
  key: string;
  tokenId: string;
  receiver: string;
  mintedAt: string;
  txHash: string;
}

interface TransferRecord {
  key: string;
  tokenId: string;
  from: string;
  to: string;
  time: string;
  txHash: string;
}

interface TokenQueryResult {
  tokenId: number;
  owner: string;
  originalCreator: string;
  mintedAt: string;
  tokenURI: string;
  metadata: unknown | null;
}

const formatAddress = (value: string, start: number = 6, end: number = 4) => {
  if (!value) return '-';
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

const toDateTime = (unixTimestamp: number) =>
  new Date(unixTimestamp * 1000).toLocaleString('zh-CN');

const normalizeIpfsUrl = (uri: string) => {
  if (uri.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`;
  }
  return uri;
};

const isLikelyAddress = (query: string) => /^0x[a-fA-F0-9]{40}$/.test(query);

const isEventLog = (log: ethers.Log | ethers.EventLog): log is ethers.EventLog => 'args' in log;

export default function BlockchainExplorer() {
  const [searchParams] = useSearchParams();
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [polling, setPolling] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [mintRecords, setMintRecords] = useState<MintRecord[]>([]);
  const [transferRecords, setTransferRecords] = useState<TransferRecord[]>([]);
  const [transferQuery, setTransferQuery] = useState('');
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [tokenQueryLoading, setTokenQueryLoading] = useState(false);
  const [tokenQueryError, setTokenQueryError] = useState<string | null>(null);
  const [tokenQueryResult, setTokenQueryResult] = useState<TokenQueryResult | null>(null);

  const txExplorerBaseUrl = useMemo(() => {
    if (EXPLORER_URL) return EXPLORER_URL;
    if (!networkStatus) return '';
    return CHAIN_EXPLORER_MAP[networkStatus.chainId] || '';
  }, [networkStatus]);

  const buildTxLink = useCallback(
    (txHash: string) => {
      if (!txExplorerBaseUrl) return '';
      return `${txExplorerBaseUrl}/tx/${txHash}`;
    },
    [txExplorerBaseUrl]
  );

  const txHashQuery = useMemo(() => searchParams.get('txHash')?.trim() || '', [searchParams]);

  const initConnection = useCallback(async () => {
    try {
      setLoading(true);
      const rpcProvider = new ethers.JsonRpcProvider(RPC_URL);
      const blockNumber = await rpcProvider.getBlockNumber();
      const network = await rpcProvider.getNetwork();
      const chainId = Number(network.chainId);

      setNetworkStatus({
        chainId,
        networkName: CHAIN_NAME_MAP[chainId] || network.name || 'Unknown',
        blockNumber,
      });
      setProvider(rpcProvider);
      setContract(
        CONTRACT_ADDRESS ? new ethers.Contract(CONTRACT_ADDRESS, IPNFT_ABI, rpcProvider) : null
      );
      setConnectionError(null);
    } catch {
      setConnectionError('无法连接区块链节点，请先在 contracts 目录执行 npm run node');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!provider) return;
    setRefreshing(true);
    try {
      const latestBlock = await provider.getBlockNumber();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      setNetworkStatus({
        chainId,
        networkName: CHAIN_NAME_MAP[chainId] || network.name || 'Unknown',
        blockNumber: latestBlock,
      });

      if (!contract) {
        setContractInfo({
          name: '-',
          symbol: '-',
          totalSupply: 0,
          contractAddress: CONTRACT_ADDRESS || '-',
        });
        setMintRecords([]);
        setTransferRecords([]);
        return;
      }

      const [name, symbol, totalSupplyRaw] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.totalSupply(),
      ]);

      setContractInfo({
        name: String(name),
        symbol: String(symbol),
        totalSupply: Number(totalSupplyRaw),
        contractAddress: CONTRACT_ADDRESS,
      });

      const fromBlock = latestBlock > 5000 ? latestBlock - 5000 : 0;
      const [mintEvents, transferEvents] = await Promise.all([
        contract.queryFilter(contract.filters.NFTMinted(), fromBlock, latestBlock),
        contract.queryFilter(contract.filters.NFTTransferred(), fromBlock, latestBlock),
      ]);

      const blockTimestampCache = new Map<number, string>();
      const getBlockTime = async (blockNumber: number) => {
        if (blockTimestampCache.has(blockNumber)) {
          return blockTimestampCache.get(blockNumber) as string;
        }
        const block = await provider.getBlock(blockNumber);
        const formatted = block ? toDateTime(Number(block.timestamp)) : '-';
        blockTimestampCache.set(blockNumber, formatted);
        return formatted;
      };

      const sortedMints = [...mintEvents]
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, 50);

      const mintRows: MintRecord[] = await Promise.all(
        sortedMints.filter(isEventLog).map(async (event) => {
          const tokenId = event.args?.[0]?.toString() || '-';
          const receiver = event.args?.[2] || '-';
          const mintedAt = await getBlockTime(event.blockNumber);
          return {
            key: `${event.transactionHash}-${event.index}`,
            tokenId,
            receiver,
            mintedAt,
            txHash: event.transactionHash,
          };
        })
      );

      const sortedTransfers = [...transferEvents].sort((a, b) => b.blockNumber - a.blockNumber);
      const transferRows: TransferRecord[] = await Promise.all(
        sortedTransfers.filter(isEventLog).map(async (event) => {
          const tokenId = event.args?.[0]?.toString() || '-';
          const from = event.args?.[1] || '-';
          const to = event.args?.[2] || '-';
          const time = await getBlockTime(event.blockNumber);
          return {
            key: `${event.transactionHash}-${event.index}`,
            tokenId,
            from,
            to,
            time,
            txHash: event.transactionHash,
          };
        })
      );

      setMintRecords(mintRows);
      setTransferRecords(transferRows);
      setConnectionError(null);
    } catch {
      setConnectionError('链上数据拉取失败，请检查合约地址与节点状态');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [provider, contract]);

  const handleTokenQuery = useCallback(async () => {
    setTokenQueryError(null);
    setTokenQueryResult(null);
    if (!contract) {
      setTokenQueryError('未配置合约地址，无法执行 Token 查询');
      return;
    }
    const tokenId = Number(tokenIdInput.trim());
    if (!Number.isInteger(tokenId) || tokenId <= 0) {
      setTokenQueryError('请输入有效的 Token ID（正整数）');
      return;
    }
    try {
      setTokenQueryLoading(true);
      const [owner, creator, mintTimestampRaw, tokenURI] = await Promise.all([
        contract.ownerOf(tokenId),
        contract.getOriginalCreator(tokenId),
        contract.getMintTimestamp(tokenId),
        contract.tokenURI(tokenId),
      ]);
      const mintTimestamp = Number(mintTimestampRaw);
      const metadataUrl = normalizeIpfsUrl(String(tokenURI));
      let metadata: unknown | null = null;
      try {
        const response = await fetch(metadataUrl);
        if (response.ok) {
          metadata = await response.json();
        }
      } catch {
        metadata = null;
      }
      setTokenQueryResult({
        tokenId,
        owner: String(owner),
        originalCreator: String(creator),
        mintedAt: toDateTime(mintTimestamp),
        tokenURI: String(tokenURI),
        metadata,
      });
    } catch {
      setTokenQueryError('查询失败，请确认 Token ID 是否存在');
    } finally {
      setTokenQueryLoading(false);
    }
  }, [contract, tokenIdInput]);

  const filteredTransferRecords = useMemo(() => {
    if (txHashQuery) {
      const normalizedTxHash = txHashQuery.toLowerCase();
      return transferRecords.filter((item) => item.txHash.toLowerCase() === normalizedTxHash);
    }
    const query = transferQuery.trim();
    if (!query) return transferRecords.slice(0, 100);
    if (/^\d+$/.test(query)) {
      return transferRecords.filter((item) => item.tokenId === query);
    }
    if (isLikelyAddress(query)) {
      const normalized = query.toLowerCase();
      return transferRecords.filter(
        (item) => item.from.toLowerCase() === normalized || item.to.toLowerCase() === normalized
      );
    }
    return transferRecords.filter(
      (item) =>
        item.from.toLowerCase().includes(query.toLowerCase()) ||
        item.to.toLowerCase().includes(query.toLowerCase()) ||
        item.txHash.toLowerCase().includes(query.toLowerCase())
    );
  }, [transferRecords, transferQuery, txHashQuery]);

  const filteredMintRecords = useMemo(() => {
    if (!txHashQuery) {
      return mintRecords;
    }
    const normalizedTxHash = txHashQuery.toLowerCase();
    return mintRecords.filter((item) => item.txHash.toLowerCase() === normalizedTxHash);
  }, [mintRecords, txHashQuery]);

  useEffect(() => {
    initConnection();
  }, [initConnection]);

  useEffect(() => {
    if (!provider) return;
    refreshData();
  }, [provider, refreshData]);

  useEffect(() => {
    if (!provider || !polling) return;
    const timer = setInterval(refreshData, 10000);
    return () => clearInterval(timer);
  }, [provider, polling, refreshData]);

  const mintColumns: TableProps<MintRecord>['columns'] = [
    {
      title: 'Token ID',
      dataIndex: 'tokenId',
      key: 'tokenId',
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '接收地址',
      dataIndex: 'receiver',
      key: 'receiver',
      render: (value: string) => <Text copyable={{ text: value }}>{formatAddress(value)}</Text>,
    },
    {
      title: '铸造时间',
      dataIndex: 'mintedAt',
      key: 'mintedAt',
    },
    {
      title: '交易哈希',
      dataIndex: 'txHash',
      key: 'txHash',
      render: (value: string) =>
        txExplorerBaseUrl ? (
          <a href={buildTxLink(value)} target="_blank" rel="noreferrer">
            {formatAddress(value, 10, 8)}
          </a>
        ) : (
          <Text copyable={{ text: value }}>{formatAddress(value, 10, 8)}</Text>
        ),
    },
  ];

  const transferColumns: TableProps<TransferRecord>['columns'] = [
    {
      title: 'Token ID',
      dataIndex: 'tokenId',
      key: 'tokenId',
      render: (value: string) => <Tag color="purple">{value}</Tag>,
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      render: (value: string) => <Text copyable={{ text: value }}>{formatAddress(value)}</Text>,
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
      render: (value: string) => <Text copyable={{ text: value }}>{formatAddress(value)}</Text>,
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '交易哈希',
      dataIndex: 'txHash',
      key: 'txHash',
      render: (value: string) =>
        txExplorerBaseUrl ? (
          <a href={buildTxLink(value)} target="_blank" rel="noreferrer">
            {formatAddress(value, 10, 8)}
          </a>
        ) : (
          <Text copyable={{ text: value }}>{formatAddress(value, 10, 8)}</Text>
        ),
    },
  ];

  if (connectionError) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="区块链连接失败"
          type="error"
          description={connectionError}
          action={
            <Button type="primary" onClick={initConnection}>
              重新连接
            </Button>
          }
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            <LinkOutlined /> 区块链浏览器
          </Title>
          <Text type="secondary">公开访问 | RPC: {RPC_URL}</Text>
        </div>

        {txHashQuery && (
          <Alert
            type="info"
            showIcon
            message="正在查看指定交易"
            description={`交易哈希：${txHashQuery}`}
          />
        )}

        {!CONTRACT_ADDRESS && (
          <Alert
            type="warning"
            showIcon
            message="未配置 VITE_IPNFT_CONTRACT_ADDRESS，合约相关功能不可用"
          />
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card>
                  <Statistic
                    title="当前链"
                    value={networkStatus?.networkName || '-'}
                    prefix={<LinkOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card>
                  <Statistic
                    title="Chain ID"
                    value={networkStatus?.chainId || 0}
                    prefix={<SyncOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card>
                  <Statistic
                    title="当前区块高度"
                    value={networkStatus?.blockNumber || 0}
                    prefix={<BlockOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={24} lg={6}>
                <Card>
                  <Space direction="vertical" size={4}>
                    <Text strong>合约地址</Text>
                    <Text
                      copyable={{ text: contractInfo?.contractAddress || CONTRACT_ADDRESS || '' }}
                    >
                      {formatAddress(contractInfo?.contractAddress || CONTRACT_ADDRESS || '-')}
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>

            <Card
              title="NFT 合约数据"
              extra={
                <Space>
                  <Button onClick={() => setPolling((prev) => !prev)}>
                    {polling ? '暂停轮询' : '开始轮询'}
                  </Button>
                  <Button type="primary" loading={refreshing} onClick={refreshData}>
                    立即刷新
                  </Button>
                </Space>
              }
            >
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Statistic
                    title="总供应量 (totalSupply)"
                    value={contractInfo?.totalSupply || 0}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic title="合约名称" value={contractInfo?.name || '-'} />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic title="合约符号" value={contractInfo?.symbol || '-'} />
                </Col>
              </Row>
            </Card>

            <Card title="最新铸造记录（NFTMinted 最近 50 条）">
              <Table
                columns={mintColumns}
                dataSource={filteredMintRecords}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                scroll={{ x: 900 }}
              />
            </Card>

            <Card title="Token 查询工具">
              <Space style={{ marginBottom: 16 }} wrap>
                <Input
                  placeholder="请输入 Token ID"
                  value={tokenIdInput}
                  onChange={(event) => setTokenIdInput(event.target.value)}
                  style={{ width: 240 }}
                  onPressEnter={handleTokenQuery}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleTokenQuery}
                  loading={tokenQueryLoading}
                >
                  查询
                </Button>
              </Space>
              {tokenQueryError && <Alert type="error" showIcon message={tokenQueryError} />}
              {tokenQueryResult && (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label="Token ID">
                      {tokenQueryResult.tokenId}
                    </Descriptions.Item>
                    <Descriptions.Item label="当前所有者">
                      <Text copyable={{ text: tokenQueryResult.owner }}>
                        {tokenQueryResult.owner}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="原始创建者">
                      <Text copyable={{ text: tokenQueryResult.originalCreator }}>
                        {tokenQueryResult.originalCreator}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="铸造时间">
                      {tokenQueryResult.mintedAt}
                    </Descriptions.Item>
                    <Descriptions.Item label="Token URI">
                      <a
                        href={normalizeIpfsUrl(tokenQueryResult.tokenURI)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {tokenQueryResult.tokenURI}
                      </a>
                    </Descriptions.Item>
                  </Descriptions>
                  <div>
                    <Text strong>IPFS 元数据</Text>
                    <pre
                      style={{
                        marginTop: 8,
                        maxHeight: 360,
                        overflow: 'auto',
                        padding: 12,
                        background: '#f7f7f7',
                        borderRadius: 6,
                      }}
                    >
                      {tokenQueryResult.metadata
                        ? JSON.stringify(tokenQueryResult.metadata, null, 2)
                        : '元数据加载失败或为空'}
                    </pre>
                  </div>
                </Space>
              )}
            </Card>

            <Card title="转移历史查询">
              <Space style={{ marginBottom: 16 }} wrap>
                <Input
                  placeholder="输入地址或 Token ID"
                  value={transferQuery}
                  onChange={(event) => setTransferQuery(event.target.value)}
                  style={{ width: 320 }}
                />
                <Text type="secondary">当前结果：{filteredTransferRecords.length} 条</Text>
              </Space>
              <Table
                columns={transferColumns}
                dataSource={filteredTransferRecords}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                scroll={{ x: 1000 }}
              />
            </Card>

            <Divider />
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              区块浏览器外链：{txExplorerBaseUrl || '当前网络未配置外链'}
            </Paragraph>
          </>
        )}
      </Space>
    </div>
  );
}
