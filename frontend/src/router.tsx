import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/routes';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Enterprise from './pages/Enterprise';
import Assets from './pages/Assets';
import NFT from './pages/NFT';

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
    element: <Auth />,
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
        element: <Dashboard />,
      },
      {
        path: 'enterprises',
        element: <Enterprise />,
      },
      {
        path: 'assets',
        element: <Assets />,
      },
      {
        path: 'nft',
        element: <NFT />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
