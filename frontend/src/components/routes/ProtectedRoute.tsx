import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 权限路由守卫组件
 * 未认证用户将被重定向到登录页面
 * 同时验证 localStorage 中的 token 是否存在，防止 persist 中间件恢复过期状态
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, accessToken } = useAuthStore();
  const location = useLocation();

  // 双重验证：既检查 isAuthenticated 状态，也验证 token 是否真实存在
  // 这样可以防止 persist 中间件从 localStorage 恢复过期/无效的认证状态
  const hasValidToken = !!accessToken && !!localStorage.getItem('access_token');

  if (!isAuthenticated || !hasValidToken) {
    // 如果认证状态无效，先清除可能存在的过期状态
    if (!hasValidToken) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('auth-storage');
    }

    // 保存用户尝试访问的路径，登录后可以重定向回来
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
