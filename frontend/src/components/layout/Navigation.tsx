import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store';
import { Menu, Dropdown } from 'antd';
import {
  LayoutDashboard,
  Building2,
  Files,
  Gem,
  LogOut,
  User,
  Wallet,
  ChevronDown,
} from 'lucide-react';
import './Navigation.less';

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
    { key: '/dashboard', icon: LayoutDashboard, label: '权属看板' },
    { key: '/enterprises', icon: Building2, label: '企业管理' },
    { key: '/assets', icon: Files, label: '资产管理' },
    { key: '/nft', icon: Gem, label: 'NFT 铸造' },
  ];

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <User size={14} />,
      label: '个人资料',
    },
    {
      key: 'wallet',
      icon: <Wallet size={14} />,
      label: '钱包地址',
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogOut size={14} />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick = useCallback(
    ({ key }: { key: string }) => {
      if (key === 'logout') {
        handleLogout();
      }
    },
    [handleLogout]
  );

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
              <span className="brand-subtitle">Enterprise</span>
            </div>
          </NavLink>
        </div>

        {/* 桌面端导航菜单 - 使用 antd Menu */}
        <div className="nav-menu-desktop">
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={navItems.map((item) => ({
              key: item.key,
              label: (
                <NavLink to={item.key} className="nav-menu-link">
                  <item.icon size={18} className="nav-menu-icon" />
                  <span>{item.label}</span>
                </NavLink>
              ),
            }))}
            className="nav-antd-menu"
          />
        </div>

        {/* 桌面端用户信息 */}
        <div className="nav-user-desktop">
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick,
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <button className="user-dropdown-trigger">
              <div className="user-avatar">
                <User size={16} />
              </div>
              <div className="user-info">
                <span className="user-name">
                  {user?.full_name || user?.username || user?.email}
                </span>
                {user?.wallet_address && (
                  <span className="wallet-address">
                    {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                  </span>
                )}
              </div>
              <ChevronDown size={14} className="user-dropdown-arrow" />
            </button>
          </Dropdown>
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
          <div className="mobile-user-avatar">
            <User size={24} />
          </div>
          <div className="mobile-user-details">
            <span className="user-name">{user?.full_name || user?.username || user?.email}</span>
            {user?.wallet_address && (
              <span className="wallet-address">
                {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
              </span>
            )}
          </div>
        </div>

        {/* 移动端导航链接 */}
        <div className="mobile-nav-menu">
          <Menu
            mode="vertical"
            selectedKeys={[location.pathname]}
            items={navItems.map((item) => ({
              key: item.key,
              label: (
                <NavLink to={item.key} onClick={handleNavClick}>
                  <item.icon size={20} className="mobile-nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              ),
            }))}
            className="mobile-antd-menu"
          />
        </div>

        {/* 移动端登出按钮 */}
        <div className="mobile-logout">
          <button className="btn-logout-mobile" onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut size={18} />
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
