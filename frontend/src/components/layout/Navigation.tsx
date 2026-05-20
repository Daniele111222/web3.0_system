import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store';
import { useEnterprise } from '../../hooks/useEnterprise';
import { Menu, Dropdown, Select, message } from 'antd';
import {
  LayoutDashboard,
  Building2,
  Files,
  Gem,
  LogOut,
  User,
  Wallet,
  ChevronDown,
  ClipboardCheck,
  Link2,
} from 'lucide-react';
import type { EnterpriseDetail } from '../../types';
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
  const {
    enterprises,
    currentEnterprise,
    isLoading: isEnterpriseLoading,
    fetchEnterprises,
    setCurrentEnterprise,
  } = useEnterprise();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const selectedEnterpriseId =
    currentEnterprise?.id || window.localStorage.getItem('current_enterprise_id') || undefined;
  const selectedEnterpriseName =
    currentEnterprise?.name ||
    enterprises.find((enterprise) => enterprise.id === selectedEnterpriseId)?.name;
  const enterpriseOptions = selectedEnterpriseId
    ? [
        {
          value: selectedEnterpriseId,
          label: selectedEnterpriseName || selectedEnterpriseId,
        },
        ...enterprises
          .filter((enterprise) => enterprise.id !== selectedEnterpriseId)
          .map((enterprise) => ({
            value: enterprise.id,
            label: enterprise.name || '未命名企业',
          })),
      ]
    : enterprises.map((enterprise) => ({
        value: enterprise.id,
        label: enterprise.name || '未命名企业',
      }));

  // 监听滚动事件，更新导航栏样式
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 处理登出
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

  /**
   * 打开菜单时加载企业列表，便于直接切换当前企业
   */
  useEffect(() => {
    if ((!isMobileMenuOpen && !isUserDropdownOpen) || enterprises.length > 0) {
      return;
    }

    fetchEnterprises(1, 100).catch((err) => {
      console.error('加载企业列表失败:', err);
      message.error('加载企业列表失败');
    });
  }, [enterprises.length, fetchEnterprises, isMobileMenuOpen, isUserDropdownOpen]);

  /**
   * 只有本地企业 id 但缺少详情时，补齐当前企业名称和信息
   */
  useEffect(() => {
    if (currentEnterprise || !selectedEnterpriseId) {
      return;
    }

    const enterprise = enterprises.find((item) => item.id === selectedEnterpriseId);

    if (!enterprise) {
      return;
    }

    setCurrentEnterprise({
      ...enterprise,
      members: enterprise.members || [],
    } as EnterpriseDetail);
  }, [currentEnterprise, enterprises, selectedEnterpriseId, setCurrentEnterprise]);

  /**
   * 导航项配置
   */
  const navItems = [
    { key: '/dashboard', icon: LayoutDashboard, label: '总览' },
    { key: '/enterprises', icon: Building2, label: '企业管理' },
    { key: '/assets', icon: Files, label: '资产管理' },
    { key: '/hardhat-wallets', icon: Wallet, label: 'Hardhat 钱包' },
    { key: '/nft', icon: Gem, label: 'NFT 铸造' },
    { key: '/approvals', icon: ClipboardCheck, label: '审批中心' },
    { key: '/blockchain-explorer', icon: Link2, label: '区块链浏览器' },
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
      label: '企业钱包',
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
        return;
      }

      if (key === 'wallet') {
        const enterpriseId =
          currentEnterprise?.id || window.localStorage.getItem('current_enterprise_id');

        if (!enterpriseId) {
          message.info('请先选择一个企业，再绑定企业钱包');
          navigate('/enterprises');
          return;
        }

        navigate(`/enterprises/${enterpriseId}?tab=settings&wallet=bind`);
      }
    },
    [currentEnterprise?.id, handleLogout, navigate]
  );

  const handleEnterpriseChange = useCallback(
    (enterpriseId: string) => {
      const enterprise = enterprises.find((item) => item.id === enterpriseId);

      if (!enterprise) {
        message.warning('未找到该企业，请刷新企业列表后重试');
        return;
      }

      setCurrentEnterprise({
        ...enterprise,
        members: enterprise.members || [],
      } as EnterpriseDetail);

      setIsUserDropdownOpen(false);
      message.success(`已切换到 ${enterprise.name}`);

      if (location.pathname.startsWith('/enterprises/') && location.pathname !== '/enterprises') {
        navigate(`/enterprises/${enterpriseId}${location.search}`, { replace: true });
      }
    },
    [enterprises, location.pathname, location.search, navigate, setCurrentEnterprise]
  );

  // 未认证用户不显示导航
  if (!isAuthenticated) {
    return null;
  }

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
            open={isUserDropdownOpen}
            onOpenChange={setIsUserDropdownOpen}
            trigger={['click']}
            placement="bottomRight"
            popupRender={(menu) => (
              <div className="user-dropdown-panel">
                <div className="user-enterprise-switcher">
                  <div className="user-enterprise-label">
                    <Building2 size={14} />
                    <span>当前企业</span>
                  </div>
                  <div className="enterprise-select-field">
                    <Select
                      showSearch
                      allowClear={false}
                      className="user-enterprise-select"
                      popupClassName="user-enterprise-select-popup"
                      placeholder="选择当前企业"
                      value={selectedEnterpriseId}
                      loading={isEnterpriseLoading}
                      disabled={isEnterpriseLoading && enterprises.length === 0}
                      optionFilterProp="label"
                      optionLabelProp="label"
                      onChange={handleEnterpriseChange}
                      options={enterpriseOptions}
                      notFoundContent={isEnterpriseLoading ? '正在加载企业...' : '暂无可选企业'}
                    />
                    {selectedEnterpriseId && (
                      <span className="enterprise-select-value">
                        {selectedEnterpriseName || selectedEnterpriseId}
                      </span>
                    )}
                  </div>
                </div>
                {menu}
              </div>
            )}
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

        {/* 移动端当前企业选择 */}
        <div className="mobile-enterprise-switcher">
          <div className="mobile-enterprise-label">
            <Building2 size={16} />
            <span>当前企业</span>
          </div>
          <div className="enterprise-select-field">
            <Select
              showSearch
              allowClear={false}
              className="mobile-enterprise-select"
              popupClassName="mobile-enterprise-select-popup"
              placeholder="选择当前企业"
              value={selectedEnterpriseId}
              loading={isEnterpriseLoading}
              disabled={isEnterpriseLoading && enterprises.length === 0}
              optionFilterProp="label"
              optionLabelProp="label"
              onChange={handleEnterpriseChange}
              options={enterpriseOptions}
              notFoundContent={isEnterpriseLoading ? '正在加载企业...' : '暂无可选企业'}
            />
            {selectedEnterpriseId && (
              <span className="enterprise-select-value">
                {selectedEnterpriseName || selectedEnterpriseId}
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
