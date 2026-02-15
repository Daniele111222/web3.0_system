import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  ChevronRight,
  Users,
  Shield,
  MoreVertical,
  Filter,
  Loader2,
} from 'lucide-react';
import { EnterpriseForm } from './EnterpriseForm';
import { useEnterprise } from '../../hooks/useEnterprise';
import type { Enterprise } from '../../types';
import './Enterprise.less';

interface EnterpriseListProps {
  onSelectEnterprise?: (id: string) => void;
}

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
  const navigate = useNavigate();
  const { enterprises, isLoading, fetchEnterprises, createEnterprise, setCurrentEnterprise } =
    useEnterprise();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [particles] = useState(() => generateParticles(20));

  // 处理选择企业 - 使用路由导航
  const handleSelectEnterprise = (id: string) => {
    if (onSelectEnterprise) {
      onSelectEnterprise(id);
    } else {
      navigate(`/enterprises/${id}`);
    }
  };

  // 加载企业列表
  useEffect(() => {
    fetchEnterprises().catch(console.error);
  }, [fetchEnterprises]);

  // 过滤企业列表
  const filteredEnterprises = useMemo(() => {
    return enterprises.filter((enterprise) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        enterprise.name?.toLowerCase().includes(searchLower) ||
        enterprise.description?.toLowerCase().includes(searchLower) ||
        false;
      const matchesStatus = statusFilter
        ? (enterprise as Enterprise & { status?: string }).status === statusFilter
        : true;
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
  const handleFormSubmit = async (data: Partial<Enterprise>) => {
    try {
      await createEnterprise(
        data as {
          name: string;
          description: string;
          address: string;
          contactEmail: string;
          contactPhone: string;
        }
      );
      setShowForm(false);
    } catch (error) {
      console.error('创建企业失败:', error);
    }
  };

  // 渲染加载状态
  if (isLoading && enterprises.length === 0) {
    return (
      <div className="enterprise-page">
        <div className="enterprise-loading">
          <Loader2 size={48} className="animate-spin" />
          <p>正在加载企业列表...</p>
        </div>
      </div>
    );
  }

  // 错误状态不单独处理，由全局错误提示统一显示

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
              <Building2 className="logo-icon" size={24} />
            </div>
            <div className="enterprise-header-title-group">
              <h1 className="enterprise-header-title">企业管理</h1>
              <p className="enterprise-header-subtitle">管理您的企业组织、成员和权限</p>
            </div>
          </div>
          <div className="enterprise-header-actions">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus className="btn-icon" size={18} />
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
                onClick={() => {
                  setCurrentEnterprise({
                    ...enterprise,
                    members: [],
                  } as import('../../types').EnterpriseDetail);
                  handleSelectEnterprise(enterprise.id);
                }}
              >
                <div className="enterprise-card-header">
                  <div className="enterprise-logo">{enterprise.name?.charAt(0) ?? '?'}</div>
                  <div className="enterprise-info">
                    <h3 className="enterprise-name">{enterprise.name ?? '未命名企业'}</h3>
                    <span className="enterprise-id">ID: {enterprise.id.slice(0, 8)}...</span>
                  </div>
                </div>
                <div className="enterprise-card-body">
                  <p className="enterprise-description">{enterprise.description ?? '暂无描述'}</p>
                  <div className="enterprise-meta">
                    {enterprise.address && (
                      <div className="enterprise-meta-row">
                        <Building2 className="enterprise-meta-icon" size={16} />
                        <span className="enterprise-website">{enterprise.address}</span>
                      </div>
                    )}
                    <div className="enterprise-meta-row">
                      <Users className="enterprise-meta-icon" size={16} />
                      <span>{enterprise.member_count ?? 0} 名成员</span>
                    </div>
                  </div>
                </div>
                <div className="enterprise-card-footer">
                  {getStatusBadge(enterprise.is_verified === true ? 'active' : 'pending')}
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
                        handleSelectEnterprise(enterprise.id);
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
          <div className="modal animate-modal-in" onClick={(e) => e.stopPropagation()}>
            {/* Modal Decorative Glow */}
            <div className="modal-glow" />

            {/* Header Pattern */}
            <div className="modal-header-pattern" />

            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon-wrapper">
                  <Building2 size={20} />
                </div>
                <div className="modal-title-group">
                  <h2 className="modal-title">创建新企业</h2>
                  <p className="modal-subtitle">填写企业信息以创建新组织</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <span className="modal-close-icon">×</span>
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
