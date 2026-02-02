import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import './Navigation.css';

/**
 * 导航菜单组件
 */
export function Navigation() {
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/auth');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>IP-NFT 管理平台</h2>
        </div>

        <ul className="nav-menu">
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon">📊</span>
              权属看板
            </NavLink>
          </li>
          <li>
            <NavLink to="/enterprises" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon">🏢</span>
              企业管理
            </NavLink>
          </li>
          <li>
            <NavLink to="/assets" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon">📁</span>
              资产管理
            </NavLink>
          </li>
          <li>
            <NavLink to="/nft" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon">🎨</span>
              NFT 铸造
            </NavLink>
          </li>
        </ul>

        <div className="nav-user">
          <div className="user-info">
            <span className="user-name">{user?.full_name || user?.username || user?.email}</span>
            {user?.wallet_address && (
              <span className="wallet-address">
                {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
              </span>
            )}
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            退出
          </button>
        </div>
      </div>
    </nav>
  );
}
