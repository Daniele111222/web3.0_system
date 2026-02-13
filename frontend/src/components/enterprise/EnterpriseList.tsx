import { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  ChevronRight,
  Users,
  Shield,
  MoreVertical,
  Filter,
} from 'lucide-react';
import { EnterpriseForm } from './EnterpriseForm';
import type { Enterprise } from '../../types/enterprise';
import './Enterprise.less';

interface EnterpriseListProps {
  onSelectEnterprise: (id: string) => void;
}

// 模拟数据
const mockEnterprises: Enterprise[] = [
  {
    id: '1',
    name: '科技创新有限公司',
    description: '专注于人工智能和区块链技术研发',
    address: '北京市海淀区中关村软件园',
    contactEmail: 'contact@tech-innov.com',
    contactPhone: '010-88888888',
    status: 'active',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: '2',
    name: '未来数字集团',
    description: '数字资产管理和金融科技服务',
    address: '上海市浦东新区陆家嘴金融中心',
    contactEmail: 'info@future-digital.com',
    contactPhone: '021-66666666',
    status: 'active',
    createdAt: '2024-02-20T00:00:00Z',
    updatedAt: '2024-11-28T00:00:00Z',
  },
  {
    id: '3',
    name: '云端知识产权',
    description: '知识产权保护和交易服务平台',
    address: '深圳市南山区科技园',
    contactEmail: 'support@cloud-ip.com',
    contactPhone: '0755-33333333',
    status: 'pending',
    createdAt: '2024-12-10T00:00:00Z',
    updatedAt: '2024-12-10T00:00:00Z',
  },
  {
    id: '4',
    name: '链上资产管理',
    description: '区块链资产托管和交易服务',
    address: '杭州市西湖区西溪谷',
    contactEmail: 'hello@chain-asset.com',
    contactPhone: '0571-55555555',
    status: 'inactive',
    createdAt: '2024-03-05T00:00:00Z',
    updatedAt: '2024-09-15T00:00:00Z',
  },
];

// 生成漂浮粒子
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    style: {
      '--delay': `${Math.random() * 8}s`,
      '--duration': `${12 + Math.random() * 8}s`,
      '--x': `${Math.random() * 100}%`,
      '--size': `${2 + Math.random() * 3}px`,
    } as React.CSSProperties,
  }));
};

