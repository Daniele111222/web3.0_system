import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store';
import './Navigation.css';

/**
 * 导航菜单组件
 * 提供主导航、用户信息和登出功能
 * 支持响应式布局和移动端汉堡菜单
 */
export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  /**
   * 处理登出
   * 包含错误处理和加载状态
   */
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      // 清除认证状态
      clearAuth();

      // 关闭移动端菜单
      setIsMobileMenuOpen(false);

      // 导航到登录页
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('登出失败:', error);
      // 即使出错也清除本地状态
      clearAuth();
      navigate('/auth');
    } finally {
      setIsLoggingOut(false);
    }
  }, [clearAuth, navigate, isLoggingOut]);

  /**
   * 切换移动端菜单
   */
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  /**
   * 关闭移动端菜单
   */
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  /**
   * 处理导航链接点击
   * 自动关闭移动端菜单
   */
  const handleNavClick = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  /**
   * 键盘导航支持
   * ESC 键关闭移动端菜单
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  /**
   * 点击外部关闭移动端菜单
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        isMobileMenuOpen
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  /**
   * 路由变化时关闭菜单
   */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // 未认证用户不显示导航
  if (!isAuthenticated) {
    return null;
  }

  /**
   * 导航项配置
   */
  const navItems = [
    { to: '/dashboard', icon: '📊', label: '权属看板' },
    { to: '/enterprises', icon: '🏢', label: '企业管理' },
    { to: '/assets', icon: '📁', label: '资产管理' },
    { to: '/nft', icon: '🎨', label: 'NFT 铸造' },
  ];

  return (
    <nav className="navigation" role="navigation" aria-label="主导航">
      <div className="nav-container">
        {/* 品牌 Logo */}
        <div className="nav-brand">
          <NavLink to="/dashboard" className="brand-link">
            <h1>IP-NFT 管理平台</h1>
          </NavLink>
        </div>

        {/* 桌面端导航菜单 */}
        <ul className="nav-menu nav-menu-desktop" role="menubar">
          {navItems.map((item) => (
            <li key={item.to} role="none">
              <NavLink
                to={item.to}
                className={({ isActive }) => (isActive ? 'active' : '')}
                role="menuitem"
                aria-current={location.pathname === item.to ? 'page' : undefined}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* 用户信息 - 桌面端 */}
        <div className="nav-user nav-user-desktop">
          <div className="user-info">
            <span className="user-name" title={user?.email}>
              {user?.full_name || user?.username || user?.email}
            </span>
            {user?.wallet_address && (
              <span className="wallet-address" title={user.wallet_address}>
                {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
              </span>
            )}
          </div>
          <button
            className="btn-logout"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="退出登录"
            title="退出登录"
          >
            {isLoggingOut ? '退出中...' : '退出'}
          </button>
        </div>

        {/* 移动端汉堡菜单按钮 */}
        <button
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </div>

      {/* 移动端菜单 */}
      <div
        ref={mobileMenuRef}
        id="mobile-menu"
        className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* 移动端用户信息 */}
        <div className="mobile-user-info">
          <span className="user-name">{user?.full_name || user?.username || user?.email}</span>
          {user?.wallet_address && (
            <span className="wallet-address">
              {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
            </span>
          )}
        </div>

        {/* 移动端导航链接 */}
        <ul className="mobile-nav-list" role="menu">
          {navItems.map((item) => (
            <li key={item.to} role="none">
              <NavLink
                to={item.to}
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={handleNavClick}
                role="menuitem"
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* 移动端登出按钮 */}
        <div className="mobile-logout">
          <button className="btn-logout-mobile" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? '退出中...' : '退出登录'}
          </button>
        </div>
      </div>

      {/* 移动端遮罩层 */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu} aria-hidden="true" />
      )}
    </nav>
  );
}
