/**
 * NFT Dashboard 数据概览页面
 * 展示NFT铸造的统计信息和快捷操作
 */
import React, { useEffect, useMemo } from 'react';
import { Row, Col, Card, Statistic, Button, Spin } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  HistoryOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMintStatistics } from '../../../hooks/useNFT';
import './style.less';

/**
 * 统计卡片组件
 */
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick }) => (
  <Card
    className="dashboard-stat-card"
    bordered={false}
    hoverable
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    <div className="stat-content">
      <div className="stat-icon" style={{ color, background: `${color}20` }}>
        {icon}
      </div>
      <div className="stat-info">
        <div className="stat-title">{title}</div>
        <div className="stat-value" style={{ color }}>
          <Statistic value={value} />
        </div>
      </div>
    </div>
  </Card>
);

/**
 * Dashboard 主组件
 */
const NFTDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { loading, statistics: rawStats, fetchStatistics } = useMintStatistics();

  // 统计数据转换
  const statistics = useMemo(() => {
    if (!rawStats) return null;
    return {
      total_assets: rawStats.total_assets,
      minted_count: rawStats.minted_count,
      minting_count: rawStats.minting_count,
      failed_count: rawStats.failed_count,
      pending_count: rawStats.pending_count,
      draft_count: rawStats.draft_count,
      recent_mints: rawStats.recent_mints || [],
    };
  }, [rawStats]);

  // 初始加载
  useEffect(() => {
    fetchStatistics();
  }, []);

  // 渲染统计卡片
  const renderStatCards = () => {
    if (!statistics) return null;

    return (
      <Row gutter={[16, 16]} className="stat-cards-row">
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="可铸造"
            value={statistics.draft_count + statistics.pending_count}
            icon={<FileTextOutlined />}
            color="#00d4ff"
            onClick={() => navigate('/nft/assets')}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="铸造中"
            value={statistics.minting_count}
            icon={<FireOutlined />}
            color="#ffaa00"
            onClick={() => navigate('/nft/minting')}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="已铸造"
            value={statistics.minted_count}
            icon={<CheckCircleOutlined />}
            color="#00ff88"
            onClick={() => navigate('/nft/history')}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="失败"
            value={statistics.failed_count}
            icon={<ExclamationCircleOutlined />}
            color="#ff4444"
            onClick={() => navigate('/nft/assets')}
          />
        </Col>
      </Row>
    );
  };

  return (
    <div className="nft-dashboard-page">
      {/* 页面标题 */}
      <div className="page-header">
        <div className="header-content">
          <DashboardOutlined className="header-icon" />
          <div className="header-text">
            <h1 className="page-title">数据概览</h1>
            <p className="page-subtitle">实时监控 NFT 铸造状态和统计数据</p>
          </div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchStatistics} loading={loading}>
          刷新数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="stats-section">
        <Spin spinning={loading}>{renderStatCards()}</Spin>
      </div>

      {/* 快捷操作区 */}
      <div className="quick-actions-section">
        <h3 className="section-title">快捷操作</h3>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card className="quick-action-card" hoverable onClick={() => navigate('/nft/assets')}>
              <div className="action-content">
                <AppstoreOutlined className="action-icon" />
                <div className="action-text">
                  <h4>资产管理</h4>
                  <p>查看和管理可铸造资产</p>
                </div>
                <ArrowRightOutlined className="action-arrow" />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="quick-action-card" hoverable onClick={() => navigate('/nft/minting')}>
              <div className="action-content">
                <FireOutlined className="action-icon" />
                <div className="action-text">
                  <h4>铸造任务</h4>
                  <p>监控正在进行的铸造任务</p>
                </div>
                <ArrowRightOutlined className="action-arrow" />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="quick-action-card" hoverable onClick={() => navigate('/nft/history')}>
              <div className="action-content">
                <HistoryOutlined className="action-icon" />
                <div className="action-text">
                  <h4>铸造历史</h4>
                  <p>查看历史铸造记录</p>
                </div>
                <ArrowRightOutlined className="action-arrow" />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default NFTDashboard;
