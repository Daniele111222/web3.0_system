/**
 * NFT 合约管理页面
 * 管理 NFT 合约信息和配置
 */
import React, { useEffect } from 'react';
import { Card, Descriptions, Button, Tag, Badge, Space, Alert, Row, Col, Empty, Spin } from 'antd';
import {
  FileTextOutlined,
  ReloadOutlined,
  LinkOutlined,
  EditOutlined,
  CodeOutlined,
  WalletOutlined,
  DeploymentUnitOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useContract, useMintStatistics } from '../../../hooks/useNFT';
import type { ContractInfoResponse } from '../../../types/nft';
import './style.less';

/**
 * 合约信息卡片
 */
interface ContractInfoCardProps {
  info: ContractInfoResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

const ContractInfoCard: React.FC<ContractInfoCardProps> = ({ info, loading, onRefresh }) => {
  if (loading) {
    return (
      <Card className="contract-info-card" bordered={false}>
        <Spin spinning={true}>
          <div style={{ height: 200 }} />
        </Spin>
      </Card>
    );
  }

  if (!info) {
    return (
      <Card className="contract-info-card" bordered={false}>
        <Empty description="未获取到合约信息" />
      </Card>
    );
  }

  return (
    <Card
      className="contract-info-card"
      bordered={false}
      title={
        <div className="card-header">
          <DeploymentUnitOutlined />
          <span>合约信息</span>
          <Badge
            status={info.is_connected ? 'success' : 'error'}
            text={info.is_connected ? '已连接' : '未连接'}
          />
        </div>
      }
      extra={
        <Button icon={<ReloadOutlined />} onClick={onRefresh} size="small">
          刷新
        </Button>
      }
    >
      <Descriptions column={1} className="contract-descriptions">
        <Descriptions.Item label="合约地址">
          <code className="address-text">{info.contract_address}</code>
          <Button
            type="link"
            icon={<LinkOutlined />}
            size="small"
            onClick={() =>
              window.open(`https://etherscan.io/address/${info.contract_address}`, '_blank')
            }
          >
            查看
          </Button>
        </Descriptions.Item>
        <Descriptions.Item label="部署者地址">
          <code className="address-text">{info.deployer_address}</code>
        </Descriptions.Item>
        <Descriptions.Item label="链 ID">
          <Tag color="blue">{info.chain_id}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="ABI 状态">
          <Tag color={info.has_abi ? 'success' : 'error'}>{info.has_abi ? '已加载' : '未加载'}</Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

/**
 * 合约管理页面
 */
const NFTContractsPage: React.FC = () => {
  const {
    loading: contractLoading,
    error: contractError,
    contractInfo,
    fetchContractInfo,
  } = useContract();

  const { fetchStatistics } = useMintStatistics();

  // 初始加载
  useEffect(() => {
    fetchContractInfo();
    fetchStatistics();
  }, [fetchContractInfo, fetchStatistics]);

  return (
    <div className="nft-contracts-page">
      {/* 页面标题 */}
      <div className="page-header">
        <div className="header-content">
          <FileTextOutlined className="header-icon" />
          <div className="header-text">
            <h1 className="page-title">合约管理</h1>
            <p className="page-subtitle">管理 NFT 合约信息和配置</p>
          </div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchContractInfo} loading={contractLoading}>
          刷新
        </Button>
      </div>

      {/* 错误提示 */}
      {contractError && (
        <Alert
          message="错误"
          description={contractError}
          type="error"
          closable
          className="error-alert"
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 主内容区 */}
      <Row gutter={[24, 24]}>
        {/* 左侧：合约信息 */}
        <Col xs={24} lg={12}>
          <ContractInfoCard
            info={contractInfo}
            loading={contractLoading}
            onRefresh={fetchContractInfo}
          />
        </Col>

        {/* 右侧：合约统计 */}
        <Col xs={24} lg={12}>
          <Card
            className="contract-stats-card"
            bordered={false}
            title={
              <div className="card-title">
                <CodeOutlined />
                <span>合约统计</span>
              </div>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="stat-item">
                  <div className="stat-label">已部署合约</div>
                  <div className="stat-value">1</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="stat-item">
                  <div className="stat-label">已铸造 NFT</div>
                  <div className="stat-value">2</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="stat-item">
                  <div className="stat-label">持有地址</div>
                  <div className="stat-value">2</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="stat-item">
                  <div className="stat-label">交易总数</div>
                  <div className="stat-value">5</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 底部：快捷操作 */}
      <Card
        className="quick-actions-card"
        bordered={false}
        style={{ marginTop: 24 }}
        title={
          <div className="card-title">
            <WalletOutlined />
            <span>快捷操作</span>
          </div>
        }
      >
        <Space wrap>
          <Button type="primary" icon={<EditOutlined />}>
            更新合约地址
          </Button>
          <Button icon={<CodeOutlined />}>查看 ABI</Button>
          <Button icon={<LinkOutlined />}>区块链浏览器</Button>
          <Button icon={<DownloadOutlined />}>导出合约信息</Button>
        </Space>
      </Card>
    </div>
  );
};

export default NFTContractsPage;
