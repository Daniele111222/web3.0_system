/**
 * NFT 模块布局组件
 * 提供子导航和统一布局
 */
import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Layout, Menu, Breadcrumb } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  FireOutlined,
  HistoryOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import './NFTLayout.less';

const { Content, Sider } = Layout;
// const { Title, Text } = Typography;

// 子导航配置
const menuItems = [
  {
    key: '/nft/dashboard',
    icon: <DashboardOutlined />,
    label: '数据概览',
    path: '/nft/dashboard',
  },
  {
    key: '/nft/assets',
    icon: <AppstoreOutlined />,
    label: '资产管理',
    path: '/nft/assets',
  },
  {
    key: '/nft/minting',
    icon: <FireOutlined />,
    label: '铸造任务',
    path: '/nft/minting',
  },
  {
    key: '/nft/history',
    icon: <HistoryOutlined />,
    label: '铸造历史',
    path: '/nft/history',
  },
  {
    key: '/nft/contracts',
    icon: <FileTextOutlined />,
    label: '合约管理',
    path: '/nft/contracts',
  },
];

// 面包屑映射
const breadcrumbMap: Record<string, string> = {
  '/nft': 'NFT 中心',
  '/nft/dashboard': '数据概览',
  '/nft/assets': '资产管理',
  '/nft/minting': '铸造任务',
  '/nft/history': '铸造历史',
  '/nft/contracts': '合约管理',
};

/**
 * NFT 布局组件
 */
export const NFTLayout: React.FC = () => {
  const location = useLocation();

  // 生成面包屑
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: { path: string; label: string }[] = [];
    let currentPath = '';

    paths.forEach((path) => {
      currentPath += `/${path}`;
      const label = breadcrumbMap[currentPath];
      if (label) {
        breadcrumbs.push({ path: currentPath, label });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <Layout className="nft-layout">
      {/* 侧边栏导航 */}
      <Sider width={220} className="nft-sider" breakpoint="lg" collapsedWidth={80}>
        <div className="sider-header">
          <ThunderboltOutlined className="header-icon" />
          <span className="header-text">NFT 中心</span>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          className="nft-menu"
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: (
              <NavLink to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
                {item.label}
              </NavLink>
            ),
          }))}
        />
      </Sider>

      {/* 主内容区 */}
      <Layout className="nft-main-layout">
        {/* 面包屑导航 */}
        <div className="breadcrumb-wrapper">
          <Breadcrumb className="nft-breadcrumb">
            <Breadcrumb.Item>
              <NavLink to="/">首页</NavLink>
            </Breadcrumb.Item>
            {breadcrumbs.map((crumb, index) => (
              <Breadcrumb.Item key={crumb.path}>
                {index === breadcrumbs.length - 1 ? (
                  <span>{crumb.label}</span>
                ) : (
                  <NavLink to={crumb.path}>{crumb.label}</NavLink>
                )}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>

        {/* 页面内容 */}
        <Content className="nft-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default NFTLayout;
