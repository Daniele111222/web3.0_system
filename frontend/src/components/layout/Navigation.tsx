import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store';
import './Navigation.css';

/**
 * 导航菜单组件 - 极光科技风格
 * 提供主导航、用户信息和登出功能
 * 支持响应式布局和移动端汉堡菜单
 */
export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  /**
   * 监听滚动事件，更新导航栏样式
   */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    { to: '/dashboard', icon: 'dashboard', label: '权属看板' },
    { to: '/enterprises', icon: 'enterprise', label: '企业管理' },
    { to: '/assets', icon: 'assets', label: '资产管理' },
    { to: '/nft', icon: 'nft', label: 'NFT 铸造' },
  ];

  // 导航图标 SVG 映射
  const navIcons: Record<string, React.ReactNode> = {
    dashboard: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    enterprise: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9" />
      </svg>
    ),
    assets: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    nft: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  };

  return (
    <nav
      className={`navigation ${isScrolled ? 'scrolled' : ''}`}
      role="navigation"
      aria-label="主导航"
    >
      <div className="nav-container">
        {/* 品牌 Logo */}
        <div className="nav-brand">
          <NavLink to="/dashboard" className="brand-link" aria-label="返回首页">
            <div className="brand-logo-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-title">IP-NFT</span>
              <span className="brand-subtitle">Enterprise Platform</span>
            </div>
          </NavLink>
        </div>

        {/* 桌面端导航菜单 */}
        <ul className="nav-menu-desktop" role="menubar">
          {navItems.map((item) => (
            <li key={item.to} role="none">
              <NavLink
                to={item.to}
                className={({ isActive }) => (isActive ? 'active' : '')}
                role="menuitem"
                aria-current={location.pathname === item.to ? 'page' : undefined}
              >
                <span className="nav-icon" aria-hidden="true">
                  {navIcons[item.icon]}
                </span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* 桌面端用户信息 */}
        <div className="nav-user-desktop">
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
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
                  {navIcons[item.icon]}
                </span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* 移动端登出按钮 */}
        <div className="mobile-logout">
          <button className="btn-logout-mobile" onClick={handleLogout} disabled={isLoggingOut}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
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
