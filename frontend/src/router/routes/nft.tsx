/**
 * NFT 模块路由配置
 * 包含所有NFT相关子路由
 */
import type { RouteObject } from 'react-router-dom';
import { NFTLayout } from '../../pages/NFT/components/NFTLayout';
import NFTDashboard from '../../pages/NFT/dashboard';
import NFTAssetsPage from '../../pages/NFT/assets';
import NFTMintingPage from '../../pages/NFT/minting';
import NFTHistoryPage from '../../pages/NFT/history';
import NFTContractsPage from '../../pages/NFT/contracts';

/**
 * NFT 模块路由配置
 */
export const nftRoutes: RouteObject[] = [
  {
    path: '/nft',
    element: <NFTLayout />,
    children: [
      {
        // 默认重定向到 dashboard
        index: true,
        element: <NFTDashboard />,
      },
      {
        path: 'dashboard',
        element: <NFTDashboard />,
        handle: {
          title: '数据概览',
          icon: 'DashboardOutlined',
        },
      },
      {
        path: 'assets',
        element: <NFTAssetsPage />,
        handle: {
          title: '资产管理',
          icon: 'AppstoreOutlined',
        },
      },
      {
        path: 'minting',
        element: <NFTMintingPage />,
        handle: {
          title: '铸造任务',
          icon: 'FireOutlined',
        },
      },
      {
        path: 'history',
        element: <NFTHistoryPage />,
        handle: {
          title: '铸造历史',
          icon: 'HistoryOutlined',
        },
      },
      {
        path: 'contracts',
        element: <NFTContractsPage />,
        handle: {
          title: '合约管理',
          icon: 'FileTextOutlined',
        },
      },
    ],
  },
];

export default nftRoutes;
