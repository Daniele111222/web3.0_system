import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/routes';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Enterprise from './pages/Enterprise';
import Assets from './pages/Assets';
import NFT from './pages/NFT';
import ApprovalLayout from './pages/Approval';
import PendingList from './pages/Approval/PendingList';
import History from './pages/Approval/History';
import ApprovalDetail from './pages/Approval/Detail';

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
      {
        path: 'approvals',
        element: <ApprovalLayout />,
        children: [
          {
            path: 'pending',
            element: <PendingList />,
          },
          {
            path: 'pending/:approvalId',
            element: <ApprovalDetail />,
          },
          {
            path: 'history',
            element: <History />,
          },
          {
            path: 'history/:approvalId',
            element: <ApprovalDetail />,
          },
          {
            path: '',
            element: <Navigate to="pending" replace />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