export const EnterpriseList = ({ onSelectEnterprise }: EnterpriseListProps) => {
  const [enterprises] = useState<Enterprise[]>(mockEnterprises);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [particles] = useState(() => generateParticles(20));

  // 过滤企业列表
  const filteredEnterprises = useMemo(() => {
    return enterprises.filter((enterprise) => {
      const matchesSearch =
        enterprise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enterprise.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter ? enterprise.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [enterprises, searchQuery, statusFilter]);

  // 获取状态显示
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      active: { label: '运营中', className: 'enterprise-status-active' },
      pending: { label: '审核中', className: 'enterprise-status-pending' },
      inactive: { label: '已停用', className: 'enterprise-status-inactive' },
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <span className={`enterprise-status ${config.className}`}>
        <span className="enterprise-status-dot" />
        {config.label}
      </span>
    );
  };

  // 处理表单提交
  const handleFormSubmit = (data: Partial<Enterprise>) => {
    console.log('创建企业:', data);
    setShowForm(false);
    // TODO: 调用API创建企业
  };

  return (
    <div className="enterprise-page">
      {/* Aurora Background Effect */}
      <div className="aurora-bg">
        <div className="aurora-layer aurora-1" />
        <div className="aurora-layer aurora-2" />
        <div className="aurora-layer aurora-3" />
      </div>

      {/* Floating Particles */}
      <div className="enterprise-particles">
        {particles.map((particle) => (
          <span key={particle.id} className="enterprise-particle" style={particle.style} />
        ))}
      </div>

      {/* Grid Pattern */}
      <div className="enterprise-grid-pattern" />

      {/* Header */}
      <header className="enterprise-header">
        <div className="enterprise-header-content">
          <div className="enterprise-header-left">
            <div className="brand-logo-compact">
              <Building2 className="logo-icon" />
            </div>
            <div className="enterprise-header-title-group">
              <h1 className="enterprise-header-title">企业管理</h1>
              <p className="enterprise-header-subtitle">管理您的企业组织、成员和权限</p>
            </div>
          </div>
          <div className="enterprise-header-actions">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus className="btn-icon" />
              创建企业
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="enterprise-main">
        <div className="enterprise-content">
          {/* Stats Section */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-primary">
                <Building2 size={24} />
              </div>
              <div className="stat-value">{enterprises.length}</div>
              <div className="stat-label">企业总数</div>
              <div className="stat-change stat-change-positive">+2 本月新增</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-secondary">
                <Users size={24} />
              </div>
              <div className="stat-value">156</div>
              <div className="stat-label">成员总数</div>
              <div className="stat-change stat-change-positive">+12 本月新增</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-accent">
                <Shield size={24} />
              </div>
              <div className="stat-value">98%</div>
              <div className="stat-label">安全评分</div>
              <div className="stat-change stat-change-positive">+2% 较上月</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-primary">
                <Building2 size={24} />
              </div>
              <div className="stat-value">3</div>
              <div className="stat-label">运营中企业</div>
              <div className="stat-change stat-change-positive">运营正常</div>
            </div>
          </section>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-bar">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="搜索企业名称或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-chips">
              <button
                className={`filter-chip ${statusFilter === null ? 'filter-chip-active' : ''}`}
                onClick={() => setStatusFilter(null)}
              >
                <Filter size={14} />
                全部
              </button>
              <button
                className={`filter-chip ${statusFilter === 'active' ? 'filter-chip-active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                运营中
              </button>
              <button
                className={`filter-chip ${statusFilter === 'pending' ? 'filter-chip-active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                审核中
              </button>
            </div>
          </div>

          {/* Enterprise Grid */}
          <div className="enterprise-grid">
            {filteredEnterprises.map((enterprise, index) => (
              <div
                key={enterprise.id}
                className="enterprise-card animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => onSelectEnterprise(enterprise.id)}
              >
                <div className="enterprise-card-header">
                  <div className="enterprise-logo">{enterprise.name.charAt(0)}</div>
                  <div className="enterprise-info">
                    <h3 className="enterprise-name">{enterprise.name}</h3>
                    <span className="enterprise-id">ID: {enterprise.id}</span>
                  </div>
                </div>
                <div className="enterprise-card-body">
                  <p className="enterprise-description">{enterprise.description}</p>
                  <div className="enterprise-meta">
                    <div className="enterprise-meta-row">
                      <Building2 className="enterprise-meta-icon" size={16} />
                      <span>{enterprise.address}</span>
                    </div>
                    <div className="enterprise-meta-row">
                      <Users className="enterprise-meta-icon" size={16} />
                      <span>24 名成员</span>
                    </div>
                  </div>
                </div>
                <div className="enterprise-card-footer">
                  {getStatusBadge(enterprise.status)}
                  <div className="enterprise-card-actions">
                    <button
                      className="btn btn-ghost btn-sm btn-icon-only"
                      onClick={(e) => {
                        e.stopPropagation();
                        // 处理更多操作
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEnterprise(enterprise.id);
                      }}
                    >
                      查看详情
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredEnterprises.length === 0 && (
            <div className="enterprise-empty">
              <div className="enterprise-empty-icon">
                <Building2 size={36} />
              </div>
              <h3>暂无企业</h3>
              <p>您还没有创建或加入任何企业组织。点击上方按钮创建您的第一个企业。</p>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={18} />
                创建企业
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Enterprise Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">创建新企业</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <EnterpriseForm onSubmit={handleFormSubmit} onCancel={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 获取状态徽章
const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: '运营中', className: 'enterprise-status-active' },
    pending: { label: '审核中', className: 'enterprise-status-pending' },
    inactive: { label: '已停用', className: 'enterprise-status-inactive' },
  };
  const config = statusConfig[status] || statusConfig.inactive;
  return (
    <span className={`enterprise-status ${config.className}`}>
      <span className="enterprise-status-dot" />
      {config.label}
    </span>
  );
};
