import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 权限路由守卫组件
 * 未认证用户将被重定向到登录页面
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // 保存用户尝试访问的路径，登录后可以重定向回来
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
