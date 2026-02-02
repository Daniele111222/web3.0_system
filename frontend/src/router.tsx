import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/routes';
import { AuthPage } from './components/auth';
import { DashboardPage } from './components/dashboard';
import { EnterprisePage } from './components/enterprise';
import { AssetPageWrapper } from './components/asset';
import { NFTPage } from './components/nft';

/**
 * 应用路由配置
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'enterprises',
        element: <EnterprisePage />,
      },
      {
        path: 'assets',
        element: <AssetPageWrapper />,
      },
      {
        path: 'nft',
        element: <NFTPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
