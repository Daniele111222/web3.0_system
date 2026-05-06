import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { TableProps } from 'antd';
import {
  ApartmentOutlined,
  DatabaseOutlined,
  LinkOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { enterpriseService } from '../../services/enterprise';
import type { BoundWalletEnterprise } from '../../services/enterprise';
import styles from './style.module.less';

const { Search } = Input;
const { Title, Text } = Typography;

const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';

const CHAIN_NAME_MAP: Record<number, string> = {
  31337: 'Hardhat Local',
  11155111: 'Sepolia',
  80002: 'Polygon Amoy',
  97: 'BSC Testnet',
};

interface NetworkStatus {
  chainId: number;
  networkName: string;
  blockNumber: number;
}

interface HardhatWalletRow {
  key: string;
  address: string;
  balanceEth: string;
  isBound: boolean;
  enterpriseId: string | null;
  enterpriseName: string | null;
  enterpriseStatus: 'active' | 'inactive' | null;
  isVerified: boolean;
}

interface HardhatWalletSnapshot {
  address: string;
  balanceEth: string;
}

const formatAddress = (value: string, start: number = 8, end: number = 6) => {
  if (!value) return '-';
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

const normalizeQuery = (value: string) => value.trim().toLowerCase();

const formatEthBalance = (value: bigint) => {
  const parsed = Number(ethers.formatEther(value));
  if (Number.isNaN(parsed)) return '-';
  if (parsed >= 1000) return parsed.toFixed(2);
  if (parsed >= 1) return parsed.toFixed(4);
  return parsed.toFixed(6);
};

export default function HardhatWalletsPage() {
  const navigate = useNavigate();
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [enterprisesLoading, setEnterprisesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [polling, setPolling] = useState(true);
  const [walletsError, setWalletsError] = useState<string | null>(null);
  const [enterprisesError, setEnterprisesError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [walletSnapshots, setWalletSnapshots] = useState<HardhatWalletSnapshot[]>([]);
  const [boundEnterprises, setBoundEnterprises] = useState<BoundWalletEnterprise[]>([]);
  const [walletSearch, setWalletSearch] = useState('');
  const [enterpriseSearch, setEnterpriseSearch] = useState('');

  const boundEnterpriseMap = useMemo(() => {
    const map = new Map<string, BoundWalletEnterprise>();
    for (const enterprise of boundEnterprises) {
      map.set(enterprise.wallet_address.toLowerCase(), enterprise);
    }
    return map;
  }, [boundEnterprises]);

  const connectProvider = useCallback(async () => {
    try {
      const rpcProvider = new ethers.JsonRpcProvider(RPC_URL);
      await rpcProvider.getBlockNumber();
      setProvider(rpcProvider);
      setWalletsError(null);
      return rpcProvider;
    } catch {
      setWalletsError('无法连接本地 Hardhat 节点，请先在 contracts 目录执行 npm run node。');
      setProvider(null);
      return null;
    }
  }, []);

  const refreshWalletData = useCallback(async (activeProvider: ethers.JsonRpcProvider) => {
    const [accounts, blockNumber, network] = await Promise.all([
      activeProvider.send('eth_accounts', []),
      activeProvider.getBlockNumber(),
      activeProvider.getNetwork(),
    ]);

    const normalizedAccounts = (accounts as string[]).map((account) => account.toLowerCase());
    const balances = await Promise.all(
      normalizedAccounts.map(async (address) => ({
        address,
        balance: await activeProvider.getBalance(address),
      }))
    );

    setNetworkStatus({
      chainId: Number(network.chainId),
      networkName: CHAIN_NAME_MAP[Number(network.chainId)] || network.name || 'Unknown',
      blockNumber,
    });

    setWalletSnapshots(
      balances.map(({ address, balance }) => ({
        address,
        balanceEth: formatEthBalance(balance),
      }))
    );
    setWalletsError(null);
  }, []);

  const refreshBoundEnterprises = useCallback(async () => {
    const response = await enterpriseService.getBoundWalletEnterprises();
    setBoundEnterprises(response);
    setEnterprisesError(null);
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const activeProvider = provider || (await connectProvider());
      await Promise.all([
        refreshBoundEnterprises().catch((error: unknown) => {
          setEnterprisesError(error instanceof Error ? error.message : '已绑定企业数据加载失败');
        }),
        activeProvider
          ? refreshWalletData(activeProvider).catch(() => {
              setWalletsError('钱包与节点数据加载失败，请确认 Hardhat 节点状态。');
            })
          : Promise.resolve(),
      ]);
    } finally {
      setWalletsLoading(false);
      setEnterprisesLoading(false);
      setRefreshing(false);
    }
  }, [connectProvider, provider, refreshBoundEnterprises, refreshWalletData]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const activeProvider = await connectProvider();
      if (!isMounted) return;

      await Promise.all([
        refreshBoundEnterprises().catch((error: unknown) => {
          if (isMounted) {
            setEnterprisesError(error instanceof Error ? error.message : '已绑定企业数据加载失败');
          }
        }),
        activeProvider
          ? refreshWalletData(activeProvider).catch(() => {
              if (isMounted) {
                setWalletsError('钱包与节点数据加载失败，请确认 Hardhat 节点状态。');
              }
            })
          : Promise.resolve(),
      ]);

      if (isMounted) {
        setWalletsLoading(false);
        setEnterprisesLoading(false);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [connectProvider, refreshBoundEnterprises, refreshWalletData]);

  useEffect(() => {
    if (!polling) return undefined;
    const timer = window.setInterval(() => {
      void refreshAll();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [polling, refreshAll]);

  const filteredWalletRows = useMemo(() => {
    const walletRows: HardhatWalletRow[] = walletSnapshots.map(({ address, balanceEth }) => {
      const boundEnterprise = boundEnterpriseMap.get(address);
      return {
        key: address,
        address,
        balanceEth,
        isBound: Boolean(boundEnterprise),
        enterpriseId: boundEnterprise?.enterprise_id || null,
        enterpriseName: boundEnterprise?.enterprise_name || null,
        enterpriseStatus: boundEnterprise
          ? boundEnterprise.is_active
            ? 'active'
            : 'inactive'
          : null,
        isVerified: boundEnterprise?.is_verified || false,
      };
    });

    const query = normalizeQuery(walletSearch);
    if (!query) return walletRows;
    return walletRows.filter((item) => {
      const enterpriseName = item.enterpriseName?.toLowerCase() || '';
      return item.address.includes(query) || enterpriseName.includes(query);
    });
  }, [boundEnterpriseMap, walletSearch, walletSnapshots]);

  const filteredBoundEnterprises = useMemo(() => {
    const query = normalizeQuery(enterpriseSearch);
    if (!query) return boundEnterprises;
    return boundEnterprises.filter((item) => {
      return (
        item.enterprise_name.toLowerCase().includes(query) ||
        item.wallet_address.toLowerCase().includes(query)
      );
    });
  }, [boundEnterprises, enterpriseSearch]);

  const walletColumns: TableProps<HardhatWalletRow>['columns'] = [
    {
      title: '钱包地址',
      dataIndex: 'address',
      key: 'address',
      render: (value: string) => (
        <Text copyable={{ text: value }} className={styles.monoText}>
          {formatAddress(value)}
        </Text>
      ),
    },
    {
      title: '余额 (ETH)',
      dataIndex: 'balanceEth',
      key: 'balanceEth',
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: '绑定状态',
      dataIndex: 'isBound',
      key: 'isBound',
      render: (value: boolean) =>
        value ? (
          <Tag color="success" className={styles.statusTag}>
            已绑定
          </Tag>
        ) : (
          <Tag color="default" className={styles.statusTag}>
            未绑定
          </Tag>
        ),
    },
    {
      title: '企业名称',
      dataIndex: 'enterpriseName',
      key: 'enterpriseName',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text>{record.enterpriseName || '未绑定'}</Text>
          {record.enterpriseId && (
            <Text type="secondary" className={styles.monoText}>
              {formatAddress(record.enterpriseId, 10, 8)}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '企业状态',
      dataIndex: 'enterpriseStatus',
      key: 'enterpriseStatus',
      render: (_, record) => {
        if (!record.enterpriseName) return <Tag color="default">-</Tag>;
        return (
          <Space size={8}>
            <Tag color={record.enterpriseStatus === 'active' ? 'green' : 'red'}>
              {record.enterpriseStatus === 'active' ? '活跃' : '停用'}
            </Tag>
            {record.isVerified && <Tag color="blue">已认证</Tag>}
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) =>
        record.enterpriseId ? (
          <Button
            type="link"
            onClick={() => navigate(`/enterprises/${record.enterpriseId}?tab=settings`)}
          >
            查看企业
          </Button>
        ) : (
          <Button type="link" onClick={() => navigate('/enterprises')}>
            去绑定
          </Button>
        ),
    },
  ];

  const enterpriseColumns: TableProps<BoundWalletEnterprise>['columns'] = [
    {
      title: '企业名称',
      dataIndex: 'enterprise_name',
      key: 'enterprise_name',
      render: (value: string, record) => (
        <Space direction="vertical" size={2}>
          <Text>{value}</Text>
          <Text type="secondary" className={styles.monoText}>
            {formatAddress(record.enterprise_id, 10, 8)}
          </Text>
        </Space>
      ),
    },
    {
      title: '企业钱包',
      dataIndex: 'wallet_address',
      key: 'wallet_address',
      render: (value: string) => (
        <Text copyable={{ text: value }} className={styles.monoText}>
          {formatAddress(value)}
        </Text>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => (
        <Space size={8}>
          <Tag color={record.is_active ? 'green' : 'red'}>{record.is_active ? '活跃' : '停用'}</Tag>
          {record.is_verified && <Tag color="blue">已认证</Tag>}
        </Space>
      ),
    },
    {
      title: '成员数',
      dataIndex: 'member_count',
      key: 'member_count',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/enterprises/${record.enterprise_id}?tab=settings`)}
        >
          查看企业
        </Button>
      ),
    },
  ];

  const isInitialLoading = walletsLoading || enterprisesLoading;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <Title level={2} className={styles.heroTitle}>
            <WalletOutlined /> Hardhat 钱包总览
          </Title>
          <Text type="secondary">读取本地 Hardhat 默认账户，并映射系统内所有已绑定企业钱包。</Text>
          <div className={styles.heroMeta}>
            <Tag color="processing" icon={<LinkOutlined />}>
              RPC: {RPC_URL}
            </Tag>
            <Tag color="cyan" icon={<DatabaseOutlined />}>
              {networkStatus?.networkName || '等待连接'}
            </Tag>
            <Tag color="gold" icon={<SafetyCertificateOutlined />}>
              仅登录用户可见
            </Tag>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Button onClick={() => setPolling((value) => !value)}>
            {polling ? '暂停轮询' : '开始轮询'}
          </Button>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={refreshing}
            onClick={refreshAll}
          >
            立即刷新
          </Button>
        </div>
      </div>

      {walletsError && (
        <Alert
          type="warning"
          showIcon
          message="节点连接异常"
          description={walletsError}
          action={
            <Button size="small" type="primary" onClick={refreshAll}>
              重试
            </Button>
          }
        />
      )}

      {enterprisesError && (
        <Alert
          type="error"
          showIcon
          message="企业绑定数据加载失败"
          description={enterprisesError}
        />
      )}

      {isInitialLoading ? (
        <div className={styles.emptyBlock}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} className={styles.statsRow}>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title="当前链"
                  value={networkStatus?.networkName || '-'}
                  prefix={<LinkOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title="Chain ID"
                  value={networkStatus?.chainId || 0}
                  prefix={<ApartmentOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title="当前区块高度"
                  value={networkStatus?.blockNumber || 0}
                  prefix={<DatabaseOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title="默认账户数 / 已绑定企业数"
                  value={`${walletSnapshots.length} / ${boundEnterprises.length}`}
                  prefix={<WalletOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card
            className={styles.sectionCard}
            title={
              <div className={styles.cardTitle}>
                <span>Hardhat 默认账户</span>
                <Text type="secondary">节点账户与企业绑定映射</Text>
              </div>
            }
          >
            <div className={styles.toolbar}>
              <div className={styles.toolbarGroup}>
                <Search
                  placeholder="按钱包地址或企业名称筛选"
                  allowClear
                  value={walletSearch}
                  onChange={(event) => setWalletSearch(event.target.value)}
                  style={{ width: 320 }}
                />
                <Text type="secondary">结果：{filteredWalletRows.length} 条</Text>
              </div>
              <Tooltip title="如果某个钱包未绑定企业，可从这里直接跳到企业管理页继续绑定。">
                <Tag color="default">只读总览</Tag>
              </Tooltip>
            </div>

            {walletSnapshots.length === 0 && !walletsError ? (
              <Empty description="当前节点未暴露默认账户" className={styles.emptyBlock} />
            ) : (
              <Table
                rowKey="key"
                columns={walletColumns}
                dataSource={filteredWalletRows}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                scroll={{ x: 1080 }}
              />
            )}
          </Card>

          <Card
            className={styles.sectionCard}
            title={
              <div className={styles.cardTitle}>
                <span>系统内已绑定企业</span>
                <Text type="secondary">即使钱包不在 Hardhat 默认账户中，也会保留展示</Text>
              </div>
            }
          >
            <div className={styles.toolbar}>
              <div className={styles.toolbarGroup}>
                <Search
                  placeholder="按企业名或钱包地址筛选"
                  allowClear
                  value={enterpriseSearch}
                  onChange={(event) => setEnterpriseSearch(event.target.value)}
                  style={{ width: 320 }}
                />
                <Text type="secondary">结果：{filteredBoundEnterprises.length} 条</Text>
              </div>
            </div>

            {filteredBoundEnterprises.length === 0 ? (
              <Empty description="暂无已绑定企业钱包" className={styles.emptyBlock} />
            ) : (
              <Table
                rowKey="enterprise_id"
                columns={enterpriseColumns}
                dataSource={filteredBoundEnterprises}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                scroll={{ x: 980 }}
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
