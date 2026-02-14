/**
 * 审批管理主页面
 * 作为审批功能的入口，包含待审批列表、审批历史等子页面
 */
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Badge, Spin } from 'antd';
import {
  ClipboardCheck,
  History,
  BarChart3,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
} from 'lucide-react';
// import { useApprovalStats } from '../../hooks/useApproval';
import './ApprovalLayout.less';

/**
 * 审批状态统计卡片组件
 */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`stat-card ${visible ? 'visible' : ''}`}
      style={{ '--card-color': color } as React.CSSProperties}
    >
      <div className="stat-icon">
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

/**
 * 审批管理主页面
 */
export default function ApprovalLayout() {
  const location = useLocation();
  // 暂时使用静态数据，避免频繁请求
  const stats = {
    pending: 12,
    approved: 156,
    rejected: 23,
    returned: 5,
  };
  const loading = false;

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      path: '/approvals/pending',
      icon: ClipboardCheck,
      label: '待审批',
      badge: stats?.pending || 0,
    },
    {
      path: '/approvals/history',
      icon: History,
      label: '审批历史',
    },
    {
      path: '/approvals/statistics',
      icon: BarChart3,
      label: '统计分析',
    },
  ];

  return (
    <div className="approval-layout">
      {/* 左侧边栏 */}
      <aside className="approval-sidebar">
        <div className="sidebar-header">
          <div className="header-icon">
            <ClipboardCheck size={28} />
          </div>
          <h1 className="header-title">审批中心</h1>
          <p className="header-subtitle">管理企业审批流程</p>
        </div>

        {/* 统计卡片区域 */}
        <div className="stats-section">
          {loading ? (
            <div className="stats-loading">
              <Spin size="small" />
              <span>加载统计数据...</span>
            </div>
          ) : (
            <>
              <StatCard
                icon={Clock}
                label="待审批"
                value={stats?.pending || 0}
                color="#1890ff"
                delay={0}
              />
              <StatCard
                icon={CheckCircle2}
                label="已通过"
                value={stats?.approved || 0}
                color="#52c41a"
                delay={100}
              />
              <StatCard
                icon={XCircle}
                label="已拒绝"
                value={stats?.rejected || 0}
                color="#ff4d4f"
                delay={200}
              />
              <StatCard
                icon={RotateCcw}
                label="已退回"
                value={stats?.returned || 0}
                color="#faad14"
                delay={300}
              />
            </>
          )}
        </div>

        {/* 导航菜单 */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path} className="nav-item">
                  <NavLink to={item.path} className={`nav-link ${active ? 'active' : ''}`}>
                    <span className="nav-icon">
                      <Icon size={20} />
                    </span>
                    <span className="nav-label">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge
                        count={item.badge}
                        className="nav-badge"
                        style={{
                          backgroundColor: '#ff4d4f',
                        }}
                      />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 底部信息 */}
        <div className="sidebar-footer">
          <div className="footer-decoration" />
          <p className="footer-text">IP-NFT Enterprise System</p>
          <p className="footer-version">v2.0.0</p>
        </div>
      </aside>

      {/* 主内容区域 */}
      <main className="approval-main">
        <Outlet />
      </main>
    </div>
  );
}
